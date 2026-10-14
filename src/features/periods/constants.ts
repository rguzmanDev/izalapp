import type { PeriodItem } from "@/db/schema";

export const PERIOD_STATUSES = ["open", "closed"] as const;

export type PeriodStatus = (typeof PERIOD_STATUSES)[number];

export const PERIOD_ITEM_KINDS = ["income", "fixed_expense", "budget"] as const;

export type PeriodItemKind = (typeof PERIOD_ITEM_KINDS)[number];

/** One-off income (bonus, side job) added to a single period instead of copied from a template. */
export function isExtraIncome(item: Pick<PeriodItem, "kind" | "sourceId">): boolean {
  return item.kind === "income" && item.sourceId === null;
}

/** Only meaningful for fixed expenses. */
export const PAYMENT_STATUSES = ["pending", "set_aside", "paid"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  set_aside: "Apartado",
  paid: "Pagado",
};
