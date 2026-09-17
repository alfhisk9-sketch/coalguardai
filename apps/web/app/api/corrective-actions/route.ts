import { NextRequest, NextResponse } from "next/server";
import { correctiveActionCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { z } from "zod";
import { createCorrectiveAction, listCorrectiveActionsForMine } from "../../../lib/services/corrective-actions";
import { toErrorResponse } from "../../../lib/errors";

const querySchema = z.object({ mineId: z.string().uuid() });

/** Account 2 minimal integration addition — see docs/C2_HANDOFF.md. */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const { mineId } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const db = new SupabaseDb(getSupabaseServerClient());
    const actions = await listCorrectiveActionsForMine(ctx, db, mineId);
    return NextResponse.json({ data: actions });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = correctiveActionCreateSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const action = await createCorrectiveAction(ctx, db, body);
    return NextResponse.json({ data: action }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
