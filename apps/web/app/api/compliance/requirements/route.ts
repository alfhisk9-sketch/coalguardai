import { NextRequest, NextResponse } from "next/server";
import { complianceRequirementCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../../lib/auth-context";
import { SupabaseDb } from "../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { createComplianceRequirement } from "../../../../lib/services/compliance";
import { toErrorResponse } from "../../../../lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = complianceRequirementCreateSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const requirement = await createComplianceRequirement(ctx, db, body);
    return NextResponse.json({ data: requirement }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
