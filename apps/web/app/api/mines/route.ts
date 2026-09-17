import { NextRequest, NextResponse } from "next/server";
import { mineCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { listMinesForUser, createMine } from "../../../lib/services/mines";
import { toErrorResponse } from "../../../lib/errors";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    const mines = await listMinesForUser(ctx, db);
    return NextResponse.json({ data: mines });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = mineCreateSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const mine = await createMine(ctx, db, body);
    return NextResponse.json({ data: mine }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
