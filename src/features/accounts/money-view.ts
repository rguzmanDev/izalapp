import "server-only";
import { listAccountBalances, type AccountBalance } from "@/features/accounts/balance";
import { listAccounts } from "@/features/accounts/data";
import { listCardStatements } from "@/features/cards/data";
import { pendingCents } from "@/features/cards/payment";
import { todayIsoDate } from "@/lib/period";

export type AccountMoneyView = AccountBalance & {
  /** Money that should still sit in the bank (card purchases not paid out yet). */
  bankEstimateCents: number;
  /** Statement due + current-cycle charges on cards paid from this account. */
  cardReservedCents: number;
  /** Amount due on the last statement (por pagar). */
  cardDueCents: number;
  /** Charges since last cutoff (next statement). */
  cardCurrentCents: number;
};

/**
 * Bank/cash view: planned balance already subtracts card-tagged purchases.
 * bankEstimate adds back unpaid card charges so it can match the physical account.
 */
export async function listAccountMoneyViews(
  userId: string,
  today = todayIsoDate(),
): Promise<Map<string, AccountMoneyView>> {
  const [balances, accounts, statements] = await Promise.all([
    listAccountBalances(userId),
    listAccounts(userId),
    listCardStatements(userId, today),
  ]);

  const reservedByFunding = new Map<string, { due: number; current: number }>();
  for (const statement of statements) {
    const fundingId = statement.card.paymentAccountId;
    if (!fundingId) continue;
    const prev = reservedByFunding.get(fundingId) ?? { due: 0, current: 0 };
    reservedByFunding.set(fundingId, {
      due: prev.due + pendingCents(statement),
      current: prev.current + statement.currentCents,
    });
  }

  const views = new Map<string, AccountMoneyView>();
  for (const account of accounts) {
    if (account.type === "credit") continue;
    const balance = balances.get(account.id) ?? {
      accountId: account.id,
      openingBalanceCents: account.openingBalanceCents,
      plannedBalanceCents: account.openingBalanceCents,
    };
    const reserved = reservedByFunding.get(account.id) ?? { due: 0, current: 0 };
    const cardReservedCents = reserved.due + reserved.current;
    views.set(account.id, {
      ...balance,
      cardDueCents: reserved.due,
      cardCurrentCents: reserved.current,
      cardReservedCents,
      bankEstimateCents: balance.plannedBalanceCents + cardReservedCents,
    });
  }
  return views;
}
