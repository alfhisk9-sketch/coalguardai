import type { Contractor } from "@sih/types";
import type { ContractorCreateInput } from "@sih/validation";
import { apiGet, apiPost } from "./client";

export interface Worker {
  id: string;
  contractorId: string;
  fullName: string;
}

export const contractorsApi = {
  /** Backed by the Account 2 GET addition — see docs/C2_HANDOFF.md. */
  list: (mineId: string) => apiGet<Contractor[]>(`/api/contractors?mineId=${encodeURIComponent(mineId)}`),
  create: (input: ContractorCreateInput) => apiPost<Contractor>("/api/contractors", input),
  listWorkers: (contractorId: string) => apiGet<Worker[]>(`/api/contractors/${contractorId}/workers`),
};
