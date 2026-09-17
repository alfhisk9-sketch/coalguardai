import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "../../../../../lib/auth-context";
import { SupabaseDb } from "../../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../../lib/supabase-client";
import { approveInspection } from "../../../../../lib/services/inspections";
import { toErrorResponse } from "../../../../../lib/errors";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    const inspection = await approveInspection(ctx, db, params.id);
    return NextResponse.json({ data: inspection });
  } catch (err) {
    return toErrorResponse(err);
  }
}
