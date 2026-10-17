import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { fuelLogs, periodItems, transactions } from "@/db/schema";

/**
 * Template already used in a quincena (apartado/pagado o con gastos).
 * Changing its account would desync the open period.
 */
export async function sourceAccountLocked(userId: string, sourceId: string) {
  const [[committed], [spent]] = await Promise.all([
    db
      .select({ n: sql<number>`1` })
      .from(periodItems)
      .where(
        and(
          eq(periodItems.userId, userId),
          eq(periodItems.sourceId, sourceId),
          ne(periodItems.paymentStatus, "pending"),
        ),
      )
      .limit(1),
    db
      .select({ n: sql<number>`1` })
      .from(transactions)
      .innerJoin(periodItems, eq(transactions.itemId, periodItems.id))
      .where(and(eq(transactions.userId, userId), eq(periodItems.sourceId, sourceId)))
      .limit(1),
  ]);
  return Boolean(committed || spent);
}

/** Budget already has fuel loads; turning off «es gasolina» would orphan them. */
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

/** Income already copied into any quincena — deposit account should stay put. */
export async function sourceUsedInPeriod(userId: string, sourceId: string) {
  const [row] = await db
    .select({ n: sql<number>`1` })
    .from(periodItems)
    .where(and(eq(periodItems.userId, userId), eq(periodItems.sourceId, sourceId)))
    .limit(1);
  return Boolean(row);
}
