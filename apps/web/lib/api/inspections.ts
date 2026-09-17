import type { Inspection } from "@sih/types";
import type { InspectionCreateInput } from "@sih/validation";
import { apiGet, apiPost } from "./client";

export const inspectionsApi = {
  /** Backed by the Account 2 GET addition — see docs/C2_HANDOFF.md. */
  list: (mineId: string) => apiGet<Inspection[]>(`/api/inspections?mineId=${encodeURIComponent(mineId)}`),
  create: (input: InspectionCreateInput) => apiPost<Inspection>("/api/inspections", input),
  approve: (id: string) => apiPost<Inspection>(`/api/inspections/${id}/approve`, {}),
};
