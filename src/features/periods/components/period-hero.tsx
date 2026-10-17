import type { ReactNode } from "react";
import { FaroMark } from "@/components/faro-mark";
import { periodLabel, periodRangeLabel, type PeriodKey } from "@/lib/period";
import { QuincenaRail } from "./quincena-rail";

type PeriodHeroProps = {
  periodKey: PeriodKey;
  today: string;
  closed?: boolean;
  notice?: ReactNode;
  children: ReactNode;
};

/** One composition for the top of Inicio: place, time in the quincena, and surplus. */
export function PeriodHero({
  periodKey,
  today,
  closed,
  notice,
  children,
}: PeriodHeroProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_oklch(0.3_0.03_80/0.04)]">
      <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/30 px-4 pt-4 pb-3">
        <div className="absolute -top-6 -right-4 opacity-[0.07]" aria-hidden>
          <FaroMark className="size-28" />
        </div>
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex flex-col gap-0.5">
            <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-primary uppercase">
              Quincena
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {periodLabel(periodKey)}
            </h1>
            <p className="text-sm text-muted-foreground">{periodRangeLabel(periodKey)}</p>
          </div>
          <FaroMark glow className="size-8 shrink-0" />
        </div>
        <div className="relative mt-4">
          <QuincenaRail periodKey={periodKey} today={today} closed={closed} />
        </div>
      </div>
      {notice && <div className="border-b border-border/60 px-4 py-3">{notice}</div>}
      <div className="px-4 py-5">{children}</div>
    </section>
  );
}
