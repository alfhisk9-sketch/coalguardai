import type { AuthContext } from "@sih/types";
import type { Db } from "../db/types";

export async function listMyNotifications(ctx: AuthContext, db: Db) {
  return db.listNotifications(ctx.userId);
}

export async function markRead(ctx: AuthContext, db: Db, notificationId: string) {
  await db.markNotificationRead(notificationId, ctx.userId);
}
