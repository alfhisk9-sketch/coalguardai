import type { Contractor } from "@sih/types";
import type { ContractorCreateInput } from "@sih/validation";
import { apiGet, apiPost } from "./client";

export interface Worker {
  id: string;
  workerId?: string;
  contractorId: string;
  contractorName?: string;
  mineId?: string;
  mineName?: string;
  mineCode?: string;
  fullName: string;
  role?: string;
  category?: string;
  shift?: string;
  status?: "ACTIVE" | "INACTIVE";
  trainingStatus?: "VALID" | "DUE" | "OVERDUE";
  joiningDate?: string;
  lastMedicalCheck?: string;
  attendanceRate?: number;
}

export interface EnrichedContractor extends Contractor {
  contractorId?: string;
  primaryMineName?: string;
  primaryMineCode?: string;
  services?: string;
  workerCount?: number;
  activeWorkers?: number;
}

export interface ContractorDetail extends EnrichedContractor {
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  primaryMine?: { id: string; name: string; code: string; type: string } | null;
  assignedMines?: Array<{ id: string; name: string; code: string }>;
  safetyComplianceScore?: number;
  openIncidentsCount?: number;
  pendingCapaCount?: number;
  workers?: Worker[];
  documents?: Array<{ id: string; file_name: string; mime_type: string; created_at: string }>;
  recentInspections?: Array<{ id: string; inspection_type: string; scheduled_date: string; status: string }>;
  openIncidents?: any[];
  pendingCapa?: any[];
}

export interface WorkersApiResponse {
  data: Worker[];
  meta: {
    total: number;
    active: number;
    inactive: number;
    contractorsCount: number;
    trainingDueCount: number;
  };
}

export const contractorsApi = {
  list: (mineId?: string) =>
    apiGet<EnrichedContractor[]>(
      mineId && mineId !== "ALL"
        ? `/api/contractors?mineId=${encodeURIComponent(mineId)}`
        : `/api/contractors`
    ),
  get: (id: string) => apiGet<ContractorDetail>(`/api/contractors/${encodeURIComponent(id)}`),
  create: (input: ContractorCreateInput) => apiPost<Contractor>("/api/contractors", input),
  listWorkers: (contractorId: string) => apiGet<Worker[]>(`/api/contractors/${encodeURIComponent(contractorId)}/workers`),
};

export const workersApi = {
  list: (params?: {
    mineId?: string | null;
    contractorId?: string | null;
    shift?: string | null;
    status?: string | null;
    category?: string | null;
    query?: string | null;
  }) => {
    const sp = new URLSearchParams();
    if (params?.mineId && params.mineId !== "ALL") sp.set("mineId", params.mineId);
    if (params?.contractorId && params.contractorId !== "ALL") sp.set("contractorId", params.contractorId);
    if (params?.shift && params.shift !== "ALL") sp.set("shift", params.shift);
    if (params?.status && params.status !== "ALL") sp.set("status", params.status);
    if (params?.category && params.category !== "ALL") sp.set("category", params.category);
    if (params?.query) sp.set("query", params.query);
    const qs = sp.toString();
    return apiGet<Worker[]>(qs ? `/api/workers?${qs}` : "/api/workers");
  },
};

