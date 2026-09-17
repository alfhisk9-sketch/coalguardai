import { NextRequest, NextResponse } from "next/server";
import { contractorCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { z } from "zod";
import { createContractor, listContractors } from "../../../lib/services/contractors";
import { toErrorResponse } from "../../../lib/errors";

const querySchema = z.object({ mineId: z.string().uuid() });

/** Account 2 minimal integration addition — see docs/C2_HANDOFF.md. */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const { mineId } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const db = new SupabaseDb(getSupabaseServerClient());
    const contractors = await listContractors(ctx, db, mineId);
    return NextResponse.json({ data: contractors });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = contractorCreateSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const contractor = await createContractor(ctx, db, body);
    return NextResponse.json({ data: contractor }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
