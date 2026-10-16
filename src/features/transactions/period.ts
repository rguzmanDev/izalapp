import "server-only";
import type { PeriodItem } from "@/db/schema";
import { getPeriodItem, isPeriodOpen, resolveOpenPeriod } from "@/features/periods/data";

type FieldErrors = Record<string, string[]>;

export const NOT_FUNDED_ERROR =
  "Aparta o fondea esta partida antes de registrar gastos (si pagaste de otra cuenta, repones después)";

/** Budgets and fixed expenses must be apartados (or pagados) before recording spend against them. */
export function fundingRequiredError(item: PeriodItem): FieldErrors | null {
  if (item.kind !== "budget" && item.kind !== "fixed_expense") return null;
  if (item.paymentStatus !== "pending") return null;
  return { itemId: [NOT_FUNDED_ERROR] };
}

/** An expense belongs to its item's period, or to the period that contains its date. Both must be open. */
export async function resolveExpensePeriod(
  userId: string,
  input: { itemId: string | null; occurredOn: string },
): Promise<{ periodId: string; item: PeriodItem | null } | { fieldErrors: FieldErrors }> {
  if (!input.itemId) {
    const resolved = await resolveOpenPeriod(userId, input.occurredOn);
    return "error" in resolved
      ? { fieldErrors: { occurredOn: [resolved.error] } }
      : { periodId: resolved.periodId, item: null };
  }

  const item = await getPeriodItem(userId, input.itemId);
  if (!item || item.kind === "income") return { fieldErrors: { itemId: ["Partida inválida"] } };
  if (!(await isPeriodOpen(userId, item.periodId))) {
    return { fieldErrors: { itemId: ["La quincena de esta partida ya está cerrada"] } };
  }
  return { periodId: item.periodId, item };
}

export const CLOSED_EXPENSE_ERROR = "La quincena de este movimiento ya está cerrada";
