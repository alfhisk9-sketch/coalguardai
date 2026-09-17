import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inspectionCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { createInspection, listInspections } from "../../../lib/services/inspections";
import { toErrorResponse } from "../../../lib/errors";

const querySchema = z.object({ mineId: z.string().uuid() });

/** Account 2 addition — see docs/C2_HANDOFF.md "Backend changes made by Account 2". */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const { mineId } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const db = new SupabaseDb(getSupabaseServerClient());
    const inspections = await listInspections(ctx, db, mineId);
    return NextResponse.json({ data: inspections });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = inspectionCreateSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const { inspection, wasExisting } = await createInspection(ctx, db, body);
    // Idempotent retry (API.md conventions): existing row -> 200, freshly created -> 201.
    return NextResponse.json({ data: inspection }, { status: wasExisting ? 200 : 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
