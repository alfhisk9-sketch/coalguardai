import { NextResponse } from "next/server";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { listAuditLogs } from "../../../lib/services/audit";
import { toErrorResponse } from "../../../lib/errors";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    const logs = await listAuditLogs(ctx, db);
    return NextResponse.json({ data: logs });
  } catch (err) {
    return toErrorResponse(err);
  }
}
