import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { registerDocument, listDocumentsForOwner } from "../../../lib/services/documents";
import { toErrorResponse } from "../../../lib/errors";

const registerSchema = z.object({
  mineId: z.string().uuid().nullable(),
  ownerType: z.enum(["COMPLIANCE", "INSPECTION", "INCIDENT", "CONTRACTOR", "GRIEVANCE", "ENVIRONMENTAL", "OTHER"]),
  ownerId: z.string().uuid().nullable(),
  storagePath: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
const listQuerySchema = z.object({ ownerType: z.string(), ownerId: z.string().uuid() });

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = registerSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const doc = await registerDocument(ctx, db, body);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const { ownerType, ownerId } = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const db = new SupabaseDb(getSupabaseServerClient());
    const docs = await listDocumentsForOwner(ctx, db, ownerType, ownerId);
    return NextResponse.json({ data: docs });
  } catch (err) {
    return toErrorResponse(err);
  }
}
