import { toIsoDate } from "@/lib/period";

/** The latest closed statement of a credit card. Dates are YYYY-MM-DD. */
export type CardCycle = {
  /** Cutoff of the statement before; charges after it belong to this statement. */
  previousCutoff: string;
  cutoff: string;
  dueDate: string;
};

type YearMonth = { year: number; month: number };

const shiftMonth = ({ year, month }: YearMonth, delta: number): YearMonth => {
  const index = year * 12 + month - 1 + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

/** That day of the month, clamped to the month's last day (a cutoff on the 31st falls on April 30). */
const dayIn = ({ year, month }: YearMonth, day: number) =>
  toIsoDate(year, month, Math.min(day, new Date(year, month, 0).getDate()));

export function lastCardCycle(statementDay: number, paymentDueDay: number, today: string): CardCycle {
  const [year, month] = today.split("-").map(Number);
  const thisMonth = { year, month };
  const cutoffMonth =
    dayIn(thisMonth, statementDay) <= today ? thisMonth : shiftMonth(thisMonth, -1);
  const cutoff = dayIn(cutoffMonth, statementDay);
  const dueInCutoffMonth = dayIn(cutoffMonth, paymentDueDay);

  return {
    previousCutoff: dayIn(shiftMonth(cutoffMonth, -1), statementDay),
    cutoff,
    dueDate:
      dueInCutoffMonth > cutoff
        ? dueInCutoffMonth
        : dayIn(shiftMonth(cutoffMonth, 1), paymentDueDay),
  };
}
