import { NextRequest, NextResponse } from "next/server";
import { observationCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../../../lib/auth-context";
import { SupabaseDb } from "../../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../../lib/supabase-client";
import { addObservation, listObservations } from "../../../../../lib/services/inspections";
import { toErrorResponse } from "../../../../../lib/errors";

/** Account 2 minimal integration addition — see docs/C2_HANDOFF.md. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    const observations = await listObservations(ctx, db, params.id);
    return NextResponse.json({ data: observations });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const body = observationCreateSchema.parse({ ...(await req.json()), inspectionId: params.id });
    const db = new SupabaseDb(getSupabaseServerClient());
    const { observation, wasExisting } = await addObservation(ctx, db, body);
    return NextResponse.json({ data: observation }, { status: wasExisting ? 200 : 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
