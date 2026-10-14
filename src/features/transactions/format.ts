import type { PeriodItem } from "@/db/schema";
import type { ItemOption } from "./components/transaction-form";

/** Budgets and fixed expenses a transaction can be charged to. */
export function toItemOptions(items: PeriodItem[]): ItemOption[] {
  return items
    .filter((item) => item.kind !== "income")
    .map((item) => ({ value: item.id, label: item.name, accountId: item.accountId }));
}
