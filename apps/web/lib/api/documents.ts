import { apiGet, apiPost } from "./client";

/**
 * Frontend view type. The backend's DocumentRecord lives in apps/web/lib/db/types.ts
 * (server-only, not exported from @sih/types), so this mirrors its response shape for
 * client components rather than importing a server module. Not a redefined DTO —
 * see docs/C2_ANALYSIS.md §6.4.
 */
export interface DocumentView {
  id: string;
  mineId: string | null;
  ownerType: string;
  ownerId: string | null;
  storagePath: string;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
}

export interface DocumentRegisterInput {
  mineId: string | null;
  ownerType: "COMPLIANCE" | "INSPECTION" | "INCIDENT" | "CONTRACTOR" | "GRIEVANCE" | "ENVIRONMENTAL" | "OTHER";
  ownerId: string | null;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const documentsApi = {
  listForOwner: (ownerType: string, ownerId: string) =>
    apiGet<DocumentView[]>(`/api/documents?ownerType=${encodeURIComponent(ownerType)}&ownerId=${encodeURIComponent(ownerId)}`),
  register: (input: DocumentRegisterInput) => apiPost<DocumentView>("/api/documents", input),
};
