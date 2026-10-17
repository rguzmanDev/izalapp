import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { fuelLogs, periodItems, transactions } from "@/db/schema";

/**
 * Template already copied into any quincena.
 * Restrictive: account, split, due day, fuel flag, and delete stay locked.
 */
export async function sourceUsedInPeriod(userId: string, sourceId: string) {
  const [row] = await db
    .select({ n: sql<number>`1` })
    .from(periodItems)
    .where(and(eq(periodItems.userId, userId), eq(periodItems.sourceId, sourceId)))
    .limit(1);
  return Boolean(row);
}

/** Budget already has fuel loads; «es gasolina» must stay on. */
export async function sourceHasFuelLogs(userId: string, sourceId: string) {
  const [row] = await db
    .select({ n: sql<number>`1` })
    .from(fuelLogs)
    .innerJoin(transactions, eq(fuelLogs.transactionId, transactions.id))
    .innerJoin(periodItems, eq(transactions.itemId, periodItems.id))
    .where(and(eq(transactions.userId, userId), eq(periodItems.sourceId, sourceId)))
    .limit(1);
  return Boolean(row);
}
