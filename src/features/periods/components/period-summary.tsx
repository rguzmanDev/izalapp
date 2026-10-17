import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import type { PeriodSummary as Summary } from "../summary";

export function PeriodSummary({ summary, closed }: { summary: Summary; closed?: boolean }) {
  const negative = summary.actualSurplusCents < 0;
  const committed =
    summary.fixedCommittedCents + summary.budgetSpentCents + summary.unbudgetedCents;
  const spendRate =
    summary.incomeCents > 0 ? Math.min(1.25, committed / summary.incomeCents) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{closed ? "Sobrante real" : "Sobrante"}</p>
        <p
          className={cn(
            "font-heading text-[2.5rem] leading-none font-semibold tracking-[-0.03em] tabular-nums select-text",
            negative ? "text-destructive" : "text-foreground",
          )}
        >
          {formatMoney(summary.actualSurplusCents)}
        </p>
        {summary.incomeCents > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  negative ? "bg-destructive/80" : "bg-primary/80",
                )}
                style={{ width: `${Math.min(100, spendRate * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Comprometido {formatMoney(committed)} de {formatMoney(summary.incomeCents)} ingreso
            </p>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-x-3 gap-y-3 border-t border-border/70 pt-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Ingreso</dt>
          <dd className="truncate font-mono text-sm font-medium tabular-nums select-text">
            {formatMoney(summary.incomeCents)}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Gastos fijos</dt>
          <dd className="truncate font-mono text-sm font-medium tabular-nums select-text">
            {formatMoney(summary.fixedPlannedCents)}
          </dd>
          <dd className="text-[11px] text-muted-foreground select-text">
            {summary.fixedPaidCount}/{summary.fixedCount} pagados
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Presupuesto</dt>
          <dd className="truncate font-mono text-sm font-medium tabular-nums select-text">
            {formatMoney(summary.budgetSpentCents)}
          </dd>
          <dd className="text-[11px] text-muted-foreground select-text">
            de {formatMoney(summary.budgetPlannedCents)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
