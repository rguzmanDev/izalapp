import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatLongDate } from "@/lib/period";
import { cn } from "@/lib/utils";
import {
  MOVEMENT_KIND_LABELS,
  type MovementKind,
  type MovementReportEntry,
} from "../movement-report";

const KIND_STYLES: Record<
  MovementKind,
  { bar: string; badge: string; amount: string; sign: "+" | "−" | "" }
> = {
  income: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    amount: "text-emerald-700 dark:text-emerald-400",
    sign: "+",
  },
  expense: {
    bar: "bg-red-500",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400",
    amount: "text-red-700 dark:text-red-400",
    sign: "−",
  },
  transfer: {
    bar: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-400",
    amount: "text-amber-800 dark:text-amber-400",
    sign: "",
  },
};

function groupByDay(entries: MovementReportEntry[]) {
  const groups: { date: string; entries: MovementReportEntry[] }[] = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last && last.date === entry.occurredOn) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.occurredOn, entries: [entry] });
    }
  }
  return groups;
}

/** Periods in newest-first order (entries are already sorted by date). */
function groupByPeriod(entries: MovementReportEntry[]) {
  const groups: { periodLabel: string; entries: MovementReportEntry[] }[] = [];
  const indexByLabel = new Map<string, number>();
  for (const entry of entries) {
    const existing = indexByLabel.get(entry.periodLabel);
    if (existing !== undefined) {
      groups[existing].entries.push(entry);
      continue;
    }
    indexByLabel.set(entry.periodLabel, groups.length);
    groups.push({ periodLabel: entry.periodLabel, entries: [entry] });
  }
  return groups;
}

function MovementRow({
  entry,
  linkable,
}: {
  entry: MovementReportEntry;
  linkable: boolean;
}) {
  const style = KIND_STYLES[entry.kind];
  const body = (
    <>
      <span className={cn("w-1 self-stretch shrink-0 rounded-full", style.bar)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1 select-text">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
              style.badge,
            )}
          >
            {MOVEMENT_KIND_LABELS[entry.kind]}
          </span>
          <span className="truncate font-medium">{entry.title}</span>
        </div>
        {entry.subtitle && (
          <span className="truncate text-sm text-muted-foreground">{entry.subtitle}</span>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 text-right text-sm font-medium tabular-nums select-text",
          style.amount,
        )}
      >
        {style.sign}
        {formatMoney(entry.amountCents)}
      </span>
      {linkable && <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );

  return (
    <li>
      {linkable ? (
        <Link
          href={entry.href}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3">{body}</div>
      )}
    </li>
  );
}

function DaySections({
  entries,
  linkable,
}: {
  entries: MovementReportEntry[];
  linkable: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groupByDay(entries).map(({ date, entries: dayEntries }) => (
        <section key={date} className="flex flex-col gap-2">
          <h4 className="px-0.5 text-sm font-medium text-muted-foreground">
            {formatLongDate(date)}
          </h4>
          <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {dayEntries.map((entry) => (
              <MovementRow
                key={`${entry.kind}-${entry.id}`}
                entry={entry}
                linkable={linkable}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function MovementReportList({
  entries,
  groupByPeriod: byPeriod = false,
  linkable = true,
}: {
  entries: MovementReportEntry[];
  /** Reportes: corte → días. Movimientos: solo días. */
  groupByPeriod?: boolean;
  /** false en reportes: solo lectura, sin ir a editar. */
  linkable?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl bg-card px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        No hay movimientos en este rango.
      </p>
    );
  }

  if (!byPeriod) {
    return <DaySections entries={entries} linkable={linkable} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByPeriod(entries).map(({ periodLabel, entries: periodEntries }) => (
        <section key={periodLabel} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">{periodLabel}</h3>
          <DaySections entries={periodEntries} linkable={linkable} />
        </section>
      ))}
    </div>
  );
}
