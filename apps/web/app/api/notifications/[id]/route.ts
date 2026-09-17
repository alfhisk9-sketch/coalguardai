import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/auth-context";
import { SupabaseDb } from "../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { markRead } from "../../../../lib/services/notifications";
import { toErrorResponse } from "../../../../lib/errors";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const db = new SupabaseDb(getSupabaseServerClient());
    await markRead(ctx, db, params.id);
    return NextResponse.json({ data: { id: params.id, isRead: true } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
