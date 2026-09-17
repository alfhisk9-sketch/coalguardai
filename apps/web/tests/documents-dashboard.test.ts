import { describe, it, expect, beforeEach } from "vitest";
import { MemoryDb } from "../lib/db/memory";
import { registerDocument, listDocumentsForOwner } from "../lib/services/documents";
import { getMineDashboard } from "../lib/services/dashboard";
import { ForbiddenError } from "../lib/authz";
import { mineManagerA, inspectorA, contractorUserA, MINE_A, MINE_B } from "./fixtures";

describe("documents contract", () => {
  let db: MemoryDb;
  beforeEach(() => { db = new MemoryDb(); });

  it("a user with documents.upload can register a document", async () => {
    const doc = await registerDocument(inspectorA, db, { mineId: MINE_A, ownerType: "INSPECTION", ownerId: "insp-1", storagePath: "path/x.jpg", fileName: "x.jpg", mimeType: "image/jpeg", sizeBytes: 1024 });
    expect(doc.id).toBeTruthy();
  });

  it("disallowed MIME type is rejected server-side, not just client-side (STORAGE.md)", async () => {
    await expect(
      registerDocument(inspectorA, db, { mineId: MINE_A, ownerType: "INSPECTION", ownerId: "insp-1", storagePath: "p", fileName: "x.exe", mimeType: "application/x-msdownload", sizeBytes: 100 })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("oversized file is rejected server-side", async () => {
    await expect(
      registerDocument(inspectorA, db, { mineId: MINE_A, ownerType: "INSPECTION", ownerId: "insp-1", storagePath: "p", fileName: "x.pdf", mimeType: "application/pdf", sizeBytes: 999_999_999 })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("documents are retrievable scoped to their owning entity", async () => {
    await registerDocument(inspectorA, db, { mineId: MINE_A, ownerType: "INSPECTION", ownerId: "insp-1", storagePath: "p1", fileName: "a.jpg", mimeType: "image/jpeg", sizeBytes: 10 });
    await registerDocument(inspectorA, db, { mineId: MINE_A, ownerType: "INSPECTION", ownerId: "insp-2", storagePath: "p2", fileName: "b.jpg", mimeType: "image/jpeg", sizeBytes: 10 });
    const docs = await listDocumentsForOwner(inspectorA, db, "INSPECTION", "insp-1");
    expect(docs).toHaveLength(1);
    expect(docs[0]?.fileName).toBe("a.jpg");
  });
});

describe("dashboard scope contract", () => {
  let db: MemoryDb;
  beforeEach(() => { db = new MemoryDb(); });

  it("mine-scoped user gets dashboard data only for their mine", async () => {
    db.complianceRecords.push(
      { id: "r1", requirementId: "req", mineId: MINE_A, dueDate: "2026-01-01", completedDate: "2026-01-01", status: "COMPLIANT", notes: null },
      { id: "r2", requirementId: "req", mineId: MINE_A, dueDate: "2026-01-01", completedDate: null, status: "OVERDUE", notes: null }
    );
    const dashboard = await getMineDashboard(mineManagerA, db, MINE_A, new Date("2026-06-01"));
    expect(dashboard.complianceScore).toBe(50);
    expect(dashboard.overdueCompliance).toBe(1);
  });

  it("requesting dashboard data for a mine outside scope is forbidden, not silently empty", async () => {
    await expect(getMineDashboard(mineManagerA, db, MINE_B)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("CONTRACTOR role has no mine scope at all and is forbidden from any mine dashboard", async () => {
    await expect(getMineDashboard(contractorUserA, db, MINE_A)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
