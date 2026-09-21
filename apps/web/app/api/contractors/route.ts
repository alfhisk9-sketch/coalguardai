import { NextRequest, NextResponse } from "next/server";
import { contractorCreateSchema } from "@sih/validation";
import { getAuthContext } from "../../../lib/auth-context";
import { SupabaseDb } from "../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../lib/supabase-client";
import { z } from "zod";
import { createContractor, listContractors } from "../../../lib/services/contractors";
import { toErrorResponse } from "../../../lib/errors";

const querySchema = z.object({
  mineId: z.string().uuid().or(z.literal("ALL")).optional(),
});

/** Account 2 minimal integration addition — see docs/C2_HANDOFF.md. */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    const mineId = parsed.success ? parsed.data.mineId : undefined;
    const client = getSupabaseServerClient();
    const db = new SupabaseDb(client);
    const contractors = await listContractors(ctx, db, mineId);

    // Enrich contractors with mine names, contract services, and live worker counts
    const { data: allMines } = await client.from("mines").select("id, name, code");
    const { data: allWorkers } = await client.from("contractor_workers").select("id, contractor_id");
    const { data: allContracts } = await client.from("contractor_contracts").select("contractor_id, scope");

    const mineMap = new Map((allMines ?? []).map((m: any) => [m.id, m]));
    const contractMap = new Map((allContracts ?? []).map((c: any) => [c.contractor_id, c.scope]));
    const workerCountMap = new Map<string, number>();
    for (const w of allWorkers ?? []) {
      const current = workerCountMap.get(w.contractor_id) ?? 0;
      workerCountMap.set(w.contractor_id, current + 1);
    }

    const enriched = contractors.map((c) => {
      const mine = mineMap.get(c.mineId);
      const totalW = workerCountMap.get(c.id) ?? 0;
      return {
        ...c,
        contractorId: c.registrationNo || `CTR-${mine?.code?.split("-")[0] || "GEN"}-001`,
        registrationNo: c.registrationNo || `CTR-${mine?.code?.split("-")[0] || "GEN"}-001`,
        primaryMineName: mine ? mine.name : "Primary Mine",
        primaryMineCode: mine ? mine.code : undefined,
        services: contractMap.get(c.id) || "Mining support & logistics",
        workerCount: totalW,
        activeWorkers: totalW,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = contractorCreateSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const contractor = await createContractor(ctx, db, body);
    return NextResponse.json({ data: contractor }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
