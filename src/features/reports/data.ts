import "server-only";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { periodItems, periods, transactions, transfers } from "@/db/schema";
import { summarizePeriod } from "@/features/periods/summary";

const total = (column: typeof transactions.amountCents | typeof transfers.amountCents) =>
  sql<number>`coalesce(sum(${column}), 0)::int`;

/** The latest `count` periods, oldest first, each with its summary and the surplus that was saved. */
export async function getPeriodReports(userId: string, count: number) {
  const recent = await db
    .select()
    .from(periods)
    .where(eq(periods.userId, userId))
    .orderBy(desc(periods.year), desc(periods.month), desc(periods.half))
    .limit(count);
  if (recent.length === 0) return [];

  const periodIds = recent.map((period) => period.id);
  const [items, unbudgeted, saved] = await Promise.all([
    db
      .select({ item: periodItems, spentCents: total(transactions.amountCents) })
      .from(periodItems)
      .leftJoin(transactions, eq(transactions.itemId, periodItems.id))
      .where(and(eq(periodItems.userId, userId), inArray(periodItems.periodId, periodIds)))
      .groupBy(periodItems.id),
    db
      .select({ periodId: transactions.periodId, cents: total(transactions.amountCents) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          inArray(transactions.periodId, periodIds),
          isNull(transactions.itemId),
        ),
      )
      .groupBy(transactions.periodId),
    db
      .select({ periodId: transfers.periodId, cents: total(transfers.amountCents) })
      .from(transfers)
      .where(
        and(
          eq(transfers.userId, userId),
          inArray(transfers.periodId, periodIds),
          eq(transfers.isSurplus, true),
        ),
      )
      .groupBy(transfers.periodId),
  ]);

  const centsFor = (rows: { periodId: string; cents: number }[], periodId: string) =>
    rows.find((row) => row.periodId === periodId)?.cents ?? 0;

  return recent.reverse().map((period) => {
    const rows = items.filter((row) => row.item.periodId === period.id);
    return {
      period,
      rows,
      summary: summarizePeriod(rows, centsFor(unbudgeted, period.id)),
      savedCents: centsFor(saved, period.id),
    };
  });
}

export type PeriodReport = Awaited<ReturnType<typeof getPeriodReports>>[number];
