import type { AuthContext } from "@sih/types";
import type { Db } from "../db/types";
import { assertPermission } from "../authz";

export async function listAuditLogs(ctx: AuthContext, db: Db) {
  assertPermission(ctx, "audit.view");
  return db.listAuditLogs();
}
