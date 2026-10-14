import type { PeriodItem } from "@/db/schema";

type PeriodRows = { rows: { item: PeriodItem; spentCents: number }[] };

export type BudgetReportLine = {
  name: string;
  plannedCents: number;
  spentCents: number;
  /** Periods where spending went above the cap. */
  exceededCount: number;
  periodCount: number;
};

/** Budgets grouped by name across periods, most spent first. */
export function buildBudgetReport(reports: PeriodRows[]): BudgetReportLine[] {
  const lines = new Map<string, BudgetReportLine>();

  for (const { rows } of reports) {
    for (const { item, spentCents } of rows) {
      if (item.kind !== "budget") continue;
      const line = lines.get(item.name) ?? {
        name: item.name,
        plannedCents: 0,
        spentCents: 0,
        exceededCount: 0,
        periodCount: 0,
      };
      line.plannedCents += item.plannedCents;
      line.spentCents += spentCents;
      line.periodCount += 1;
      if (spentCents > item.plannedCents) line.exceededCount += 1;
      lines.set(item.name, line);
    }
  }

  return [...lines.values()].sort((a, b) => b.spentCents - a.spentCents);
}
