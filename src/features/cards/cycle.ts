import type { FinancialAccount } from "@/db/schema";
import { addDays, dayOfMonthIn, nextBusinessDay } from "@/lib/period";

/** The latest closed statement of a credit card. Dates are YYYY-MM-DD. */
export type CardCycle = {
  /** Cutoff of the statement before; charges after it belong to this statement. */
  previousCutoff: string;
  cutoff: string;
  dueDate: string;
};

/** When a statement must be paid: a fixed day of the month or a number of days after the cutoff. */
export type PaymentDue = { dayOfMonth: number } | { daysAfterCutoff: number };

export function paymentDueOf(
  card: Pick<FinancialAccount, "paymentDueDay" | "paymentDueDaysAfterCutoff">,
): PaymentDue | null {
  if (card.paymentDueDaysAfterCutoff !== null) {
    return { daysAfterCutoff: card.paymentDueDaysAfterCutoff };
  }
  if (card.paymentDueDay !== null) return { dayOfMonth: card.paymentDueDay };
  return null;
}

type YearMonth = { year: number; month: number };

const shiftMonth = ({ year, month }: YearMonth, delta: number): YearMonth => {
  const index = year * 12 + month - 1 + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

const dayIn = ({ year, month }: YearMonth, day: number) => dayOfMonthIn(year, month, day);

/**
 * Days after the cutoff are counted from the day after it (cutoff on the 10th + 20 days = the 30th).
 * By law (Ley del Sistema de Tarjetas de Crédito, art. 20) a due date on a weekend moves to Monday.
 */
export function lastCardCycle(statementDay: number, due: PaymentDue, today: string): CardCycle {
  const [year, month] = today.split("-").map(Number);
  const thisMonth = { year, month };
  const cutoffMonth =
    dayIn(thisMonth, statementDay) <= today ? thisMonth : shiftMonth(thisMonth, -1);
  const cutoff = dayIn(cutoffMonth, statementDay);
  const previousCutoff = dayIn(shiftMonth(cutoffMonth, -1), statementDay);

  if ("daysAfterCutoff" in due) {
    return { previousCutoff, cutoff, dueDate: nextBusinessDay(addDays(cutoff, due.daysAfterCutoff)) };
  }

  const dueInCutoffMonth = dayIn(cutoffMonth, due.dayOfMonth);
  const dueDate =
    dueInCutoffMonth > cutoff ? dueInCutoffMonth : dayIn(shiftMonth(cutoffMonth, 1), due.dayOfMonth);
  return { previousCutoff, cutoff, dueDate: nextBusinessDay(dueDate) };
}
