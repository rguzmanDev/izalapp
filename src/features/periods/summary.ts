import type { PeriodItem } from "@/db/schema";

type ItemWithSpent = { item: PeriodItem; spentCents: number };

export type PeriodSummary = {
  incomeCents: number;
  fixedPlannedCents: number;
  /** Planned fixed expenses, or what was actually paid when it was more. */
  fixedCommittedCents: number;
  /** Amount actually recorded against fixed expenses (not unpaid planned). */
  fixedSpentCents: number;
  fixedPaidCount: number;
  fixedCount: number;
  budgetPlannedCents: number;
  budgetSpentCents: number;
  unbudgetedCents: number;
  /** Spending above the planned amount of budgets and fixed expenses. */
  overspentCents: number;
  /** Income − fijos del plan − presupuestos gastados − otros. Misma cifra en Inicio y Reportes. */
  actualSurplusCents: number;
};

/** Gastos ya registrados (fijos + presupuestos + sin presupuesto). */
export function spentCentsOf(summary: Pick<PeriodSummary, "fixedSpentCents" | "budgetSpentCents" | "unbudgetedCents">) {
  return summary.fixedSpentCents + summary.budgetSpentCents + summary.unbudgetedCents;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function overspentOf({ item, spentCents }: ItemWithSpent): number {
  return Math.max(0, spentCents - item.plannedCents);
}

export function summarizePeriod(rows: ItemWithSpent[], unbudgetedCents: number): PeriodSummary {
  const ofKind = (kind: PeriodItem["kind"]) => rows.filter((row) => row.item.kind === kind);
  const incomes = ofKind("income");
  const fixed = ofKind("fixed_expense");
  const budgets = ofKind("budget");

  const incomeCents = sum(incomes.map((row) => row.item.plannedCents));
  const fixedPlannedCents = sum(fixed.map((row) => row.item.plannedCents));
  const budgetPlannedCents = sum(budgets.map((row) => row.item.plannedCents));
  const overspentCents = sum([...fixed, ...budgets].map(overspentOf));
  const budgetSpentCents = sum(budgets.map((row) => row.spentCents));
  const fixedSpentCents = sum(fixed.map((row) => row.spentCents));
  const fixedCommittedCents = sum(fixed.map((row) => Math.max(row.item.plannedCents, row.spentCents)));

  return {
    incomeCents,
    fixedPlannedCents,
    fixedCommittedCents,
    fixedSpentCents,
    fixedPaidCount: fixed.filter((row) => row.item.paymentStatus === "paid").length,
    fixedCount: fixed.length,
    budgetPlannedCents,
    budgetSpentCents,
    unbudgetedCents,
    overspentCents,
    actualSurplusCents: incomeCents - fixedCommittedCents - budgetSpentCents - unbudgetedCents,
  };
}
