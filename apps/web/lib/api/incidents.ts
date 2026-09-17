import type { Incident } from "@sih/types";
import type { IncidentCreateInput } from "@sih/validation";
import { apiGet, apiPost } from "./client";

export const incidentsApi = {
  /** Backed by the Account 2 GET addition — see docs/C2_HANDOFF.md. */
  list: (mineId: string) => apiGet<Incident[]>(`/api/incidents?mineId=${encodeURIComponent(mineId)}`),
  create: (input: IncidentCreateInput) => apiPost<Incident>("/api/incidents", input),
};
