import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PeriodSummary } from "../summary";

function Line({ label, cents, strong }: { label: string; cents: number; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3 px-4 py-2.5", strong && "font-semibold")}>
      <dt className={cn(!strong && "text-muted-foreground")}>{label}</dt>
      <dd className={cn("tabular-nums select-text", cents < 0 && "text-destructive")}>{formatMoney(cents)}</dd>
    </div>
  );
}

export function ClosingSummary({ summary }: { summary: PeriodSummary }) {
  return (
    <dl className="divide-y overflow-hidden rounded-xl bg-card text-sm ring-1 ring-foreground/10">
      <Line label="Ingreso" cents={summary.incomeCents} />
      <Line label="Gastos fijos" cents={-summary.fixedCommittedCents} />
      <Line label="Gastado en presupuestos" cents={-summary.budgetSpentCents} />
      {summary.unbudgetedCents > 0 && (
        <Line label="Otros gastos" cents={-summary.unbudgetedCents} />
      )}
      <Line label="Sobrante real" cents={summary.actualSurplusCents} strong />
    </dl>
  );
}
