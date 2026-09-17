import { NextRequest, NextResponse } from "next/server";
import { mineSummaryInputSchema } from "@sih/validation";
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

    const body = mineSummaryInputSchema.parse(await req.json());
    assertMineAccess(ctx, body.mineId);

    const db = new SupabaseDb(getSupabaseServerClient());
    const ai = getAIService(db);
    const result = await ai.summarizeMine(body);

    return NextResponse.json({ data: result });
  } catch (err) {
    return toErrorResponse(err);
  }
}
