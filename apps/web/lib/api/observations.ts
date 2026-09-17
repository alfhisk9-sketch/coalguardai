import type { InspectionObservation } from "@sih/types";
import type { ObservationCreateInput } from "@sih/validation";
import { apiGet, apiPost } from "./client";

export const observationsApi = {
  /** Backed by the Account 2 GET addition — see docs/C2_HANDOFF.md. */
  list: (inspectionId: string) => apiGet<InspectionObservation[]>(`/api/inspections/${inspectionId}/observations`),
  create: (inspectionId: string, input: ObservationCreateInput) =>
    apiPost<InspectionObservation>(`/api/inspections/${inspectionId}/observations`, input),
};
