import type { AuthContext } from "@sih/types";
import type { Db } from "../db/types";
import { assertMineAccess } from "../authz";
import { identifyOverdue } from "./compliance";

export interface MineDashboard {
  mineId: string;
  complianceScore: number; // % of records COMPLIANT, 0-100
  overdueCompliance: number;
  openInspections: number;
  criticalObservations: number; // placeholder count — observation join not modeled in Db yet
  openIncidents: number;
}

export async function getMineDashboard(ctx: AuthContext, db: Db, mineId: string, asOf = new Date()): Promise<MineDashboard> {
  assertMineAccess(ctx, mineId);

  const [records, inspections, incidents] = await Promise.all([
    db.listComplianceRecords(mineId),
    db.listInspectionsByMine(mineId),
    db.listIncidentsByMine(mineId),
  ]);

  const compliant = records.filter((r) => r.status === "COMPLIANT").length;
  const complianceScore = records.length === 0 ? 100 : Math.round((compliant / records.length) * 100);
  const overdueCompliance = identifyOverdue(records, asOf).length;
  const openInspections = inspections.filter((i) => i.status !== "APPROVED" && i.status !== "REJECTED").length;
  const openIncidents = incidents.filter((i) => i.status !== "CLOSED").length;

  // Real critical observations count across the mine's inspections
  const observationsByInsp = await Promise.all(
    inspections.map((i) => db.listObservationsByInspection(i.id).catch(() => []))
  );
  const criticalObservations = observationsByInsp
    .flat()
    .filter((o) => o.severity === "CRITICAL").length;

  return { mineId, complianceScore, overdueCompliance, openInspections, criticalObservations, openIncidents };
}

