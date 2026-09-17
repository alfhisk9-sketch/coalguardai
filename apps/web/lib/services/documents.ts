import type { AuthContext } from "@sih/types";
import type { Db, DocumentRecord } from "../db/types";
import { assertPermission } from "../authz";
import { ForbiddenError } from "../authz";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB, re-validated server-side per STORAGE.md
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);

export async function registerDocument(
  ctx: AuthContext, db: Db,
  input: { mineId: string | null; ownerType: string; ownerId: string | null; storagePath: string; fileName: string; mimeType: string; sizeBytes: number }
): Promise<DocumentRecord> {
  assertPermission(ctx, "documents.upload");
  if (input.sizeBytes > MAX_UPLOAD_BYTES) throw new ForbiddenError("File exceeds maximum upload size.");
  if (!ALLOWED_MIME.has(input.mimeType)) throw new ForbiddenError("File type not allowed.");

  const doc = await db.createDocument({
    mineId: input.mineId, ownerType: input.ownerType, ownerId: input.ownerId,
    storagePath: input.storagePath, fileName: input.fileName, mimeType: input.mimeType, uploadedBy: ctx.userId,
  });
  await db.logAudit({ actorId: ctx.userId, action: "document.uploaded", entityType: "document", entityId: doc.id, newData: { fileName: doc.fileName, ownerType: doc.ownerType } });
  return doc;
}

export async function listDocumentsForOwner(ctx: AuthContext, db: Db, ownerType: string, ownerId: string) {
  return db.listDocuments(ownerType, ownerId);
}
