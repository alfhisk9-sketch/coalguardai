"use client";

import { minesApi } from "../api/mines";
import { dashboardApi, type MineDashboardView } from "../api/dashboard";
import type { Mine } from "@sih/types";
import { useAsync } from "./use-async";

export interface MinePortfolioRow {
  mine: Mine;
  dashboard: MineDashboardView | null;
}

/**
 * Composes the org-wide view client-side from /api/mines + per-mine /api/dashboard/:id.
 * C1 ships no cross-mine aggregate endpoint (see docs/C2_ANALYSIS.md §6.2); this is a
 * UI composition, not a backend contract change. A per-mine dashboard failure yields a
 * null dashboard for that row rather than failing the whole page.
 */
export function useMinePortfolio() {
  return useAsync<MinePortfolioRow[]>(async () => {
    const mines = (await minesApi.list()).data;
    return Promise.all(
      mines.map(async (mine) => {
        try {
          const dashboard = (await dashboardApi.forMine(mine.id)).data;
          return { mine, dashboard };
        } catch {
          return { mine, dashboard: null };
        }
      })
    );
  }, []);
}

export function aggregate(rows: MinePortfolioRow[]) {
  const withData = rows.filter((r) => r.dashboard !== null);
  const sum = (pick: (d: MineDashboardView) => number) =>
    withData.reduce((acc, r) => acc + (r.dashboard ? pick(r.dashboard) : 0), 0);
  const avgScore =
    withData.length === 0
      ? 0
      : Math.round(sum((d) => d.complianceScore) / withData.length);
  return {
    totalMines: rows.length,
    measuredMines: withData.length,
    avgComplianceScore: avgScore,
    overdueCompliance: sum((d) => d.overdueCompliance),
    openInspections: sum((d) => d.openInspections),
    openIncidents: sum((d) => d.openIncidents),
    criticalObservations: sum((d) => d.criticalObservations),
  };
}

/** UI risk banding derived from compliance score + open incidents. Not a regulatory rating. */
export function riskBand(row: MinePortfolioRow): "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN" {
  if (!row.dashboard) return "UNKNOWN";
  const { complianceScore, openIncidents, overdueCompliance } = row.dashboard;
  if (complianceScore < 60 || openIncidents >= 3 || overdueCompliance >= 5) return "HIGH";
  if (complianceScore < 85 || openIncidents > 0 || overdueCompliance > 0) return "MEDIUM";
  return "LOW";
}
