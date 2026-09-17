import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/auth-context";
import { SupabaseDb } from "../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { getMineDashboard } from "../../../../lib/services/dashboard";
import { toErrorResponse } from "../../../../lib/errors";

export async function GET(_req: NextRequest, { params }: { params: { mineId: string } }) {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    const dashboard = await getMineDashboard(ctx, db, params.mineId);
    return NextResponse.json({ data: dashboard });
  } catch (err) {
    return toErrorResponse(err);
  }
}
