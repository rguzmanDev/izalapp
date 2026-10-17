import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { spentCentsOf, type PeriodSummary } from "@/features/periods/summary";
import { FaroMark } from "@/components/faro-mark";

type ReportStoryProps = {
  summaries: PeriodSummary[];
  rangeLabel: string;
};

function buildStory(summaries: PeriodSummary[]) {
  const income = summaries.reduce((total, s) => total + s.incomeCents, 0);
  const spent = summaries.reduce((total, s) => total + spentCentsOf(s), 0);
  const surplus = summaries.reduce((total, s) => total + s.actualSurplusCents, 0);
  const overspent = summaries.reduce((total, s) => total + s.overspentCents, 0);
  const withSurplus = summaries.filter((s) => s.actualSurplusCents > 0).length;
  const spendRate = income > 0 ? spent / income : 0;

  let headline: string;
  let detail: string;
  let tone: "good" | "warn" | "neutral" = "neutral";

  if (income === 0) {
    headline = "Sin ingresos en este rango";
    detail = "Cuando registres quincenas con ingreso, aquí verás la historia del dinero.";
  } else if (surplus < 0) {
    headline = "El rango cerró en rojo";
    detail = `Gastaste ${formatMoney(spent)} de ${formatMoney(income)} de ingreso. Faltaron ${formatMoney(Math.abs(surplus))}.`;
    tone = "warn";
  } else if (overspent > 0 && spendRate > 0.9) {
    headline = "Al límite, con algunos excesos";
    detail = `Usaste el ${Math.round(spendRate * 100)}% de lo que entró. Hubo ${formatMoney(overspent)} por encima del plan.`;
    tone = "warn";
  } else if (withSurplus >= Math.ceil(summaries.length * 0.7)) {
    headline = "La mayoría de quincenas sobró";
    detail = `${withSurplus} de ${summaries.length} terminaron en positivo. Sobrante acumulado: ${formatMoney(surplus)}.`;
    tone = "good";
  } else if (spendRate <= 0.75) {
    headline = "Respiraste con holgura";
    detail = `Solo usaste el ${Math.round(spendRate * 100)}% del ingreso. Te quedaron ${formatMoney(surplus)}.`;
    tone = "good";
  } else {
    headline = "Un rango equilibrado";
    detail = `Ingreso ${formatMoney(income)} · gastado ${formatMoney(spent)} · sobrante ${formatMoney(surplus)}.`;
  }

  return { headline, detail, tone, income, spent, surplus, spendRate };
}

/** Narrative “faro” for the report range — reads the numbers as a short story. */
export function ReportStory({ summaries, rangeLabel }: ReportStoryProps) {
  const story = buildStory(summaries);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border px-4 py-5 shadow-[0_1px_2px_oklch(0.3_0.03_80/0.04)]",
        story.tone === "good" && "border-primary/25 bg-primary/[0.06]",
        story.tone === "warn" && "border-destructive/25 bg-destructive/[0.05]",
        story.tone === "neutral" && "border-border/80 bg-card",
      )}
    >
      <div className="absolute -top-8 -right-6 opacity-[0.08]" aria-hidden>
        <FaroMark className="size-32" />
      </div>
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <FaroMark glow className="mt-0.5 size-7 shrink-0" />
          <div className="min-w-0 flex flex-col gap-1">
            <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-primary uppercase">
              Lectura del rango · {rangeLabel}
            </p>
            <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">
              {story.headline}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{story.detail}</p>
          </div>
        </div>

        {story.income > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-3 text-[11px] text-muted-foreground">
              <span>Gastado vs ingreso</span>
              <span className="font-mono tabular-nums">
                {Math.min(100, Math.round(story.spendRate * 100))}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  story.tone === "warn" ? "bg-destructive/80" : "bg-primary",
                )}
                style={{ width: `${Math.min(100, story.spendRate * 100)}%` }}
              />
            </div>
            <div className="flex justify-between gap-3 font-mono text-xs tabular-nums select-text">
              <span className="text-muted-foreground">{formatMoney(story.spent)}</span>
              <span className="text-foreground">{formatMoney(story.income)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
