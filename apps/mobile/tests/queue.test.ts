import { describe, it, expect } from "vitest";
import {
  clearableOperations,
  hasUnsyncedWork,
  markFailed,
  markPhotoFailed,
  markPhotoUploaded,
  markSynced,
  markSyncing,
  pendingPhotos,
  readyToSync,
  resolveDependency,
  summarize,
  type QueuedOperation,
} from "../src/lib/queue";

function op(overrides: Partial<QueuedOperation> = {}): QueuedOperation {
  return {
    id: "op-1",
    entity: "inspections",
    endpoint: "/api/inspections",
    payload: { mineId: "mine-1" },
    clientOperationId: "cid-1",
    clientCreatedAt: "2026-09-16T08:00:00.000Z",
    status: "PENDING",
    attempts: 0,
    lastError: null,
    photos: [],
    serverId: null,
    dependsOn: null,
    label: "Routine inspection",
    ...overrides,
  };
}

describe("queue state transitions", () => {
  it("summarizes counts by status", () => {
    const ops = [op({ id: "a" }), op({ id: "b", status: "SYNCED" }), op({ id: "c", status: "FAILED" })];
    expect(summarize(ops)).toEqual({ pending: 1, syncing: 0, failed: 1, synced: 1, total: 3 });
  });

  it("moves PENDING → SYNCING → SYNCED and records the server id", () => {
    const syncing = markSyncing(op());
    expect(syncing.status).toBe("SYNCING");
    const synced = markSynced(syncing, "server-uuid");
    expect(synced.status).toBe("SYNCED");
    expect(synced.serverId).toBe("server-uuid");
    expect(synced.lastError).toBeNull();
  });

  it("moves PENDING → SYNCING → FAILED and increments the attempt count", () => {
    const failed = markFailed(markSyncing(op()), "Network unreachable");
    expect(failed.status).toBe("FAILED");
    expect(failed.attempts).toBe(1);
    expect(failed.lastError).toBe("Network unreachable");

    const failedAgain = markFailed(markSyncing(failed), "Still unreachable");
    expect(failedAgain.attempts).toBe(2);
  });

  it("makes a FAILED operation eligible for retry, not stuck", () => {
    const failed = markFailed(op(), "boom");
    expect(readyToSync([failed]).map((o) => o.id)).toEqual(["op-1"]);
  });

  it("never re-sends an already SYNCED operation", () => {
    expect(readyToSync([op({ status: "SYNCED" })])).toHaveLength(0);
  });
});

describe("parent/child dependency ordering", () => {
  const parent = op({ id: "insp", entity: "inspections" });
  const child = op({
    id: "obs",
    entity: "inspection_observations",
    endpoint: "/api/inspections/pending/observations",
    payload: { inspectionId: "insp", description: "Guard rail missing", severity: "HIGH" },
    dependsOn: "insp",
  });

  it("withholds an observation until its inspection has synced", () => {
    expect(readyToSync([parent, child]).map((o) => o.id)).toEqual(["insp"]);
  });

  it("releases the observation once the inspection syncs", () => {
    const syncedParent = markSynced(parent, "server-insp");
    expect(readyToSync([syncedParent, child]).map((o) => o.id)).toEqual(["obs"]);
  });

  it("rewrites the child's inspectionId and endpoint to the real server id", () => {
    const syncedParent = markSynced(parent, "server-insp");
    const resolved = resolveDependency(child, [syncedParent, child]);
    expect(resolved.payload.inspectionId).toBe("server-insp");
    expect(resolved.endpoint).toBe("/api/inspections/server-insp/observations");
  });

  it("leaves the child untouched while the parent is unsynced", () => {
    const resolved = resolveDependency(child, [parent, child]);
    expect(resolved.payload.inspectionId).toBe("insp");
  });
});

describe("photo handling never loses a record", () => {
  const withPhoto = op({
    status: "SYNCED",
    serverId: "server-1",
    photos: [{ localUri: "file:///a.jpg", uploadStatus: "PENDING", documentId: null }],
  });

  it("keeps the parent record SYNCED when a photo upload fails", () => {
    const after = markPhotoFailed(withPhoto, "file:///a.jpg");
    expect(after.status).toBe("SYNCED");
    expect(after.photos[0]?.uploadStatus).toBe("FAILED");
  });

  it("marks a photo uploaded with its document id", () => {
    const after = markPhotoUploaded(withPhoto, "file:///a.jpg", "doc-1");
    expect(after.photos[0]?.uploadStatus).toBe("UPLOADED");
    expect(after.photos[0]?.documentId).toBe("doc-1");
  });

  it("re-queues a failed photo for another attempt", () => {
    const after = markPhotoFailed(withPhoto, "file:///a.jpg");
    expect(pendingPhotos([after])).toHaveLength(1);
  });

  it("does not consider a record clearable while a photo is outstanding", () => {
    expect(clearableOperations([withPhoto])).toHaveLength(0);
    expect(hasUnsyncedWork([withPhoto])).toBe(true);
  });

  it("clears a record only once it and all its photos are done", () => {
    const done = markPhotoUploaded(withPhoto, "file:///a.jpg", "doc-1");
    expect(clearableOperations([done])).toHaveLength(1);
    expect(hasUnsyncedWork([done])).toBe(false);
  });
});

describe("idempotency contract", () => {
  it("preserves clientOperationId across retries so the server can deduplicate", () => {
    const first = markFailed(markSyncing(op()), "timeout");
    const second = markSyncing(first);
    const third = markSynced(second, "server-1");
    expect(first.clientOperationId).toBe("cid-1");
    expect(third.clientOperationId).toBe("cid-1");
  });
});
