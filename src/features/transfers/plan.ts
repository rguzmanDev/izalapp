import type { FinancialAccount, PeriodItem, Transfer } from "@/db/schema";

export type TransferStepCover = {
  name: string;
  amountCents: number;
  kind: "fixed_expense" | "budget";
};

export type TransferStep = {
  toAccountId: string;
  /** Suggested origin from the plan (where income surplus is). */
  suggestedFromAccountId: string;
  amountCents: number;
  /**
   * Progress toward funding the *pending* partidas in `covers`.
   * Only counts transfers tagged `Apartado: {nombre}` for those partidas —
   * not other money that happened to land in the same account.
   */
  doneCents: number;
  /** Planned expenses and budgets this transfer is meant to fund. */
  covers: TransferStepCover[];
};

type TransferPlanInput = {
  items: PeriodItem[];
  accounts: FinancialAccount[];
  transfers: Pick<Transfer, "fromAccountId" | "toAccountId" | "amountCents" | "note">[];
};

type Balance = { accountId: string; cents: number };

/** Card expenses are covered by the account the card is paid from. */
export function fundingAccountId(account: FinancialAccount | undefined, fallbackId: string) {
  return account?.type === "credit" && account.paymentAccountId
    ? account.paymentAccountId
    : fallbackId;
}

/** Still waiting to be funded; apartados and pagados are left out of the plan. */
export function stillNeedsFunding(item: PeriodItem): boolean {
  return (
    (item.kind === "fixed_expense" || item.kind === "budget") && item.paymentStatus === "pending"
  );
}

/** Note on funding transfers so Deshacer apartado can remove them (Apartar and Fondear). */
export function setAsideTransferNote(itemName: string) {
  return `Apartado: ${itemName}`;
}

function coversForAccount(
  items: PeriodItem[],
  accountsById: Map<string, FinancialAccount>,
  accountId: string,
): TransferStepCover[] {
  return items
    .filter(stillNeedsFunding)
    .filter(
      (item) => fundingAccountId(accountsById.get(item.accountId), item.accountId) === accountId,
    )
    .map((item) => ({
      name: item.name,
      amountCents: item.plannedCents,
      kind: item.kind as "fixed_expense" | "budget",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/**
 * Moves that leave each account with what its pending expenses need: income lands in the
 * deposit accounts and is sent to the accounts that pay fixed expenses and budgets still
 * awaiting funding. Apartados and pagados are skipped. Surplus stays where income landed.
 *
 * Steps are one per destination account. Progress only counts Apartado transfers for the
 * pending partidas still listed in `covers` (not unrelated transfers to the same account).
 */
export function buildTransferPlan({ items, accounts, transfers }: TransferPlanInput): TransferStep[] {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const balances = new Map<string, number>();
  const add = (accountId: string, cents: number) =>
    balances.set(accountId, (balances.get(accountId) ?? 0) + cents);

  for (const item of items) {
    if (item.kind === "income") {
      add(item.accountId, item.plannedCents);
    } else if (stillNeedsFunding(item)) {
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

  const merged = new Map<string, { suggestedFromAccountId: string; amountCents: number }>();
  for (const need of needs) {
    for (const source of sources) {
      if (need.cents === 0) break;
      if (source.cents === 0) continue;
      const amountCents = Math.min(source.cents, need.cents);
      const existing = merged.get(need.accountId);
      if (!existing) {
        merged.set(need.accountId, {
          suggestedFromAccountId: source.accountId,
          amountCents,
        });
      } else {
        existing.amountCents += amountCents;
      }
      source.cents -= amountCents;
      need.cents -= amountCents;
    }
  }

  return [...merged.entries()].map(([toAccountId, { suggestedFromAccountId, amountCents }]) => {
    const covers = coversForAccount(items, accountsById, toAccountId);
    const coverNotes = new Set(covers.map((cover) => setAsideTransferNote(cover.name)));
    const moved = transfers
      .filter(
        (transfer) =>
          transfer.toAccountId === toAccountId &&
          transfer.note != null &&
          coverNotes.has(transfer.note),
      )
      .reduce((total, transfer) => total + transfer.amountCents, 0);
    return {
      toAccountId,
      suggestedFromAccountId,
      amountCents,
      doneCents: Math.min(moved, amountCents),
      covers,
    };
  });
}
