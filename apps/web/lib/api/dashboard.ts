import { apiGet } from "./client";

/** Mirrors MineDashboard from apps/web/lib/services/dashboard.ts (server-only module). */
export interface MineDashboardView {
  mineId: string;
  complianceScore: number;
  overdueCompliance: number;
  openInspections: number;
  criticalObservations: number;
  openIncidents: number;
}

export const dashboardApi = {
  forMine: (mineId: string) => apiGet<MineDashboardView>(`/api/dashboard/${mineId}`),
};
