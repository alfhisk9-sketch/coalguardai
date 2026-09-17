import type { CorrectiveAction } from "@sih/types";
import type { CorrectiveActionCreateInput } from "@sih/validation";
import { apiGet, apiPost } from "./client";

export const correctiveActionsApi = {
  /** Backed by the Account 2 GET addition — mine-scoped via source records. */
  list: (mineId: string) => apiGet<CorrectiveAction[]>(`/api/corrective-actions?mineId=${encodeURIComponent(mineId)}`),
  create: (input: CorrectiveActionCreateInput) => apiPost<CorrectiveAction>("/api/corrective-actions", input),
  verify: (id: string) => apiPost<CorrectiveAction>(`/api/corrective-actions/${id}/verify`, {}),
};
