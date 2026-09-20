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

  let { data: profile } = await supabase.from("profiles").select("contractor_id, full_name, email").eq("id", user.id).maybeSingle();

  let { data: roleRows } = await supabase
    .from("user_roles")
    .select("role_id, mine_id, roles(key)")
    .eq("user_id", user.id);

  // If user is freshly signed up or OAuth verified and has no profile or roles yet,
  // auto-provision default profile and safe least-privileged role (REGULATOR) via server-side admin
  if (!profile || !roleRows || roleRows.length === 0) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { persistSession: false }
      });

      const fullName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User";

      if (!profile) {
        await adminClient.from("profiles").upsert({
          id: user.id,
          full_name: fullName,
          email: user.email ?? "",
          is_active: true
        }, { onConflict: "id" });
        profile = { contractor_id: null, full_name: fullName, email: user.email ?? "" };
      }

      if (!roleRows || roleRows.length === 0) {
        // Find REGULATOR role ID (least-privileged statutory oversight role)
        const { data: regRole } = await adminClient.from("roles").select("id").eq("key", "REGULATOR").single();
        if (regRole) {
          await adminClient.from("user_roles").insert({
            user_id: user.id,
            role_id: regRole.id,
            mine_id: null
          });
          roleRows = [{ role_id: regRole.id, mine_id: null, roles: { key: "REGULATOR" } }] as any;
        }
      }
    }
  }

  const roles = (roleRows ?? []).map((r: any) => ({ roleKey: r.roles.key as RoleKey, mineId: r.mine_id as string | null }));

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

