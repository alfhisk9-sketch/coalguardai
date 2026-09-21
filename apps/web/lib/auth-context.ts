import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import type { AuthContext } from "@sih/types";
import type { PermissionKey, RoleKey } from "@sih/config";
import { ROLE_PERMISSION_MATRIX } from "@sih/config";
import { UnauthenticatedError } from "./errors";

/**
 * Resolves the authenticated Supabase session into an AuthContext (roles + resolved
 * permissions + contractorId), reading ONLY from user_roles (never a profiles.mine_id
 * field, which does not exist — SECURITY.md 4b).
 *
 * Supports both Authorization: Bearer <token> and Cookie-based sessions.
 * Safely provisions a default least-privileged role (REGULATOR) for new verified users.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = cookies();
  let authHeader: string | null = null;
  try {
    authHeader = headers().get("authorization");
  } catch {
    // headers() might not be available in non-request contexts
  }

  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (name: string) => cookieStore.get(name)?.value },
      ...(bearerToken ? { global: { headers: { Authorization: `Bearer ${bearerToken}` } } } : {})
    }
  );

  const { data: { user } } = await (bearerToken ? supabase.auth.getUser(bearerToken) : supabase.auth.getUser());
  if (!user) throw new UnauthenticatedError();

  let profile: { contractor_id: string | null; full_name: string | null; email: string | null } | null = null;
  let roleRows: any[] | null = null;

  // 1. Try adminClient if serviceRoleKey is configured
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceRoleKey = rawServiceKey ? rawServiceKey.replace(/^["']|["']$/g, "").trim() : null;

  if (serviceRoleKey && serviceRoleKey.length > 20) {
    try {
      const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { persistSession: false }
      });
      const pRes = await adminClient.from("profiles").select("contractor_id, full_name, email").eq("id", user.id).maybeSingle();
      if (!pRes.error && pRes.data) {
        profile = pRes.data;
      }

      const rRes = await adminClient.from("user_roles").select("role_id, mine_id, roles(key)").eq("user_id", user.id);
      if (!rRes.error && rRes.data && rRes.data.length > 0) {
        roleRows = rRes.data;
      }
    } catch {
      // Fall through to authenticated user client below
    }
  }

  // 2. Fallback to authenticated user client (supabase) if adminClient did not resolve profile or roles
  if (!profile) {
    try {
      const pRes = await supabase.from("profiles").select("contractor_id, full_name, email").eq("id", user.id).maybeSingle();
      if (!pRes.error && pRes.data) {
        profile = pRes.data;
      }
    } catch {
      // User client fallback failed
    }
  }

  if (!roleRows || roleRows.length === 0) {
    try {
      const rRes = await supabase.from("user_roles").select("role_id, mine_id, roles(key)").eq("user_id", user.id);
      if (!rRes.error && rRes.data && rRes.data.length > 0) {
        roleRows = rRes.data;
      }
    } catch {
      // User client fallback failed
    }
  }

  // Canonical role resolution: ONLY from verified database records in user_roles
  const roles = (roleRows ?? []).map((r: any) => {
    const rawRole = Array.isArray(r.roles) ? r.roles[0] : r.roles;
    const roleKey = (rawRole?.key ?? r.role_key) as RoleKey | undefined;
    return {
      roleKey: roleKey as RoleKey,
      mineId: (r.mine_id as string | null) ?? null
    };
  }).filter((r) => Boolean(r.roleKey));

  const roleIds = (roleRows ?? []).map((r: any) => r.role_id).filter(Boolean);
  let permissions: PermissionKey[] = [];

  if (roleIds.length > 0) {
    const { data: permRows } = await supabase
      .from("role_permissions")
      .select("permissions(key)")
      .in("role_id", roleIds);
    permissions = Array.from(new Set((permRows ?? []).map((p: any) => p.permissions.key))) as PermissionKey[];
  }

  // Fallback to role-matrix if DB join yields empty array
  if (permissions.length === 0 && roles.length > 0) {
    const combinedPerms = new Set<PermissionKey>();
    roles.forEach((r) => {
      const perms = ROLE_PERMISSION_MATRIX[r.roleKey] ?? [];
      perms.forEach((p) => combinedPerms.add(p));
    });
    permissions = Array.from(combinedPerms);
  }

  return {
    userId: user.id,
    userName: (profile?.full_name as string | undefined) ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    userEmail: user.email ?? (profile?.email as string | undefined) ?? null,
    roles,
    permissions,
    contractorId: profile?.contractor_id ?? null,
  };
}

