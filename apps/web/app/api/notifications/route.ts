import { NextResponse } from "next/server";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { listMyNotifications } from "../../../lib/services/notifications";
import { toErrorResponse } from "../../../lib/errors";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    const notifications = await listMyNotifications(ctx, db);
    return NextResponse.json({ data: notifications });
  } catch (err) {
    return toErrorResponse(err);
  }
}
