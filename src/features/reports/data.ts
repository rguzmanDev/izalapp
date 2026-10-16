import "server-only";
import { and, desc, eq, gte, inArray, isNotNull, isNull, like, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  cardPayments,
  financialAccounts,
  fuelLogs,
  periodItems,
  periods,
  transactions,
  transfers,
} from "@/db/schema";
import { listAccounts } from "@/features/accounts/data";
import { listAccountBalances } from "@/features/accounts/balance";
import { listCardStatements } from "@/features/cards/data";
import { summarizePeriod } from "@/features/periods/summary";
import { periodBounds, todayIsoDate, toPeriodKey } from "@/lib/period";
import {
  buildAccountAlerts,
  buildAccountBalanceRows,
  buildAccountFlowRows,
  buildCardReportRows,
  buildFundingUseRows,
  buildTransferMapRows,
  cardReservedByFundingAccount,
} from "./account-report";

const fromAccount = alias(financialAccounts, "from_account");
const toAccount = alias(financialAccounts, "to_account");

const total = (column: typeof transactions.amountCents | typeof transfers.amountCents | typeof cardPayments.amountCents) =>
  sql<number>`coalesce(sum(${column}), 0)::int`;

function toCentsMap(rows: { accountId: string; cents: number }[]) {
  return new Map(rows.map((row) => [row.accountId, row.cents]));
}

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

/** Incomes, expenses and transfers across the given periods (for the movements report). */
export async function listMovementsForPeriods(userId: string, periodIds: string[]) {
  if (periodIds.length === 0) return { expenses: [], transfers: [], incomes: [] };

  const creditCard = alias(financialAccounts, "credit_card");

  const [expenses, transferRows, incomes] = await Promise.all([
    db
      .select({
        transaction: transactions,
        account: financialAccounts,
        creditCard,
        itemName: periodItems.name,
        fuelLogId: fuelLogs.id,
        station: fuelLogs.station,
        period: periods,
      })
      .from(transactions)
      .innerJoin(financialAccounts, eq(transactions.accountId, financialAccounts.id))
      .innerJoin(periods, eq(transactions.periodId, periods.id))
      .leftJoin(creditCard, eq(transactions.creditCardId, creditCard.id))
      .leftJoin(periodItems, eq(transactions.itemId, periodItems.id))
      .leftJoin(fuelLogs, eq(fuelLogs.transactionId, transactions.id))
      .where(and(eq(transactions.userId, userId), inArray(transactions.periodId, periodIds)))
      .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt)),
    db
      .select({
        transfer: transfers,
        from: fromAccount,
        to: toAccount,
        period: periods,
      })
      .from(transfers)
      .innerJoin(fromAccount, eq(transfers.fromAccountId, fromAccount.id))
      .innerJoin(toAccount, eq(transfers.toAccountId, toAccount.id))
      .innerJoin(periods, eq(transfers.periodId, periods.id))
      .where(and(eq(transfers.userId, userId), inArray(transfers.periodId, periodIds)))
      .orderBy(desc(transfers.occurredOn), desc(transfers.createdAt)),
    db
      .select({
        item: periodItems,
        account: financialAccounts,
        period: periods,
      })
      .from(periodItems)
      .innerJoin(financialAccounts, eq(periodItems.accountId, financialAccounts.id))
      .innerJoin(periods, eq(periodItems.periodId, periods.id))
      .where(
        and(
          eq(periodItems.userId, userId),
          inArray(periodItems.periodId, periodIds),
          eq(periodItems.kind, "income"),
        ),
      )
      .orderBy(desc(periodItems.createdAt)),
  ]);

  return { expenses, transfers: transferRows, incomes };
}

/** Account report sections for the selected period range. */
export async function getAccountReports(userId: string, periodIds: string[]) {
  const [accounts, balances, statements] = await Promise.all([
    listAccounts(userId),
    listAccountBalances(userId),
    listCardStatements(userId, todayIsoDate()),
  ]);
  const accountsById = new Map(accounts.map((account) => [account.id, account]));

  const reservedByFunding = cardReservedByFundingAccount(statements);

  if (periodIds.length === 0) {
    const balanceRows = buildAccountBalanceRows(accounts, balances, reservedByFunding);
    const cardRows = buildCardReportRows(statements, new Map(), new Map(), balances, accountsById);
    return {
      balanceRows,
      flowRows: [],
      fundingRows: [],
      cardRows,
      transferMapRows: [],
      alerts: buildAccountAlerts({
        accounts,
        balances,
        flowRows: [],
        cardRows,
      }),
    };
  }

  const rangePeriods = await db.select().from(periods).where(inArray(periods.id, periodIds));
  const rangeDates = rangePeriods.flatMap((period) => {
    const { start, end } = periodBounds(toPeriodKey(period));
    return [start, end];
  });
  const rangeStart = rangeDates.toSorted()[0];
  const rangeEnd = rangeDates.toSorted().at(-1)!;

  const [
    incomeRows,
    expenseRows,
    transferInRows,
    transferOutRows,
    apartadoInRows,
    cardTaggedExpenseRows,
    cardPaymentRows,
    transferPairs,
  ] = await Promise.all([
    db
      .select({
        accountId: periodItems.accountId,
        cents: sql<number>`coalesce(sum(${periodItems.plannedCents}), 0)::int`,
      })
      .from(periodItems)
      .where(
        and(
          eq(periodItems.userId, userId),
          inArray(periodItems.periodId, periodIds),
          eq(periodItems.kind, "income"),
        ),
      )
      .groupBy(periodItems.accountId),
    db
      .select({ accountId: transactions.accountId, cents: total(transactions.amountCents) })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), inArray(transactions.periodId, periodIds)))
      .groupBy(transactions.accountId),
    db
      .select({ accountId: transfers.toAccountId, cents: total(transfers.amountCents) })
      .from(transfers)
      .where(and(eq(transfers.userId, userId), inArray(transfers.periodId, periodIds)))
      .groupBy(transfers.toAccountId),
    db
      .select({ accountId: transfers.fromAccountId, cents: total(transfers.amountCents) })
      .from(transfers)
      .where(and(eq(transfers.userId, userId), inArray(transfers.periodId, periodIds)))
      .groupBy(transfers.fromAccountId),
    db
      .select({ accountId: transfers.toAccountId, cents: total(transfers.amountCents) })
      .from(transfers)
      .where(
        and(
          eq(transfers.userId, userId),
          inArray(transfers.periodId, periodIds),
          like(transfers.note, "Apartado:%"),
        ),
      )
      .groupBy(transfers.toAccountId),
    db
      .select({
        accountId: transactions.creditCardId,
        cents: total(transactions.amountCents),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          inArray(transactions.periodId, periodIds),
          isNotNull(transactions.creditCardId),
        ),
      )
      .groupBy(transactions.creditCardId),
    db
      .select({ accountId: cardPayments.cardId, cents: total(cardPayments.amountCents) })
      .from(cardPayments)
      .where(
        and(
          eq(cardPayments.userId, userId),
          gte(cardPayments.occurredOn, rangeStart),
          lte(cardPayments.occurredOn, rangeEnd),
        ),
      )
      .groupBy(cardPayments.cardId),
    db
      .select({
        fromAccountId: transfers.fromAccountId,
        toAccountId: transfers.toAccountId,
        amountCents: transfers.amountCents,
      })
      .from(transfers)
      .where(and(eq(transfers.userId, userId), inArray(transfers.periodId, periodIds))),
  ]);

  const incomesByAccount = toCentsMap(incomeRows);
  const expensesByAccount = toCentsMap(expenseRows);
  const transferInByAccount = toCentsMap(transferInRows);
  const transferOutByAccount = toCentsMap(transferOutRows);
  const apartadoInByAccount = toCentsMap(apartadoInRows);
  const cardTaggedByCard = toCentsMap(
    cardTaggedExpenseRows.filter(
      (row): row is { accountId: string; cents: number } => row.accountId !== null,
    ),
  );
  const paymentsByAccount = toCentsMap(cardPaymentRows);

  const balanceRows = buildAccountBalanceRows(accounts, balances, reservedByFunding);
  const flowRows = buildAccountFlowRows({
    accounts: accounts.filter((account) => account.type !== "credit"),
    incomesByAccount,
    expensesByAccount,
    transferInByAccount,
    transferOutByAccount,
  });
  const fundingRows = buildFundingUseRows({
    accounts,
    apartadoInByAccount,
    expensesByAccount: cardTaggedByCard,
  });
  const cardRows = buildCardReportRows(
    statements,
    cardTaggedByCard,
    paymentsByAccount,
    balances,
    accountsById,
  );
  const transferMapRows = buildTransferMapRows(transferPairs, accountsById);
  const alerts = buildAccountAlerts({ accounts, balances, flowRows, cardRows });

  return { balanceRows, flowRows, fundingRows, cardRows, transferMapRows, alerts };
}
