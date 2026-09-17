import * as Network from "expo-network";
import * as FileSystem from "expo-file-system";
import { apiPost, MobileApiError } from "./api";
import {
  markFailed,
  markPhotoFailed,
  markPhotoUploaded,
  markSynced,
  markSyncing,
  readyToSync,
  resolveDependency,
  type QueuedOperation,
} from "./queue";

export type ConnectionState = "ONLINE" | "OFFLINE" | "UNKNOWN";

export async function detectConnection(): Promise<ConnectionState> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected && state.isInternetReachable !== false ? "ONLINE" : "OFFLINE";
  } catch {
    return "UNKNOWN";
  }
}

/** Errors worth retrying. A 4xx (bad payload, forbidden) will never succeed on retry. */
function isRetryable(err: unknown): boolean {
  if (err instanceof MobileApiError) {
    return err.status >= 500 || err.status === 429 || err.status === 408;
  }
  return true; // network-level failure
}

export interface SyncResult {
  operations: QueuedOperation[];
  synced: number;
  failed: number;
}

/**
 * Processes the queue once. Called on app focus, on regaining connectivity, and on an
 * explicit "Sync all" tap.
 *
 * Ordering matters: parents before dependants, because an observation captured offline
 * has no real inspectionId until its inspection syncs. readyToSync() enforces this by
 * withholding any operation whose dependency has not yet reached SYNCED.
 */
export async function processQueue(ops: QueuedOperation[]): Promise<SyncResult> {
  let working = [...ops];
  let synced = 0;
  let failed = 0;

  // Repeat passes so a newly-synced parent unblocks its children within one run.
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    const batch = readyToSync(working);
    if (batch.length === 0) break;

    for (const queued of batch) {
      const op = resolveDependency(queued, working);
      working = working.map((o) => (o.id === op.id ? markSyncing(op) : o));

      try {
        const body = { ...op.payload, clientOperationId: op.clientOperationId, clientCreatedAt: op.clientCreatedAt };
        const { data } = await apiPost<{ id: string }>(op.endpoint, body);
        working = working.map((o) => (o.id === op.id ? markSynced({ ...op, status: "SYNCING" }, data.id) : o));
        synced += 1;
        madeProgress = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed.";
        const finalMessage = isRetryable(err) ? message : `${message} (will not retry automatically)`;
        working = working.map((o) => (o.id === op.id ? markFailed({ ...op, status: "SYNCING" }, finalMessage) : o));
        failed += 1;
      }
    }
  }

  // Photos are uploaded only AFTER their record exists, and their failure never
  // regresses the record's SYNCED status.
  working = await uploadPendingPhotos(working);

  return { operations: working, synced, failed };
}

async function uploadPendingPhotos(ops: QueuedOperation[]): Promise<QueuedOperation[]> {
  let working = [...ops];

  for (const op of working) {
    if (op.status !== "SYNCED" || !op.serverId) continue;
    const outstanding = op.photos.filter((p) => p.uploadStatus === "PENDING" || p.uploadStatus === "FAILED");
    if (outstanding.length === 0) continue;

    for (const photo of outstanding) {
      try {
        const info = await FileSystem.getInfoAsync(photo.localUri);
        if (!info.exists) {
          working = working.map((o) => (o.id === op.id ? markPhotoFailed(o, photo.localUri) : o));
          continue;
        }

        // Registers metadata against the parent record. Binary transfer to a private
        // Supabase Storage bucket is NOT IMPLEMENTED — see docs/C2_HANDOFF.md.
        const { data } = await apiPost<{ id: string }>("/api/documents", {
          mineId: (op.payload.mineId as string | undefined) ?? null,
          ownerType: op.entity === "incidents" ? "INCIDENT" : "INSPECTION",
          ownerId: op.serverId,
          storagePath: `field/${op.clientOperationId}/${photo.localUri.split("/").pop() ?? "photo.jpg"}`,
          fileName: photo.localUri.split("/").pop() ?? "photo.jpg",
          mimeType: "image/jpeg",
          sizeBytes: "size" in info && typeof info.size === "number" ? info.size : 1,
        });
        working = working.map((o) => (o.id === op.id ? markPhotoUploaded(o, photo.localUri, data.id) : o));
      } catch {
        // Failure is isolated to this photo. The inspection stays SYNCED and is never
        // lost because an image could not be transferred.
        working = working.map((o) => (o.id === op.id ? markPhotoFailed(o, photo.localUri) : o));
      }
    }
  }

  return working;
}
