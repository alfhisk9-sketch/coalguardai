import { NextResponse } from "next/server";
import { getAuthContext } from "../../../lib/auth-context";
import { toErrorResponse } from "../../../lib/errors";

/**
 * Account 2 addition — see docs/C2_HANDOFF.md "Backend changes made by Account 2".
 * Thin, read-only wrapper around the existing getAuthContext() used by every other
 * route. Frontend role-based navigation/dashboards need the resolved AuthContext
 * (roles + permissions + contractorId) client-side; this avoids duplicating the
 * user_roles/role_permissions resolution logic in a second place. No schema,
 * RLS, or contract change — reuses lib/auth-context.ts exactly as written.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    return NextResponse.json({ data: ctx });
  } catch (err) {
    return toErrorResponse(err);
  }
}
