import { daysBetween, periodBounds, type PeriodKey } from "@/lib/period";
import { cn } from "@/lib/utils";

type QuincenaRailProps = {
  periodKey: PeriodKey;
  today: string;
  closed?: boolean;
};

/** Visual calendar of the current quincena — where you are in the fortnight. */
export function QuincenaRail({ periodKey, today, closed }: QuincenaRailProps) {
  const { start, end } = periodBounds(periodKey);
  const totalDays = daysBetween(start, end) + 1;
  const elapsed = Math.min(totalDays, Math.max(0, daysBetween(start, today) + 1));
  const remaining = Math.max(0, totalDays - elapsed);
  const progress = totalDays > 0 ? elapsed / totalDays : 0;

  const days = Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const past = dayNumber < elapsed;
    const current = dayNumber === elapsed && !closed;
    return { dayNumber, past, current };
  });

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">
          {closed
            ? "Quincena cerrada"
            : today < start
              ? "Aún no empieza"
              : today > end
                ? "Ya terminó el corte"
                : `Día ${elapsed} de ${totalDays}`}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {closed
            ? `${totalDays} días`
            : remaining === 0
              ? "Último día"
              : remaining === 1
                ? "Queda 1 día"
                : `Quedan ${remaining} días`}
        </span>
      </div>

      <div
        className="flex gap-1"
        role="img"
        aria-label={`Progreso de la quincena: ${Math.round(progress * 100)}%`}
      >
        {days.map(({ dayNumber, past, current }) => (
          <span
            key={dayNumber}
            title={`Día ${dayNumber}`}
            className={cn(
              "h-2 min-w-0 flex-1 rounded-sm transition-colors",
              current && "bg-primary shadow-[0_0_0_1px_oklch(0.36_0.085_152/0.35)]",
              past && !current && "bg-primary/45",
              !past && !current && "bg-muted",
              closed && "bg-primary/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}
