import { NextRequest, NextResponse } from "next/server";
import { grievanceCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../lib/auth-context";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { assertMineAccess } from "../../../lib/authz";
import { toErrorResponse } from "../../../lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = grievanceCreateSchema.parse(await req.json());
    assertMineAccess(ctx, body.mineId);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("grievances")
      .insert({
        mine_id: body.mineId, submitted_by: ctx.userId, category: body.category ?? null,
        title: body.title, description: body.description ?? null, priority: body.priority,
        status: "OPEN", is_confidential: true,
      })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
