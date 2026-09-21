import { NextRequest, NextResponse } from "next/server";
import { assistantQueryInputSchema } from "@sih/validation";
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

    const body = assistantQueryInputSchema.parse(await req.json());
    if (body.mineId) {
      assertMineAccess(ctx, body.mineId);
    }

    const db = new SupabaseDb(getSupabaseServerClient());
    const ai = getAIService(db);

    const result = await ai.answerAssistantQuery(body, ctx);

    return NextResponse.json({ data: result });

  } catch (err) {
    return toErrorResponse(err);
  }
}
