import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { AuthContext } from "@sih/types";
import type { PermissionKey, RoleKey } from "@sih/config";
import { UnauthenticatedError } from "./errors";

/**
 * Resolves the authenticated Supabase session into an AuthContext (roles + resolved
 * permissions + contractorId), reading ONLY from user_roles (never a profiles.mine_id
 * field, which does not exist — SECURITY.md 4b).
 *
 * STATUS: written against the documented schema but NOT VERIFIED against a live
 * Supabase project (none is provisioned in this environment). The query shape mirrors
 * fn_user_has_permission/fn_user_has_mine_access in 0003_rbac.sql exactly, so it should
 * be correct, but this specific file has not been run against a real session/JWT.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new UnauthenticatedError();

  const { data: profile } = await supabase.from("profiles").select("contractor_id, full_name, email").eq("id", user.id).maybeSingle();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role_id, mine_id, roles(key)")
    .eq("user_id", user.id);

  const roles = (roleRows ?? []).map((r: any) => ({ roleKey: r.roles.key as RoleKey, mineId: r.mine_id as string | null }));

  const { data: permRows } = await supabase
    .from("role_permissions")
    .select("permissions(key)")
    .in("role_id", (roleRows ?? []).map((r: any) => r.role_id).filter(Boolean));

  const permissions = Array.from(new Set((permRows ?? []).map((p: any) => p.permissions.key))) as PermissionKey[];

  return {
    userId: user.id,
    userName: (profile?.full_name as string | undefined) ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    userEmail: user.email ?? (profile?.email as string | undefined) ?? null,
    roles,
    permissions,
    contractorId: profile?.contractor_id ?? null,
  };
}
