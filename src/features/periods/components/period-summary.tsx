import { StatCard } from "@/components/stat-card";
import { formatMoney } from "@/lib/money";
import type { PeriodSummary as Summary } from "../summary";

export function PeriodSummary({ summary, closed }: { summary: Summary; closed?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Ingreso" value={formatMoney(summary.incomeCents)} />
      <StatCard
        label="Gastos fijos"
        value={formatMoney(summary.fixedPlannedCents)}
        detail={`${summary.fixedPaidCount} de ${summary.fixedCount} pagados`}
      />
      <StatCard
        label="Presupuesto consumido"
        value={formatMoney(summary.budgetSpentCents)}
        detail={`de ${formatMoney(summary.budgetPlannedCents)}`}
      />
      <StatCard
        label={closed ? "Sobrante real" : "Sobrante"}
        value={formatMoney(summary.actualSurplusCents)}
        negative={summary.actualSurplusCents < 0}
      />
    </div>
  );
}
