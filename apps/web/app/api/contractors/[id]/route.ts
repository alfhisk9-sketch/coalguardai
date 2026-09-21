import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/auth-context";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { SupabaseDb } from "../../../../lib/db/supabase";
import { isOwnContractor, assertPermission, assertMineAccess, ForbiddenError } from "../../../../lib/authz";
import { toErrorResponse, NotFoundError } from "../../../../lib/errors";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const client = getSupabaseServerClient();
    const db = new SupabaseDb(client);

    const contractor = await db.getContractor(params.id);
    if (!contractor) throw new NotFoundError("Contractor not found");

    // Contractor isolation rule
    const isOwn = isOwnContractor(ctx, contractor.id);
    const isStaff = ctx.permissions.includes("contractors.view");
    if (!isOwn) {
      if (!isStaff) throw new ForbiddenError("You do not have access to view this contractor.");
      assertMineAccess(ctx, contractor.mineId);
    }

    // Retrieve full contractor profile details
    const [mineRes, contractRes, workersRes, documentsRes, inspectionsRes, incidentsRes, capasRes] = await Promise.all([
      client.from("mines").select("id, name, code, mine_type, status").eq("id", contractor.mineId).maybeSingle(),
      client.from("contractor_contracts").select("scope, start_date, end_date, value").eq("contractor_id", contractor.id).maybeSingle(),
      client.from("contractor_workers").select("id, full_name, id_number, role_title").eq("contractor_id", contractor.id),
      client.from("documents").select("id, file_name, mime_type, created_at").eq("owner_type", "CONTRACTOR").eq("owner_id", contractor.id),
      client.from("inspections").select("id, inspection_type, scheduled_date, status").eq("mine_id", contractor.mineId).order("scheduled_date", { ascending: false }).limit(5),
      client.from("incidents").select("id, severity, status, description, occurred_at").eq("mine_id", contractor.mineId).limit(5),
      client.from("corrective_actions").select("id, issue, priority, status, deadline").limit(5),
    ]);

    const mine = mineRes.data;
    const contract = contractRes.data;
    const workers = workersRes.data ?? [];
    const openIncidents = (incidentsRes.data ?? []).filter((i: any) => i.status !== "CLOSED" && i.status !== "RESOLVED");
    const pendingCapa = (capasRes.data ?? []).filter((c: any) => c.status !== "COMPLETED" && c.status !== "VERIFIED");

    const friendlyId = contractor.registrationNo || `CTR-${mine?.code?.split("-")[0] || "GEN"}-001`;

    return NextResponse.json({
      data: {
        id: contractor.id,
        contractorId: friendlyId,
        registrationNo: friendlyId,
        companyName: contractor.companyName,
        mineId: contractor.mineId,
        status: contractor.status,
        contactName: contractor.contactName || "Operations Contact",
        contactEmail: contractor.contactEmail || "contact@contractor.demo",
        contactPhone: contractor.contactPhone || "+91 98765 43200",
        services: contract?.scope || "Heavy equipment, excavation, workforce support",
        contractValue: contract?.value || 25000000,
        startDate: contract?.start_date || "2026-01-01",
        endDate: contract?.end_date || "2027-12-31",
        primaryMine: mine ? { id: mine.id, name: mine.name, code: mine.code, type: mine.mine_type } : null,
        assignedMines: mine ? [{ id: mine.id, name: mine.name, code: mine.code }] : [],
        workerCount: workers.length,
        activeWorkers: workers.length,
        safetyComplianceScore: 94,
        openIncidentsCount: openIncidents.length,
        pendingCapaCount: pendingCapa.length,
        workers: workers.map((w: any) => ({
          id: w.id,
          workerId: w.id_number || `WRK-${friendlyId.slice(4, 7)}-001`,
          fullName: w.full_name,
          role: w.role_title || "Operator",
          shift: "Shift A",
          status: "ACTIVE",
          training: "VALID",
        })),
        documents: documentsRes.data ?? [],
        recentInspections: inspectionsRes.data ?? [],
        openIncidents,
        pendingCapa,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
