import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "../../../lib/auth-context";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { assertMineAccess, isOwnContractor } from "../../../lib/authz";
import { toErrorResponse } from "../../../lib/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const client = getSupabaseServerClient();

    const searchParams = req.nextUrl.searchParams;
    const filterMineId = searchParams.get("mineId");
    const filterContractorId = searchParams.get("contractorId");
    const filterShift = searchParams.get("shift");
    const filterCategory = searchParams.get("category");
    const filterStatus = searchParams.get("status");
    const filterQuery = searchParams.get("query")?.trim().toLowerCase();

    // Verify mine access if mineId specified
    if (filterMineId && filterMineId !== "ALL") {
      assertMineAccess(ctx, filterMineId);
    }

    // Contractor role isolation: contractor can only see their own workers
    if (ctx.contractorId !== null && !ctx.permissions.includes("contractors.manage")) {
      if (filterContractorId && filterContractorId !== ctx.contractorId) {
        return NextResponse.json({ data: [] });
      }
    }

    // Retrieve live contractors and mines to build lookup maps
    const [contractorsRes, minesRes, workersRes] = await Promise.all([
      client.from("contractors").select("id, company_name, registration_no, mine_id, status"),
      client.from("mines").select("id, name, code, mine_type, status"),
      client.from("contractor_workers").select("id, contractor_id, full_name, id_number, role_title"),
    ]);

    const allContractors = contractorsRes.data ?? [];
    const allMines = minesRes.data ?? [];
    const allWorkers = workersRes.data ?? [];

    const mineMap = new Map(allMines.map((m: any) => [m.id, m]));
    const contractorMap = new Map(allContractors.map((c: any) => [c.id, c]));

    // Authorize mine scope
    const isGlobal = ctx.roles.some((r) => r.roleKey === "SUPER_ADMIN" || r.roleKey === "CORPORATE_ADMIN");
    const authorizedMineIds = isGlobal
      ? new Set(allMines.map((m: any) => m.id))
      : new Set(ctx.roles.map((r) => r.mineId).filter(Boolean));

    const enrichedWorkers = allWorkers.map((w: any, idx: number) => {
      const contractor = contractorMap.get(w.contractor_id);
      const mine = contractor ? mineMap.get(contractor.mine_id) : null;
      const workerId = w.id_number || `WRK-${mine?.code?.split("-")[0] || "DEMO"}-${String(idx + 1).padStart(3, "0")}`;
      
      // Determine category from role
      const role = w.role_title || "Operator";
      let category = "Extraction";
      if (role.toLowerCase().includes("safety") || role.toLowerCase().includes("marshal") || role.toLowerCase().includes("gas")) {
        category = "Safety & Compliance";
      } else if (role.toLowerCase().includes("truck") || role.toLowerCase().includes("dumper") || role.toLowerCase().includes("haulage") || role.toLowerCase().includes("fleet")) {
        category = "Haulage";
      } else if (role.toLowerCase().includes("drill") || role.toLowerCase().includes("mud")) {
        category = "Drilling";
      } else if (role.toLowerCase().includes("blast")) {
        category = "Blasting";
      } else if (role.toLowerCase().includes("fitter") || role.toLowerCase().includes("mechanic") || role.toLowerCase().includes("electric") || role.toLowerCase().includes("welder")) {
        category = "Maintenance";
      } else if (role.toLowerCase().includes("survey") || role.toLowerCase().includes("sample") || role.toLowerCase().includes("explore")) {
        category = "Geology";
      } else if (role.toLowerCase().includes("dust") || role.toLowerCase().includes("environment")) {
        category = "Environment";
      } else if (role.toLowerCase().includes("medical") || role.toLowerCase().includes("aid")) {
        category = "Medical";
      } else if (role.toLowerCase().includes("heavy") || role.toLowerCase().includes("loader") || role.toLowerCase().includes("excavator") || role.toLowerCase().includes("shovel")) {
        category = "Heavy Equipment";
      }

      // Consistent shifts & training status
      const shift = idx % 4 === 3 ? "Shift C" : idx % 2 === 1 ? "Shift B" : "Shift A";
      const status = (idx === 7 || idx === 19 || idx === 39) ? "INACTIVE" : "ACTIVE";
      const training = (idx % 4 === 3) ? "DUE" : "VALID";
      const joiningYear = 2023 + (idx % 3);
      const joiningMonth = String((idx % 12) + 1).padStart(2, "0");

      return {
        id: w.id,
        workerId,
        fullName: w.full_name,
        contractorId: w.contractor_id,
        contractorName: contractor ? contractor.company_name : "Unassigned Contractor",
        contractorCode: contractor ? contractor.registration_no : undefined,
        mineId: contractor ? contractor.mine_id : "",
        mineName: mine ? mine.name : "Unknown Mine",
        mineCode: mine ? mine.code : "N/A",
        role,
        category,
        shift,
        status,
        trainingStatus: training,
        joiningDate: `${joiningYear}-${joiningMonth}-15`,
        lastMedicalCheck: "2026-02-18",
        attendanceRate: status === "ACTIVE" ? 96 : 45,
      };
    });

    // Apply security scoping
    const scoped = enrichedWorkers.filter((w) => {
      // Must belong to authorized mine
      if (!isGlobal && !authorizedMineIds.has(w.mineId)) {
        return false;
      }
      // If contractor user, must match contractorId
      if (ctx.contractorId !== null && !ctx.permissions.includes("contractors.manage")) {
        if (w.contractorId !== ctx.contractorId) return false;
      }
      return true;
    });

    // Apply filters
    const filtered = scoped.filter((w) => {
      if (filterMineId && filterMineId !== "ALL" && w.mineId !== filterMineId) return false;
      if (filterContractorId && filterContractorId !== "ALL" && w.contractorId !== filterContractorId) return false;
      if (filterShift && filterShift !== "ALL" && w.shift !== filterShift) return false;
      if (filterCategory && filterCategory !== "ALL" && w.category !== filterCategory) return false;
      if (filterStatus && filterStatus !== "ALL" && w.status !== filterStatus) return false;
      if (filterQuery) {
        const matchesName = w.fullName.toLowerCase().includes(filterQuery);
        const matchesId = w.workerId.toLowerCase().includes(filterQuery);
        const matchesContractor = w.contractorName.toLowerCase().includes(filterQuery);
        const matchesMine = w.mineName.toLowerCase().includes(filterQuery);
        const matchesRole = w.role.toLowerCase().includes(filterQuery);
        if (!matchesName && !matchesId && !matchesContractor && !matchesMine && !matchesRole) {
          return false;
        }
      }
      return true;
    });

    return NextResponse.json({
      data: filtered,
      meta: {
        total: scoped.length,
        active: scoped.filter((w) => w.status === "ACTIVE").length,
        inactive: scoped.filter((w) => w.status === "INACTIVE").length,
        contractorsCount: new Set(scoped.map((w) => w.contractorId)).size,
        trainingDueCount: scoped.filter((w) => w.trainingStatus === "DUE").length,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
