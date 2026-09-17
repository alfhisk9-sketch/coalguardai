import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "../../../../../lib/auth-context";
import { SupabaseDb } from "../../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../../lib/supabase-client";
import { verifyCorrectiveAction } from "../../../../../lib/services/corrective-actions";
import { toErrorResponse } from "../../../../../lib/errors";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    const action = await verifyCorrectiveAction(ctx, db, params.id);
    return NextResponse.json({ data: action });
  } catch (err) {
    return toErrorResponse(err);
  }
}
