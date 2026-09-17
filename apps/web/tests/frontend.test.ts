import { describe, it, expect } from "vitest";
import { ROLE_PERMISSION_MATRIX } from "@sih/config";
import { inspectionCreateSchema, observationCreateSchema, grievanceCreateSchema } from "@sih/validation";
import { visibleNavItems, NAV_ITEMS } from "../lib/nav";
import { statusVariant } from "../components/ui/badge";
import { ApiRequestError } from "../lib/api/client";
import { aggregate, riskBand, type MinePortfolioRow } from "../lib/hooks/use-portfolio";

/** Frontend tests (Account 2). These do not touch or weaken the C1 contract tests. */

describe("role-based navigation filtering", () => {
  it("gives SUPER_ADMIN every navigation entry", () => {
    const items = visibleNavItems([...ROLE_PERMISSION_MATRIX.SUPER_ADMIN]);
    expect(items).toHaveLength(NAV_ITEMS.length);
  });

  it("hides Administration from everyone without users.manage", () => {
    for (const role of ["MINE_MANAGER", "INSPECTOR", "CONTRACTOR", "REGULATOR"] as const) {
      const hrefs = visibleNavItems([...ROLE_PERMISSION_MATRIX[role]]).map((i) => i.href);
      expect(hrefs).not.toContain("/admin");
    }
  });

  it("hides the audit log from INSPECTOR, CONTRACTOR and REGULATOR", () => {
    for (const role of ["INSPECTOR", "CONTRACTOR", "REGULATOR"] as const) {
      const hrefs = visibleNavItems([...ROLE_PERMISSION_MATRIX[role]]).map((i) => i.href);
      expect(hrefs).not.toContain("/audit");
    }
    expect(visibleNavItems([...ROLE_PERMISSION_MATRIX.MINE_MANAGER]).map((i) => i.href)).toContain("/audit");
  });

  it("does not show inspections to a contractor", () => {
    const hrefs = visibleNavItems([...ROLE_PERMISSION_MATRIX.CONTRACTOR]).map((i) => i.href);
    expect(hrefs).not.toContain("/inspections");
  });

  it("shows the dashboard to every role", () => {
    for (const role of Object.keys(ROLE_PERMISSION_MATRIX) as (keyof typeof ROLE_PERMISSION_MATRIX)[]) {
      const hrefs = visibleNavItems([...ROLE_PERMISSION_MATRIX[role]]).map((i) => i.href);
      expect(hrefs).toContain("/dashboard");
    }
  });

  it("returns nothing for a caller with no permissions", () => {
    expect(visibleNavItems([])).toHaveLength(0);
  });
});

describe("form validation uses the shared schemas", () => {
  it("accepts a valid inspection payload with an idempotency key", () => {
    const result = inspectionCreateSchema.safeParse({
      mineId: "11111111-1111-1111-1111-111111111111",
      inspectionType: "Routine safety inspection",
      scheduledDate: "2026-09-16",
      clientOperationId: "22222222-2222-2222-2222-222222222222",
      clientCreatedAt: "2026-09-16T08:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an inspection with a non-uuid mineId and reports the field", () => {
    const result = inspectionCreateSchema.safeParse({ mineId: "", inspectionType: "Routine" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.mineId).toBeDefined();
    }
  });

  it("rejects an observation whose description is too short", () => {
    const result = observationCreateSchema.safeParse({
      inspectionId: "11111111-1111-1111-1111-111111111111",
      description: "no",
      severity: "HIGH",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.description).toBeDefined();
    }
  });

  it("rejects an invalid observation severity", () => {
    const result = observationCreateSchema.safeParse({
      inspectionId: "11111111-1111-1111-1111-111111111111",
      description: "Guard rail missing near the conveyor",
      severity: "CATASTROPHIC",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a grievance with no title", () => {
    const result = grievanceCreateSchema.safeParse({
      mineId: "11111111-1111-1111-1111-111111111111",
      title: "",
      priority: "MEDIUM",
    });
    expect(result.success).toBe(false);
  });
});

describe("API error handling", () => {
  it("carries the status and code through for the UI to branch on", () => {
    const err = new ApiRequestError(403, { code: "FORBIDDEN", message: "You do not have permission." });
    expect(err.status).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("You do not have permission.");
  });

  it("preserves validation details from a 400", () => {
    const err = new ApiRequestError(400, {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: { fieldErrors: { mineId: ["Required"] } },
    });
    expect(err.status).toBe(400);
    expect(err.details).toEqual({ fieldErrors: { mineId: ["Required"] } });
  });
});

describe("status badge mapping", () => {
  it("maps positive terminal states to success", () => {
    for (const s of ["COMPLIANT", "APPROVED", "VERIFIED", "CLOSED", "SYNCED"]) {
      expect(statusVariant(s)).toBe("success");
    }
  });

  it("maps failure states to destructive", () => {
    for (const s of ["OVERDUE", "NON_COMPLIANT", "CRITICAL", "EXCEEDED", "FAILED"]) {
      expect(statusVariant(s)).toBe("destructive");
    }
  });

  it("maps in-flight states to warning", () => {
    for (const s of ["DUE_SOON", "IN_PROGRESS", "PENDING", "OPEN"]) {
      expect(statusVariant(s)).toBe("warning");
    }
  });

  it("falls back to secondary for an unknown status", () => {
    expect(statusVariant("SOMETHING_NEW")).toBe("secondary");
  });
});

describe("portfolio aggregation", () => {
  const row = (id: string, dashboard: MinePortfolioRow["dashboard"]): MinePortfolioRow => ({
    mine: { id, regionId: "r1", name: `Mine ${id}`, code: id, mineType: "OPEN_CAST", latitude: null, longitude: null, status: "ACTIVE" },
    dashboard,
  });

  it("averages only the mines that reported, and counts every mine", () => {
    const rows = [
      row("a", { mineId: "a", complianceScore: 90, overdueCompliance: 0, openInspections: 1, criticalObservations: 0, openIncidents: 0 }),
      row("b", { mineId: "b", complianceScore: 70, overdueCompliance: 2, openInspections: 3, criticalObservations: 0, openIncidents: 1 }),
      row("c", null),
    ];
    const agg = aggregate(rows);
    expect(agg.totalMines).toBe(3);
    expect(agg.measuredMines).toBe(2);
    expect(agg.avgComplianceScore).toBe(80);
    expect(agg.overdueCompliance).toBe(2);
    expect(agg.openIncidents).toBe(1);
  });

  it("does not divide by zero when nothing reported", () => {
    expect(aggregate([row("a", null)]).avgComplianceScore).toBe(0);
  });

  it("bands risk from score, overdue items and open incidents", () => {
    expect(riskBand(row("a", { mineId: "a", complianceScore: 95, overdueCompliance: 0, openInspections: 0, criticalObservations: 0, openIncidents: 0 }))).toBe("LOW");
    expect(riskBand(row("b", { mineId: "b", complianceScore: 90, overdueCompliance: 1, openInspections: 0, criticalObservations: 0, openIncidents: 0 }))).toBe("MEDIUM");
    expect(riskBand(row("c", { mineId: "c", complianceScore: 50, overdueCompliance: 0, openInspections: 0, criticalObservations: 0, openIncidents: 0 }))).toBe("HIGH");
    expect(riskBand(row("d", { mineId: "d", complianceScore: 95, overdueCompliance: 0, openInspections: 0, criticalObservations: 0, openIncidents: 3 }))).toBe("HIGH");
  });

  it("reports UNKNOWN rather than guessing when a mine did not report", () => {
    expect(riskBand(row("e", null))).toBe("UNKNOWN");
  });
});
