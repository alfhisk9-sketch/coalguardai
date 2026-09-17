import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { incidentCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { createIncident, listIncidents } from "../../../lib/services/incidents";
import { toErrorResponse } from "../../../lib/errors";

const querySchema = z.object({ mineId: z.string().uuid() });

/** Account 2 addition — see docs/C2_HANDOFF.md "Backend changes made by Account 2". */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const { mineId } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const db = new SupabaseDb(getSupabaseServerClient());
    const incidents = await listIncidents(ctx, db, mineId);
    return NextResponse.json({ data: incidents });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = incidentCreateSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const { incident, wasExisting } = await createIncident(ctx, db, body);
    return NextResponse.json({ data: incident }, { status: wasExisting ? 200 : 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
