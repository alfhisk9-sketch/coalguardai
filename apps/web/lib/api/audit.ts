import { apiGet } from "./client";

/** Frontend view type mirroring the backend AuditEntry response shape. */
export interface AuditEntryView {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt?: string;
  previousData?: unknown;
  newData?: unknown;
}

export const auditApi = {
  list: () => apiGet<AuditEntryView[]>("/api/audit"),
};
