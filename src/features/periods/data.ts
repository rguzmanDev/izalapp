import "server-only";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  financialAccounts,
  periodItems,
  periods,
  transactions,
  transfers,
  type PeriodItem,
} from "@/db/schema";
import { getActiveTemplates } from "@/features/plan/data";
import { splitAmount } from "@/lib/allocation";
import { amountForHalf, periodKeyOf, type PeriodKey } from "@/lib/period";
import { isUuid } from "@/lib/validation";
import type { PaymentStatus } from "./constants";
import type { ExtraIncomeInput } from "./schema";

export async function findPeriod(userId: string, { year, month, half }: PeriodKey) {
  const [period] = await db
    .select()
    .from(periods)
    .where(
      and(
        eq(periods.userId, userId),
        eq(periods.year, year),
        eq(periods.month, month),
        eq(periods.half, half),
      ),
    )
    .limit(1);
  return period ?? null;
}

export async function getPeriod(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [period] = await db
    .select()
    .from(periods)
    .where(and(eq(periods.userId, userId), eq(periods.id, id)))
    .limit(1);
  return period ?? null;
}

/** The oldest period before `key` that was never closed. */
export async function findStaleOpenPeriod(userId: string, { year, month, half }: PeriodKey) {
  const [period] = await db
    .select()
    .from(periods)
    .where(
      and(
        eq(periods.userId, userId),
        eq(periods.status, "open"),
        sql`(${periods.year}, ${periods.month}, ${periods.half}) < (${year}, ${month}, ${half})`,
      ),
    )
    .orderBy(asc(periods.year), asc(periods.month), asc(periods.half))
    .limit(1);
  return period ?? null;
}

/** The open period that a movement dated `isoDate` belongs to. */
export async function resolveOpenPeriod(
  userId: string,
  isoDate: string,
): Promise<{ periodId: string } | { error: string }> {
  const period = await findPeriod(userId, periodKeyOf(isoDate));
  if (!period) return { error: "No hay una quincena abierta para esta fecha" };
  if (period.status === "closed") return { error: "La quincena de esta fecha ya está cerrada" };
  return { periodId: period.id };
}

export async function isPeriodOpen(userId: string, periodId: string) {
  return (await getPeriod(userId, periodId))?.status === "open";
}

/** Creates the period and copies the active templates' amounts for that half of the month. */
export async function openPeriod(userId: string, key: PeriodKey) {
  const templates = await getActiveTemplates(userId);
  const forThisHalf = (allocation: Parameters<typeof splitAmount>[0]) =>
    amountForHalf(splitAmount(allocation), key.half);

  const items = [
    ...templates.incomes.map((income) => ({
      kind: "income" as const,
      sourceId: income.id,
      name: income.name,
      plannedCents: forThisHalf(income),
      accountId: income.depositAccountId,
      dueDay: null,
      isFuel: false,
    })),
    ...templates.fixedExpenses.map((expense) => ({
      kind: "fixed_expense" as const,
      sourceId: expense.id,
      name: expense.name,
      plannedCents: forThisHalf(expense),
      accountId: expense.paymentAccountId,
      dueDay: expense.dueDay,
      isFuel: false,
    })),
    ...templates.budgets.map((budget) => ({
      kind: "budget" as const,
      sourceId: budget.id,
      name: budget.name,
      plannedCents: forThisHalf(budget),
      accountId: budget.spendingAccountId,
      dueDay: null,
      isFuel: budget.isFuel,
    })),
  ].filter((item) => item.plannedCents > 0);

  await db.transaction(async (tx) => {
    const [period] = await tx
      .insert(periods)
      .values({ userId, ...key })
      .onConflictDoNothing()
      .returning();
    if (!period || items.length === 0) return;

    await tx
      .insert(periodItems)
      .values(items.map((item) => ({ ...item, userId, periodId: period.id })));
  });
}

/** Period items with the account they use and how much has been spent against them. */
export function listPeriodItems(userId: string, periodId: string) {
  return db
    .select({
      item: periodItems,
      account: financialAccounts,
      spentCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)::int`,
    })
    .from(periodItems)
    .innerJoin(financialAccounts, eq(periodItems.accountId, financialAccounts.id))
    .leftJoin(transactions, eq(transactions.itemId, periodItems.id))
    .where(and(eq(periodItems.userId, userId), eq(periodItems.periodId, periodId)))
    .groupBy(periodItems.id, financialAccounts.id)
    .orderBy(asc(periodItems.dueDay), asc(periodItems.name));
}

export type PeriodItemRow = Awaited<ReturnType<typeof listPeriodItems>>[number];

export async function getUnbudgetedSpent(userId: string, periodId: string) {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.amountCents}), 0)::int` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.periodId, periodId),
        isNull(transactions.itemId),
      ),
    );
  return row.total;
}

export async function getPeriodItem(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [item] = await db
    .select()
    .from(periodItems)
    .where(and(eq(periodItems.userId, userId), eq(periodItems.id, id)))
    .limit(1);
  return item ?? null;
}

export async function updatePlannedAmount(userId: string, id: string, plannedCents: number) {
  await db
    .update(periodItems)
    .set({ plannedCents })
    .where(and(eq(periodItems.userId, userId), eq(periodItems.id, id)));
}

export async function addExtraIncome(userId: string, periodId: string, input: ExtraIncomeInput) {
  await db.insert(periodItems).values({ ...input, userId, periodId, kind: "income" });
}

export async function deleteExtraIncome(userId: string, id: string) {
  await db
    .delete(periodItems)
    .where(
      and(
        eq(periodItems.userId, userId),
        eq(periodItems.id, id),
        eq(periodItems.kind, "income"),
        isNull(periodItems.sourceId),
      ),
    );
}

/** Paying a fixed expense records its planned amount as spent; undoing the payment removes it. */
export async function changePaymentStatus(
  item: PeriodItem,
  status: PaymentStatus,
  paidOn: string,
) {
  await db.transaction(async (tx) => {
    await tx.update(periodItems).set({ paymentStatus: status }).where(eq(periodItems.id, item.id));

    if (status === "paid" && item.paymentStatus !== "paid") {
      await tx.insert(transactions).values({
        userId: item.userId,
        periodId: item.periodId,
        itemId: item.id,
        accountId: item.accountId,
        amountCents: item.plannedCents,
        occurredOn: paidOn,
      });
    } else if (status !== "paid" && item.paymentStatus === "paid") {
      await tx.delete(transactions).where(eq(transactions.itemId, item.id));
    }
  });
}

type SurplusTransfer = {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  occurredOn: string;
};

/** Closes the period, recording where the surplus went when the user decided to move it. */
export async function closePeriod(userId: string, periodId: string, surplus: SurplusTransfer | null) {
  await db.transaction(async (tx) => {
    if (surplus) {
      await tx
        .insert(transfers)
        .values({ ...surplus, userId, periodId, note: "Sobrante", isSurplus: true });
    }
    await tx
      .update(periods)
      .set({ status: "closed" })
      .where(and(eq(periods.userId, userId), eq(periods.id, periodId)));
  });
}

/** Reopening undoes the closing decision, so the surplus transfer is removed. */
export async function reopenPeriod(userId: string, periodId: string) {
  await db.transaction(async (tx) => {
    await tx
      .delete(transfers)
      .where(
        and(
          eq(transfers.userId, userId),
          eq(transfers.periodId, periodId),
          eq(transfers.isSurplus, true),
        ),
      );
    await tx
      .update(periods)
      .set({ status: "open" })
      .where(and(eq(periods.userId, userId), eq(periods.id, periodId)));
  });
}
