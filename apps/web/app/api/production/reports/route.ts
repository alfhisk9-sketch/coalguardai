import { NextRequest, NextResponse } from "next/server";
import { productionReportCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../../lib/auth-context";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { assertPermission, assertMineAccess } from "../../../../lib/authz";
import { toErrorResponse } from "../../../../lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = productionReportCreateSchema.parse(await req.json());
    assertPermission(ctx, "reports.generate");
    assertMineAccess(ctx, body.mineId);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("production_reports")
      .insert({
        mine_id: body.mineId, period_start: body.periodStart, period_end: body.periodEnd,
        target_quantity: body.targetQuantity, actual_quantity: body.actualQuantity ?? null,
        unit: body.unit, status: "DRAFT", submitted_by: ctx.userId,
      })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
