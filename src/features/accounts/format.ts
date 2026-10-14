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
