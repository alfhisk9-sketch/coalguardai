import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "../../../../../lib/auth-context";
import { SupabaseDb } from "../../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../../lib/supabase-client";
import { listWorkersForContractor } from "../../../../../lib/services/contractors";
import { toErrorResponse, NotFoundError } from "../../../../../lib/errors";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    const contractor = await db.getContractor(params.id);
    if (!contractor) throw new NotFoundError();
    const workers = await listWorkersForContractor(ctx, db, params.id, contractor.mineId);
    return NextResponse.json({ data: workers });
  } catch (err) {
    return toErrorResponse(err);
  }
}
