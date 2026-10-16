import type { PeriodItem } from "@/db/schema";
import type { ItemOption } from "./components/transaction-form";

type ItemOptionFilter = { /** Keep a pending item visible when editing an existing expense. */ includeId?: string | null };

function isSpendable(item: PeriodItem, includeId?: string | null) {
  return item.paymentStatus !== "pending" || item.id === includeId;
}

/** Budgets and fixed expenses already funded (apartados/pagados); pending ones are omitted. */
export function toItemOptions(items: PeriodItem[], { includeId }: ItemOptionFilter = {}): ItemOption[] {
  return items
    .filter((item) => item.kind !== "income")
    .filter((item) => isSpendable(item, includeId))
    .map((item) => ({ value: item.id, label: item.name, accountId: item.accountId }));
}

/** Fuel budgets that are funded; pending ones cannot receive a refill yet. */
export function toFuelItemOptions(
  items: PeriodItem[],
  { includeId }: ItemOptionFilter = {},
): ItemOption[] {
  return items
    .filter((item) => item.kind === "budget" && item.isFuel)
    .filter((item) => isSpendable(item, includeId))
    .map((item) => ({ value: item.id, label: item.name, accountId: item.accountId }));
}
