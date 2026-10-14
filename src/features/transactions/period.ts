import "server-only";
import { getPeriodItem, isPeriodOpen, resolveOpenPeriod } from "@/features/periods/data";

type FieldErrors = Record<string, string[]>;

/** An expense belongs to its item's period, or to the period that contains its date. Both must be open. */
export async function resolveExpensePeriod(
  userId: string,
  input: { itemId: string | null; occurredOn: string },
): Promise<{ periodId: string } | { fieldErrors: FieldErrors }> {
  if (!input.itemId) {
    const resolved = await resolveOpenPeriod(userId, input.occurredOn);
    return "error" in resolved ? { fieldErrors: { occurredOn: [resolved.error] } } : resolved;
  }

  const item = await getPeriodItem(userId, input.itemId);
  if (!item || item.kind === "income") return { fieldErrors: { itemId: ["Partida inválida"] } };
  if (!(await isPeriodOpen(userId, item.periodId))) {
    return { fieldErrors: { itemId: ["La quincena de esta partida ya está cerrada"] } };
  }
  return { periodId: item.periodId };
}

export const CLOSED_EXPENSE_ERROR = "La quincena de este movimiento ya está cerrada";
