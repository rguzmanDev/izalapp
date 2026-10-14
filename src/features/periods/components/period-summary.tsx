import { StatCard } from "@/components/stat-card";
import { formatMoney } from "@/lib/money";
import type { PeriodSummary as Summary } from "../summary";

export function PeriodSummary({ summary, closed }: { summary: Summary; closed?: boolean }) {
  const surplusDetails = [
    `Planeado ${formatMoney(summary.plannedSurplusCents)}`,
    summary.unbudgetedCents > 0 && `otros gastos ${formatMoney(summary.unbudgetedCents)}`,
    summary.overspentCents > 0 && `excesos ${formatMoney(summary.overspentCents)}`,
  ].filter(Boolean);
  const surplusCents = closed ? summary.actualSurplusCents : summary.projectedSurplusCents;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Ingreso" value={formatMoney(summary.incomeCents)} />
      <StatCard
        label="Gastos fijos"
        value={formatMoney(summary.fixedPlannedCents)}
        detail={`${summary.fixedPaidCount} de ${summary.fixedCount} pagados`}
      />
      <StatCard
        label="Presupuestos"
        value={formatMoney(summary.budgetSpentCents)}
        detail={`de ${formatMoney(summary.budgetPlannedCents)}`}
      />
      <StatCard
        label={closed ? "Sobrante real" : "Sobrante estimado"}
        value={formatMoney(surplusCents)}
        detail={closed ? undefined : surplusDetails.join(" · ")}
        negative={surplusCents < 0}
      />
    </div>
  );
}
