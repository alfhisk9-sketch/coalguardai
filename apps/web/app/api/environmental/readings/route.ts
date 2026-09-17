import { NextRequest, NextResponse } from "next/server";
import { environmentalReadingCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../../lib/auth-context";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { assertPermission } from "../../../../lib/authz";
import { toErrorResponse } from "../../../../lib/errors";

/**
 * STATUS: PARTIALLY IMPLEMENTED — route + Zod validation + permission check + direct
 * insert exist, but this module does NOT yet go through the Db/service abstraction used
 * by the 11 core modules, so it has no in-memory fake and no contract test. See HANDOFF.md.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    assertPermission(ctx, "mines.manage");
    const body = environmentalReadingCreateSchema.parse(await req.json());
    const status = body.thresholdValue !== undefined && body.value > body.thresholdValue ? "EXCEEDED" : "NORMAL";
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("environmental_readings")
      .insert({
        monitoring_point_id: body.monitoringPointId, parameter_type: body.parameterType,
        value: body.value, unit: body.unit, threshold_value: body.thresholdValue ?? null,
        status, recorded_by: ctx.userId, is_demo_content: true,
      })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    assertPermission(ctx, "mines.view");
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("environmental_readings")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return toErrorResponse(err);
  }
}

