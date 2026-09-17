import { NextRequest, NextResponse } from "next/server";
import { inspectionAnalysisInputSchema } from "@sih/validation";
import { getAuthContext } from "../../../../lib/auth-context";
import { assertPermission, assertMineAccess } from "../../../../lib/authz";
import { SupabaseDb } from "../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { getAIService } from "../../../../lib/ai/service";
import { toErrorResponse } from "../../../../lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    assertPermission(ctx, "ai.view");

    const body = inspectionAnalysisInputSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());

    const inspection = await db.getInspection(body.inspectionId);
    if (inspection) {
      assertMineAccess(ctx, inspection.mineId);
    }

    const ai = getAIService(db);
    const result = await ai.analyzeInspection(body);

    return NextResponse.json({ data: result });
  } catch (err) {
    return toErrorResponse(err);
  }
}
