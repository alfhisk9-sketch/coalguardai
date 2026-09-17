import type { ComplianceRecord } from "@sih/types";
import { apiGet, apiPatch } from "./client";

export interface ComplianceRecordUpdateInput {
  status: ComplianceRecord["status"];
  notes?: string;
  completedDate?: string;
}

export const complianceApi = {
  listRecords: (mineId: string) => apiGet<ComplianceRecord[]>(`/api/compliance/records?mineId=${encodeURIComponent(mineId)}`),
  updateRecord: (id: string, input: ComplianceRecordUpdateInput) => apiPatch<ComplianceRecord>(`/api/compliance/records/${id}`, input),
};
