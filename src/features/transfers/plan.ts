import type { FinancialAccount, PeriodItem, Transfer } from "@/db/schema";

export type TransferStep = {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  /** Already moved between these two accounts during the period. */
  doneCents: number;
};

type TransferPlanInput = {
  items: PeriodItem[];
  accounts: FinancialAccount[];
  transfers: Pick<Transfer, "fromAccountId" | "toAccountId" | "amountCents">[];
};

type Balance = { accountId: string; cents: number };

/** Card expenses are covered by the account the card is paid from. */
function fundingAccountId(account: FinancialAccount | undefined, fallbackId: string) {
  return account?.type === "credit" && account.paymentAccountId
    ? account.paymentAccountId
    : fallbackId;
}

/**
 * Moves that leave each account with what its expenses need: income lands in the deposit
 * accounts and is sent to the accounts that pay fixed expenses and budgets.
 * Whatever is not needed stays where the income landed (the surplus).
 */
export function buildTransferPlan({ items, accounts, transfers }: TransferPlanInput): TransferStep[] {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const balances = new Map<string, number>();
  const add = (accountId: string, cents: number) =>
    balances.set(accountId, (balances.get(accountId) ?? 0) + cents);

  for (const item of items) {
    if (item.kind === "income") {
      add(item.accountId, item.plannedCents);
    } else {
      add(fundingAccountId(accountsById.get(item.accountId), item.accountId), -item.plannedCents);
    }
  }

  const largestFirst = (a: Balance, b: Balance) => b.cents - a.cents;
  const entries = [...balances].map(([accountId, cents]) => ({ accountId, cents }));
  const sources = entries.filter((entry) => entry.cents > 0).sort(largestFirst);
  const needs = entries
    .filter((entry) => entry.cents < 0)
    .map((entry) => ({ ...entry, cents: -entry.cents }))
    .sort(largestFirst);

  const steps: Omit<TransferStep, "doneCents">[] = [];
  for (const need of needs) {
    for (const source of sources) {
      if (need.cents === 0) break;
      if (source.cents === 0) continue;
      const amountCents = Math.min(source.cents, need.cents);
      steps.push({ fromAccountId: source.accountId, toAccountId: need.accountId, amountCents });
      source.cents -= amountCents;
      need.cents -= amountCents;
    }
  }

  return steps.map((step) => {
    const moved = transfers
      .filter(
        (transfer) =>
          transfer.fromAccountId === step.fromAccountId && transfer.toAccountId === step.toAccountId,
      )
      .reduce((total, transfer) => total + transfer.amountCents, 0);
    return { ...step, doneCents: Math.min(moved, step.amountCents) };
  });
}
