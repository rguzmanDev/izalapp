import "server-only";
import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
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
import { fundingAccountId, setAsideTransferNote } from "@/features/transfers/plan";
import { splitAmount } from "@/lib/allocation";
import {
  amountForHalf,
  periodKeyOf,
  todayIsoDate,
  toPeriodKey,
  type PeriodKey,
} from "@/lib/period";
import { isUuid } from "@/lib/validation";
import { paidFixedExpenseNote, type PaymentStatus } from "./constants";
import type { ExtraIncomeInput } from "./schema";

export { setAsideTransferNote };

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

/**
 * The corte the user is working in: an unfinished older open period first,
 * otherwise the calendar period for `today` (open, closed, or missing).
 * Period membership follows the open corte, not the calendar day of each movement.
 */
export async function getWorkingPeriod(userId: string, today = todayIsoDate()) {
  const calendarKey = periodKeyOf(today);
  const stale = await findStaleOpenPeriod(userId, calendarKey);
  if (stale) {
    return {
      period: stale,
      key: toPeriodKey(stale),
      calendarKey,
      isStale: true as const,
    };
  }
  const period = await findPeriod(userId, calendarKey);
  return {
    period,
    key: calendarKey,
    calendarKey,
    isStale: false as const,
  };
}

/**
 * The open corte that new movements belong to.
 * The movement date is only a label (payday/corte can land on any day); it does not pick the period.
 */
export async function resolveOpenPeriod(
  userId: string,
  _occurredOn?: string,
): Promise<{ periodId: string } | { error: string }> {
  const { period } = await getWorkingPeriod(userId);
  if (!period) return { error: "No hay una quincena abierta. Ábrela desde Inicio." };
  if (period.status === "closed") {
    return { error: "La quincena actual ya está cerrada. Reabre o abre la siguiente." };
  }
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

type SetAsideTransfer = {
  fromAccountId: string;
  toAccountId: string;
  occurredOn: string;
};

/**
 * Marks a pending item as apartado and, when origin ≠ destination, records the funding transfer.
 * Locks the item row so a double submit cannot create two transfers.
 */
export async function setAsideItem(
  item: PeriodItem,
  transfer: SetAsideTransfer | null,
): Promise<"ok" | "not_pending"> {
  return db.transaction(async (tx) => {
    const [fresh] = await tx
      .select()
      .from(periodItems)
      .where(eq(periodItems.id, item.id))
      .for("update")
      .limit(1);
    if (!fresh || fresh.paymentStatus !== "pending") return "not_pending";

    if (transfer) {
      await tx.insert(transfers).values({
        userId: fresh.userId,
        periodId: fresh.periodId,
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        amountCents: fresh.plannedCents,
        occurredOn: transfer.occurredOn,
        note: setAsideTransferNote(fresh.name),
      });
    }

    await tx
      .update(periodItems)
      .set({ paymentStatus: "set_aside" })
      .where(eq(periodItems.id, fresh.id));
    return "ok";
  });
}

/**
 * Paying a fixed expense records its planned amount as spent; undoing the payment removes it.
 * Undoing an apartado removes the matching funding transfer created by Apartar.
 * Re-reads the row inside the transaction so a double submit cannot insert twice.
 */
export async function changePaymentStatus(
  item: PeriodItem,
  status: PaymentStatus,
  paidOn: string,
) {
  await db.transaction(async (tx) => {
    const [fresh] = await tx
      .select()
      .from(periodItems)
      .where(eq(periodItems.id, item.id))
      .for("update")
      .limit(1);
    if (!fresh || fresh.paymentStatus === status) return;

    await tx.update(periodItems).set({ paymentStatus: status }).where(eq(periodItems.id, item.id));

    if (status === "paid" && fresh.paymentStatus !== "paid") {
      await tx.insert(transactions).values({
        userId: fresh.userId,
        periodId: fresh.periodId,
        itemId: fresh.id,
        accountId: fresh.accountId,
        amountCents: fresh.plannedCents,
        occurredOn: paidOn,
        note: paidFixedExpenseNote(fresh.name),
      });
    } else if (status !== "paid" && fresh.paymentStatus === "paid") {
      await tx.delete(transactions).where(eq(transactions.itemId, fresh.id));
    }

    if (fresh.paymentStatus === "set_aside" && status === "pending") {
      const [account] = await tx
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.id, fresh.accountId))
        .limit(1);
      const toAccountId = fundingAccountId(account, fresh.accountId);
      const note = setAsideTransferNote(fresh.name);

      // Apartar / Fondear tag transfers with the note; also clear legacy unlabeled fondeo rows.
      await tx
        .delete(transfers)
        .where(
          and(
            eq(transfers.userId, fresh.userId),
            eq(transfers.periodId, fresh.periodId),
            eq(transfers.isSurplus, false),
            or(
              eq(transfers.note, note),
              and(
                isNull(transfers.note),
                eq(transfers.toAccountId, toAccountId),
                eq(transfers.amountCents, fresh.plannedCents),
              ),
            ),
          ),
        );
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
