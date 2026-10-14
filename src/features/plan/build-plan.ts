import {
  addHalves,
  splitAmount,
  subtractHalves,
  ZERO_HALVES,
  type Allocation,
  type Halves,
} from "@/lib/allocation";

export type PlanItem = Allocation & { id: string; name: string };

export type PlanLine = { id: string; name: string; halves: Halves };

export type PlanSection = { lines: PlanLine[]; total: Halves };

export type MonthlyPlan = {
  incomes: PlanSection;
  fixedExpenses: PlanSection;
  budgets: PlanSection;
  /** What is left after fixed expenses and budgets: savings or free money. */
  surplus: Halves;
};

function toSection(items: PlanItem[]): PlanSection {
  const lines = items.map((item) => ({ id: item.id, name: item.name, halves: splitAmount(item) }));
  const total = lines.map((line) => line.halves).reduce(addHalves, ZERO_HALVES);
  return { lines, total };
}

export function buildMonthlyPlan(items: {
  incomes: PlanItem[];
  fixedExpenses: PlanItem[];
  budgets: PlanItem[];
}): MonthlyPlan {
  const incomes = toSection(items.incomes);
  const fixedExpenses = toSection(items.fixedExpenses);
  const budgets = toSection(items.budgets);
  const surplus = subtractHalves(subtractHalves(incomes.total, fixedExpenses.total), budgets.total);

  return { incomes, fixedExpenses, budgets, surplus };
}
