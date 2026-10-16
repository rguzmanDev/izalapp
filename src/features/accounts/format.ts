import type { SelectOption } from "@/components/form/fields";
import type { FinancialAccount } from "@/db/schema";
import { paymentDueOf } from "@/features/cards/cycle";
import { ACCOUNT_NAME_PREFIXES } from "./constants";

/** "Tarjeta de crédito NICO ••1234 · BAC": type, nickname, last digits and bank. */
export function accountLabel(
  account: Pick<FinancialAccount, "type" | "name" | "lastFour" | "bank">,
): string {
  const lastFour = account.lastFour ? ` ••${account.lastFour}` : "";
  const bank = account.bank ? ` · ${account.bank}` : "";
  return `${ACCOUNT_NAME_PREFIXES[account.type]} ${account.name}${lastFour}${bank}`;
}

/** Card dates; other accounts need no extra detail because the label already says the type. */
export function describeAccount(account: FinancialAccount): string | undefined {
  if (account.type !== "credit") return undefined;
  const due = paymentDueOf(account);
  const payment =
    due === null
      ? ""
      : "daysAfterCutoff" in due
        ? ` · pago ${due.daysAfterCutoff} días después del corte`
        : ` · pago día ${due.dayOfMonth}`;
  return `Corte día ${account.statementDay}${payment}`;
}

export function toAccountOptions(accounts: FinancialAccount[]): SelectOption[] {
  return accounts.map((account) => ({ value: account.id, label: accountLabel(account) }));
}

/** Bank/checking/savings/efectivo — never credit cards. */
export function toMoneyAccountOptions(accounts: FinancialAccount[]): SelectOption[] {
  return toAccountOptions(accounts.filter((account) => account.type !== "credit"));
}

/** Credit cards whose «Se paga desde» is `fundingAccountId`. */
export function toCardOptionsForAccount(
  cards: FinancialAccount[],
  fundingAccountId: string,
): SelectOption[] {
  return toAccountOptions(
    cards.filter(
      (account) => account.type === "credit" && account.paymentAccountId === fundingAccountId,
    ),
  );
}

/** Map fundingAccountId → card select options. */
export function toCardOptionsByFundingAccount(
  accounts: FinancialAccount[],
): Record<string, SelectOption[]> {
  const cards = accounts.filter((account) => account.type === "credit");
  const map: Record<string, SelectOption[]> = {};
  for (const card of cards) {
    if (!card.paymentAccountId) continue;
    (map[card.paymentAccountId] ??= []).push({
      value: card.id,
      label: accountLabel(card),
    });
  }
  return map;
}
