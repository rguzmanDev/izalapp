import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { financialAccounts, periodItems, transactions, transfers } from "@/db/schema";

export type AccountBalance = {
  accountId: string;
  openingBalanceCents: number;
  plannedBalanceCents: number;
};

/**
 * Planned balance = opening
 *   + incomes deposited into the account (period items)
 *   + transfers in − transfers out
 *   − expenses charged to the account
 *
 * On a credit card, expenses push the balance down (debt) and payments (transfers in) raise it.
 */
export async function listAccountBalances(userId: string): Promise<Map<string, AccountBalance>> {
  const [accounts, incomeRows, expenseRows, transferInRows, transferOutRows] = await Promise.all([
    db
      .select({
        id: financialAccounts.id,
        openingBalanceCents: financialAccounts.openingBalanceCents,
      })
      .from(financialAccounts)
      .where(eq(financialAccounts.userId, userId)),
    db
      .select({
        accountId: periodItems.accountId,
        cents: sql<number>`coalesce(sum(${periodItems.plannedCents}), 0)::int`,
      })
      .from(periodItems)
      .where(and(eq(periodItems.userId, userId), eq(periodItems.kind, "income")))
      .groupBy(periodItems.accountId),
    db
      .select({
        accountId: transactions.accountId,
        cents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)::int`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .groupBy(transactions.accountId),
    db
      .select({
        accountId: transfers.toAccountId,
        cents: sql<number>`coalesce(sum(${transfers.amountCents}), 0)::int`,
      })
      .from(transfers)
      .where(eq(transfers.userId, userId))
      .groupBy(transfers.toAccountId),
    db
      .select({
        accountId: transfers.fromAccountId,
        cents: sql<number>`coalesce(sum(${transfers.amountCents}), 0)::int`,
      })
      .from(transfers)
      .where(eq(transfers.userId, userId))
      .groupBy(transfers.fromAccountId),
  ]);

  const incomeByAccount = new Map(incomeRows.map((row) => [row.accountId, row.cents]));
  const expenseByAccount = new Map(expenseRows.map((row) => [row.accountId, row.cents]));
  const inByAccount = new Map(transferInRows.map((row) => [row.accountId, row.cents]));
  const outByAccount = new Map(transferOutRows.map((row) => [row.accountId, row.cents]));

  const balances = new Map<string, AccountBalance>();
  for (const account of accounts) {
    const plannedBalanceCents =
      account.openingBalanceCents +
      (incomeByAccount.get(account.id) ?? 0) +
      (inByAccount.get(account.id) ?? 0) -
      (outByAccount.get(account.id) ?? 0) -
      (expenseByAccount.get(account.id) ?? 0);
    balances.set(account.id, {
      accountId: account.id,
      openingBalanceCents: account.openingBalanceCents,
      plannedBalanceCents,
    });
  }
  return balances;
}

export async function getPlannedBalance(userId: string, accountId: string): Promise<number> {
  const balances = await listAccountBalances(userId);
  return balances.get(accountId)?.plannedBalanceCents ?? 0;
}
