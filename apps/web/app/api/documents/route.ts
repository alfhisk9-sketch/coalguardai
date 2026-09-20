import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { registerDocument, listDocumentsForOwner } from "../../../lib/services/documents";
import { toErrorResponse } from "../../../lib/errors";

const DEMO_INSPECTION_ALIAS = "insp-001";
const DEMO_INSPECTION_UUID = "a0000000-0000-0000-0000-000000000230";

function resolveOwnerId(ownerType: string, rawOwnerId: string): string {
  // Controlled demo-data mapping for SIH prototype
  if (ownerType === "INSPECTION" && rawOwnerId === DEMO_INSPECTION_ALIAS) {
    return DEMO_INSPECTION_UUID;
  }

  // Strict UUID validation for production records
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(rawOwnerId)) {
    throw new Error(
      `Owner ID '${rawOwnerId}' is invalid. Provide a valid UUID or recognized demo identifier '${DEMO_INSPECTION_ALIAS}'.`
    );
  }
  return rawOwnerId;
}

const registerSchema = z.object({
  mineId: z.string().uuid().nullable(),
  ownerType: z.enum(["COMPLIANCE", "INSPECTION", "INCIDENT", "CONTRACTOR", "GRIEVANCE", "ENVIRONMENTAL", "OTHER"]),
  ownerId: z.string().uuid().nullable(),
  storagePath: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const rawJson = await req.json();

    if (rawJson.ownerType === "INSPECTION" && rawJson.ownerId === DEMO_INSPECTION_ALIAS) {
      rawJson.ownerId = DEMO_INSPECTION_UUID;
    }

    const body = registerSchema.parse(rawJson);
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
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const ownerType = searchParams.ownerType;
    const rawOwnerId = searchParams.ownerId;

    if (!ownerType || !rawOwnerId) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "ownerType and ownerId query parameters are required." } },
        { status: 400 }
      );
    }

    const resolvedOwnerId = resolveOwnerId(ownerType, rawOwnerId);
    const db = new SupabaseDb(getSupabaseServerClient());
    const docs = await listDocumentsForOwner(ctx, db, ownerType, resolvedOwnerId);
    return NextResponse.json({ data: docs });
  } catch (err) {
    return toErrorResponse(err);
  }
}
