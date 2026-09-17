import { NextRequest, NextResponse } from "next/server";
import { attendanceCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../lib/auth-context";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { assertMineAccess } from "../../../lib/authz";
import { toErrorResponse } from "../../../lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = attendanceCreateSchema.parse(await req.json());
    assertMineAccess(ctx, body.mineId);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("worker_attendance")
      .upsert(
        {
          worker_id: body.workerId, mine_id: body.mineId, attendance_date: body.attendanceDate,
          check_in: body.checkIn, check_out: body.checkOut, status: body.status,
          latitude: body.latitude, longitude: body.longitude, source: "MOBILE_APP",
          recorded_by: ctx.userId, client_operation_id: body.clientOperationId,
        },
        { onConflict: "client_operation_id", ignoreDuplicates: true }
      )
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
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get("mineId");
    if (mineId) assertMineAccess(ctx, mineId);

    const supabase = getSupabaseServerClient();
    let query = supabase.from("worker_attendance").select("*").order("attendance_date", { ascending: false }).limit(50);
    if (mineId) query = query.eq("mine_id", mineId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return toErrorResponse(err);
  }
}

