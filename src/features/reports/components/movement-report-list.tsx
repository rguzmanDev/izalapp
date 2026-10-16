import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { formatMoney } from "@/lib/money";
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

export function MovementReportList({ entries }: { entries: MovementReportEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl bg-card px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        No hay movimientos en este rango.
      </p>
    );
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {entries.map((entry) => {
        const style = KIND_STYLES[entry.kind];
        return (
          <li key={`${entry.kind}-${entry.id}`}>
            <Link
              href={entry.href}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
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
                <span className="truncate text-sm text-muted-foreground">{entry.subtitle}</span>
              </div>
              <span
                className={cn("shrink-0 text-right text-sm font-medium tabular-nums select-text", style.amount)}
              >
                {style.sign}
                {formatMoney(entry.amountCents)}
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
