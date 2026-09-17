import { NextRequest, NextResponse } from "next/server";
import { complianceRecordUpdateSchema } from "@sih/validation";
import { getAuthContext } from "../../../../../lib/auth-context";
import { SupabaseDb } from "../../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../../lib/supabase-client";
import { updateComplianceRecordStatus } from "../../../../../lib/services/compliance";
import { toErrorResponse } from "../../../../../lib/errors";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const body = complianceRecordUpdateSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const record = await updateComplianceRecordStatus(ctx, db, params.id, body);
    return NextResponse.json({ data: record });
  } catch (err) {
    return toErrorResponse(err);
  }
}
