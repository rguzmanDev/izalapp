import "server-only";
import type { PeriodItem, Transaction } from "@/db/schema";
import { getPeriodItem } from "@/features/periods/data";
import { isPaidFixedExpenseNote } from "@/features/periods/constants";

export const MANAGED_PAYMENT_EDIT_ERROR =
  "Este gasto se creó con «Marcar pagado». Usa Deshacer en Inicio, no lo edites desde aquí.";

/** Expense created (or owned) by marking a fixed expense as paid. */
export async function isManagedFixedPayment(
  userId: string,
  transaction: Pick<Transaction, "itemId" | "note">,
): Promise<boolean> {
  if (isPaidFixedExpenseNote(transaction.note)) return true;
  if (!transaction.itemId) return false;
  const item = await getPeriodItem(userId, transaction.itemId);
  return isPaidFixedExpenseItem(item);
}

export function isPaidFixedExpenseItem(
  item: Pick<PeriodItem, "kind" | "paymentStatus"> | null | undefined,
): boolean {
  return item?.kind === "fixed_expense" && item.paymentStatus === "paid";
}
