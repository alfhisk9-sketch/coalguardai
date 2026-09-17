import * as React from "react";
import { inspectionCreateSchema, observationCreateSchema, incidentCreateSchema, attendanceCreateSchema } from "@sih/validation";
import { loadQueue, saveQueue } from "./storage";
import { detectConnection, processQueue, type ConnectionState } from "./sync";
import {
  clearableOperations,
  summarize,
  type QueuedOperation,
  type QueueSnapshot,
  type SyncableEntity,
} from "./queue";

function uuid(): string {
  // expo-crypto is optional; this is sufficient for a client operation id, which only
  // needs to be unique per device, not cryptographically strong.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface EnqueueInput {
  entity: SyncableEntity;
  endpoint: string;
  payload: Record<string, unknown>;
  label: string;
  photos?: string[];
  dependsOn?: string | null;
}

interface QueueState {
  operations: QueuedOperation[];
  snapshot: QueueSnapshot;
  connection: ConnectionState;
  syncing: boolean;
  ready: boolean;
  enqueue: (input: EnqueueInput) => Promise<QueuedOperation>;
  syncAll: () => Promise<void>;
  retryOne: (id: string) => Promise<void>;
  clearSynced: () => Promise<void>;
}

const Ctx = React.createContext<QueueState | null>(null);

/** Client-side validation uses the SAME shared Zod schemas the API routes use. */
const SCHEMAS: Partial<Record<SyncableEntity, { safeParse: (v: unknown) => { success: boolean } }>> = {
  inspections: inspectionCreateSchema,
  inspection_observations: observationCreateSchema,
  incidents: incidentCreateSchema,
  worker_attendance: attendanceCreateSchema,
};

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = React.useState<QueuedOperation[]>([]);
  const [connection, setConnection] = React.useState<ConnectionState>("UNKNOWN");
  const [syncing, setSyncing] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  // Restore the queue before anything can be captured, so a crash mid-inspection
  // never silently starts from an empty queue.
  React.useEffect(() => {
    loadQueue().then((ops) => {
      setOperations(ops);
      setReady(true);
    });
  }, []);

  React.useEffect(() => {
    if (ready) void saveQueue(operations);
  }, [operations, ready]);

  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const state = await detectConnection();
      if (!cancelled) setConnection(state);
    };
    void check();
    const timer = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const syncAll = React.useCallback(async () => {
    if (syncing) return;
    const state = await detectConnection();
    setConnection(state);
    if (state === "OFFLINE") return;
    setSyncing(true);
    try {
      const result = await processQueue(operations);
      setOperations(result.operations);
    } finally {
      setSyncing(false);
    }
  }, [operations, syncing]);

  // Opportunistic sync when connectivity returns.
  React.useEffect(() => {
    if (connection === "ONLINE" && ready && operations.some((o) => o.status !== "SYNCED")) {
      void syncAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, ready]);

  const enqueue = React.useCallback(async (input: EnqueueInput): Promise<QueuedOperation> => {
    const schema = SCHEMAS[input.entity];
    if (schema) {
      const parsed = schema.safeParse({ ...input.payload, clientOperationId: uuid(), clientCreatedAt: new Date().toISOString() });
      if (!parsed.success) {
        // Captured offline data is still validated at capture time, so a record can
        // never sit in the queue for hours only to be rejected on sync.
        throw new Error("This record is incomplete. Please check the form and try again.");
      }
    }

    const op: QueuedOperation = {
      id: uuid(),
      entity: input.entity,
      endpoint: input.endpoint,
      payload: input.payload,
      clientOperationId: uuid(),
      clientCreatedAt: new Date().toISOString(),
      status: "PENDING",
      attempts: 0,
      lastError: null,
      photos: (input.photos ?? []).map((localUri) => ({ localUri, uploadStatus: "PENDING" as const, documentId: null })),
      serverId: null,
      dependsOn: input.dependsOn ?? null,
      label: input.label,
    };

    setOperations((prev) => [...prev, op]);
    void detectConnection().then((state) => {
      if (state === "ONLINE") void syncAll();
    });
    return op;
  }, [syncAll]);

  const retryOne = React.useCallback(async (id: string) => {
    setOperations((prev) => prev.map((o) => (o.id === id ? { ...o, status: "PENDING", lastError: null } : o)));
    await syncAll();
  }, [syncAll]);

  const clearSynced = React.useCallback(async () => {
    setOperations((prev) => {
      const clearable = new Set(clearableOperations(prev).map((o) => o.id));
      return prev.filter((o) => !clearable.has(o.id));
    });
  }, []);

  const value = React.useMemo<QueueState>(
    () => ({
      operations,
      snapshot: summarize(operations),
      connection,
      syncing,
      ready,
      enqueue,
      syncAll,
      retryOne,
      clearSynced,
    }),
    [operations, connection, syncing, ready, enqueue, syncAll, retryOne, clearSynced]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useQueue(): QueueState {
  const value = React.useContext(Ctx);
  if (!value) throw new Error("useQueue must be used inside <QueueProvider>.");
  return value;
}
