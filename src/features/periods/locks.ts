import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { periodItems } from "@/db/schema";

/**
 * Template already copied into any quincena (snapshot lives on period_items).
 * Used to block delete; template edits do not rewrite open/closed periods.
 */
export async function sourceUsedInPeriod(userId: string, sourceId: string) {
  const [row] = await db
    .select({ n: sql<number>`1` })
    .from(periodItems)
    .where(and(eq(periodItems.userId, userId), eq(periodItems.sourceId, sourceId)))
    .limit(1);
  return Boolean(row);
}
