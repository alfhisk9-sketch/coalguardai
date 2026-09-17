import type { OFFLINE_SYNCABLE_ENTITIES } from "@sih/config";

/**
 * Offline operation queue — the core of the field workflow.
 *
 * Deliberately simple, per ARCHITECTURE.md §4c: a durable FIFO queue of pending POSTs
 * with idempotent retry. No CRDTs, no distributed merge. Conflict resolution is
 * server-wins, as defined by the C1 contract.
 *
 * Every queued operation carries a clientOperationId generated at capture time. The
 * server returns the existing row (200) rather than creating a duplicate if the same
 * id is retried, so retrying indefinitely from a flaky connection is safe.
 *
 * This module is intentionally pure — no React, no storage, no network — so the state
 * transitions are unit-testable without a device. See tests/queue.test.ts.
 */
export type SyncableEntity = (typeof OFFLINE_SYNCABLE_ENTITIES)[number];

export type OperationStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

export interface PhotoAttachment {
  /** Local file URI from expo-camera. The file lives on device and survives restarts. */
  localUri: string;
  uploadStatus: "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";
  /** Set once the binary is uploaded and registered via POST /api/documents. */
  documentId: string | null;
}

export interface QueuedOperation {
  id: string;
  entity: SyncableEntity;
  /** API path relative to the base URL, e.g. "/api/inspections". */
  endpoint: string;
  /** Request body, already shaped to the shared Zod schema at capture time. */
  payload: Record<string, unknown>;
  clientOperationId: string;
  clientCreatedAt: string;
  status: OperationStatus;
  attempts: number;
  lastError: string | null;
  photos: PhotoAttachment[];
  /** Server id once synced — lets dependent operations resolve their parent. */
  serverId: string | null;
  /** Queue id of a parent operation that must sync first (observation → inspection). */
  dependsOn: string | null;
  label: string;
}

export interface QueueSnapshot {
  pending: number;
  syncing: number;
  failed: number;
  synced: number;
  total: number;
}

export function summarize(ops: QueuedOperation[]): QueueSnapshot {
  return {
    pending: ops.filter((o) => o.status === "PENDING").length,
    syncing: ops.filter((o) => o.status === "SYNCING").length,
    failed: ops.filter((o) => o.status === "FAILED").length,
    synced: ops.filter((o) => o.status === "SYNCED").length,
    total: ops.length,
  };
}

/** Operations eligible to send: PENDING or FAILED, whose dependency (if any) has synced. */
export function readyToSync(ops: QueuedOperation[]): QueuedOperation[] {
  const syncedIds = new Set(ops.filter((o) => o.status === "SYNCED").map((o) => o.id));
  return ops.filter(
    (o) => (o.status === "PENDING" || o.status === "FAILED") && (o.dependsOn === null || syncedIds.has(o.dependsOn))
  );
}

/**
 * Resolves a child's payload against its parent's server id once the parent syncs.
 * An observation captured offline references its inspection by *queue* id; only after
 * the inspection syncs does a real inspectionId exist.
 */
export function resolveDependency(op: QueuedOperation, ops: QueuedOperation[]): QueuedOperation {
  if (op.dependsOn === null) return op;
  const parent = ops.find((o) => o.id === op.dependsOn);
  if (!parent?.serverId) return op;
  if (op.entity === "inspection_observations") {
    return {
      ...op,
      payload: { ...op.payload, inspectionId: parent.serverId },
      endpoint: `/api/inspections/${parent.serverId}/observations`,
    };
  }
  return op;
}

export function markSyncing(op: QueuedOperation): QueuedOperation {
  return { ...op, status: "SYNCING", lastError: null };
}

export function markSynced(op: QueuedOperation, serverId: string): QueuedOperation {
  return { ...op, status: "SYNCED", serverId, lastError: null };
}

export function markFailed(op: QueuedOperation, error: string): QueuedOperation {
  return { ...op, status: "FAILED", attempts: op.attempts + 1, lastError: error };
}

/**
 * A photo upload failure must never fail its parent record — losing a whole inspection
 * because one image upload timed out is the exact failure this queue exists to prevent.
 * The record stays SYNCED; the photo stays queued for its own retry.
 */
export function markPhotoFailed(op: QueuedOperation, localUri: string): QueuedOperation {
  return {
    ...op,
    photos: op.photos.map((p) => (p.localUri === localUri ? { ...p, uploadStatus: "FAILED" as const } : p)),
  };
}

export function markPhotoUploaded(op: QueuedOperation, localUri: string, documentId: string): QueuedOperation {
  return {
    ...op,
    photos: op.photos.map((p) =>
      p.localUri === localUri ? { ...p, uploadStatus: "UPLOADED" as const, documentId } : p
    ),
  };
}

/** Safe to clear: fully synced records whose photos have all uploaded. */
export function clearableOperations(ops: QueuedOperation[]): QueuedOperation[] {
  return ops.filter((o) => o.status === "SYNCED" && o.photos.every((p) => p.uploadStatus === "UPLOADED"));
}

export function hasUnsyncedWork(ops: QueuedOperation[]): boolean {
  return ops.some((o) => o.status !== "SYNCED" || o.photos.some((p) => p.uploadStatus !== "UPLOADED"));
}

/** Photos still needing an upload attempt, across every operation. */
export function pendingPhotos(ops: QueuedOperation[]): { op: QueuedOperation; photo: PhotoAttachment }[] {
  return ops.flatMap((op) =>
    op.photos
      .filter((p) => p.uploadStatus === "PENDING" || p.uploadStatus === "FAILED")
      .map((photo) => ({ op, photo }))
  );
}
