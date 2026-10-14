import type { SelectOption } from "@/components/form/fields";
import type { FinancialAccount } from "@/db/schema";
import { ACCOUNT_TYPE_LABELS } from "./constants";

export function accountLabel(account: Pick<FinancialAccount, "name" | "bank">): string {
  return account.bank ? `${account.name} · ${account.bank}` : account.name;
}

export function describeAccount(account: FinancialAccount): string {
  if (account.type !== "credit") return ACCOUNT_TYPE_LABELS[account.type];
  return `Tarjeta · corte día ${account.statementDay} · pago día ${account.paymentDueDay}`;
}

export function toAccountOptions(accounts: FinancialAccount[]): SelectOption[] {
  return accounts.map((account) => ({ value: account.id, label: accountLabel(account) }));
}
