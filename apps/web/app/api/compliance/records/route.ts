import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/auth-context";
import { SupabaseDb } from "../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { listComplianceRecords } from "../../../../lib/services/compliance";
import { toErrorResponse } from "../../../../lib/errors";
import { z } from "zod";

const querySchema = z.object({ mineId: z.string().uuid() });

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const { mineId } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const db = new SupabaseDb(getSupabaseServerClient());
    const records = await listComplianceRecords(ctx, db, mineId);
    return NextResponse.json({ data: records });
  } catch (err) {
    return toErrorResponse(err);
  }
}
