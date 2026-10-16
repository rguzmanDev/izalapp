import type { FinancialAccount } from "@/db/schema";
import type { AccountBalance } from "@/features/accounts/balance";
import { accountLabel } from "@/features/accounts/format";
import type { CardStatement } from "@/features/cards/data";
import { fundingAccountId } from "@/features/transfers/plan";
import { formatMoney } from "@/lib/money";

export type AccountBalanceRow = {
  accountId: string;
  label: string;
  plannedBalanceCents: number;
  isCredit: boolean;
};

export type AccountFlowRow = {
  accountId: string;
  label: string;
  incomeCents: number;
  transferInCents: number;
  expenseCents: number;
  transferOutCents: number;
  inCents: number;
  outCents: number;
  netCents: number;
};

export type FundingUseRow = {
  accountId: string;
  label: string;
  fundedCents: number;
  spentCents: number;
};

export type CardReportRow = {
  accountId: string;
  label: string;
  chargedCents: number;
  paidCents: number;
  dueCents: number;
  currentCents: number;
  fundingLabel: string | null;
  fundingBalanceCents: number | null;
  hasPaymentAccount: boolean;
};

export type TransferMapRow = {
  key: string;
  fromLabel: string;
  toLabel: string;
  amountCents: number;
  count: number;
};

export type AccountAlert = {
  id: string;
  severity: "warning" | "danger";
  message: string;
};

type FlowInput = {
  accounts: FinancialAccount[];
  incomesByAccount: Map<string, number>;
  expensesByAccount: Map<string, number>;
  transferInByAccount: Map<string, number>;
  transferOutByAccount: Map<string, number>;
};

type FundingInput = {
  accounts: FinancialAccount[];
  /** Transfers into an account tagged as Apartado in the range. */
  apartadoInByAccount: Map<string, number>;
  /** Expenses charged to each spending account in the range. */
  expensesByAccount: Map<string, number>;
};

function cents(map: Map<string, number>, id: string) {
  return map.get(id) ?? 0;
}

export function buildAccountBalanceRows(
  accounts: FinancialAccount[],
  balances: Map<string, AccountBalance>,
): AccountBalanceRow[] {
  return accounts
    .map((account) => ({
      accountId: account.id,
      label: accountLabel(account),
      plannedBalanceCents: balances.get(account.id)?.plannedBalanceCents ?? 0,
      isCredit: account.type === "credit",
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export function buildAccountFlowRows({
  accounts,
  incomesByAccount,
  expensesByAccount,
  transferInByAccount,
  transferOutByAccount,
}: FlowInput): AccountFlowRow[] {
  return accounts
    .map((account) => {
      const incomeCents = cents(incomesByAccount, account.id);
      const transferInCents = cents(transferInByAccount, account.id);
      const expenseCents = cents(expensesByAccount, account.id);
      const transferOutCents = cents(transferOutByAccount, account.id);
      const inCents = incomeCents + transferInCents;
      const outCents = expenseCents + transferOutCents;
      return {
        accountId: account.id,
        label: accountLabel(account),
        incomeCents,
        transferInCents,
        expenseCents,
        transferOutCents,
        inCents,
        outCents,
        netCents: inCents - outCents,
      };
    })
    .filter((row) => row.inCents > 0 || row.outCents > 0)
    .sort((a, b) => Math.abs(b.netCents) - Math.abs(a.netCents));
}

/**
 * Apartado into a funding account vs card spend that draws on that account
 * (via «Se paga desde»). Direct bank expenses are not "uso" of fondeo.
 */
export function buildFundingUseRows({
  accounts,
  apartadoInByAccount,
  expensesByAccount,
}: FundingInput): FundingUseRow[] {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const spentOnFunding = new Map<string, number>();

  for (const account of accounts) {
    if (account.type !== "credit") continue;
    const expense = cents(expensesByAccount, account.id);
    if (expense <= 0) continue;
    const fundingId = fundingAccountId(account, account.id);
    if (fundingId === account.id) continue;
    spentOnFunding.set(fundingId, (spentOnFunding.get(fundingId) ?? 0) + expense);
  }

  const fundingIds = new Set<string>([...apartadoInByAccount.keys(), ...spentOnFunding.keys()]);

  return [...fundingIds]
    .flatMap((accountId) => {
      const account = accountsById.get(accountId);
      if (!account || account.type === "credit") return [];
      const fundedCents = cents(apartadoInByAccount, accountId);
      const spentCents = cents(spentOnFunding, accountId);
      if (fundedCents <= 0 && spentCents <= 0) return [];
      return [{ accountId, label: accountLabel(account), fundedCents, spentCents }];
    })
    .sort((a, b) => b.spentCents - a.spentCents);
}

export function buildCardReportRows(
  statements: CardStatement[],
  expensesByAccount: Map<string, number>,
  paymentsByAccount: Map<string, number>,
  balances: Map<string, AccountBalance>,
  accountsById: Map<string, FinancialAccount>,
): CardReportRow[] {
  return statements
    .map(({ card, statementCents, paidCents: cyclePaid, currentCents }) => {
      const funding = card.paymentAccountId ? accountsById.get(card.paymentAccountId) : undefined;
      const dueCents = Math.max(0, statementCents - cyclePaid);
      return {
        accountId: card.id,
        label: accountLabel(card),
        chargedCents: cents(expensesByAccount, card.id),
        paidCents: cents(paymentsByAccount, card.id),
        dueCents,
        currentCents,
        fundingLabel: funding ? accountLabel(funding) : null,
        fundingBalanceCents: funding
          ? (balances.get(funding.id)?.plannedBalanceCents ?? 0)
          : null,
        hasPaymentAccount: Boolean(card.paymentAccountId),
      };
    })
    .sort((a, b) => b.dueCents - a.dueCents || a.label.localeCompare(b.label, "es"));
}

export function buildTransferMapRows(
  transfers: { fromAccountId: string; toAccountId: string; amountCents: number }[],
  accountsById: Map<string, FinancialAccount>,
): TransferMapRow[] {
  const map = new Map<string, TransferMapRow>();
  for (const transfer of transfers) {
    const key = `${transfer.fromAccountId}->${transfer.toAccountId}`;
    const existing = map.get(key);
    if (existing) {
      existing.amountCents += transfer.amountCents;
      existing.count += 1;
      continue;
    }
    const from = accountsById.get(transfer.fromAccountId);
    const to = accountsById.get(transfer.toAccountId);
    map.set(key, {
      key,
      fromLabel: from ? accountLabel(from) : "Cuenta eliminada",
      toLabel: to ? accountLabel(to) : "Cuenta eliminada",
      amountCents: transfer.amountCents,
      count: 1,
    });
  }
  return [...map.values()].sort((a, b) => b.amountCents - a.amountCents);
}

export function buildAccountAlerts({
  accounts,
  balances,
  flowRows,
  cardRows,
}: {
  accounts: FinancialAccount[];
  balances: Map<string, AccountBalance>;
  flowRows: AccountFlowRow[];
  cardRows: CardReportRow[];
}): AccountAlert[] {
  const alerts: AccountAlert[] = [];
  const activeIds = new Set(flowRows.map((row) => row.accountId));

  for (const account of accounts) {
    const balance = balances.get(account.id)?.plannedBalanceCents ?? 0;
    if (account.type !== "credit" && balance < 0) {
      alerts.push({
        id: `neg-${account.id}`,
        severity: "danger",
        message: `${accountLabel(account)} tiene saldo planificado negativo (${formatMoney(balance)}).`,
      });
    }
    if (!activeIds.has(account.id)) {
      alerts.push({
        id: `idle-${account.id}`,
        severity: "warning",
        message: `${accountLabel(account)} no tuvo movimientos en este rango.`,
      });
    }
  }

  for (const card of cardRows) {
    if (!card.hasPaymentAccount) {
      alerts.push({
        id: `pay-${card.accountId}`,
        severity: "danger",
        message: `${card.label} no tiene «Se paga desde». No se puede apartar/fondear bien.`,
      });
    } else if (
      card.dueCents > 0 &&
      card.fundingBalanceCents !== null &&
      card.fundingBalanceCents < card.dueCents
    ) {
      alerts.push({
        id: `fund-${card.accountId}`,
        severity: "warning",
        message: `${card.label}: el saldo de ${card.fundingLabel} (${formatMoney(card.fundingBalanceCents)}) no cubre lo por pagar (${formatMoney(card.dueCents)}).`,
      });
    }
  }

  return alerts;
}
