import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MovementFilter } from "../movement-report";

export const REPORT_RANGES = [6, 12, 24] as const;

export function RangeSelector({
  current,
  tipo = "todos",
}: {
  current: number;
  tipo?: MovementFilter;
}) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-lg border border-border/70 bg-muted/70 p-0.5 text-sm"
      role="group"
      aria-label="Rango de quincenas"
    >
      {REPORT_RANGES.map((range) => (
        <Link
          key={range}
          href={`/reportes?quincenas=${range}&tipo=${tipo}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-muted-foreground transition-colors",
            range === current && "bg-card font-medium text-primary shadow-sm",
          )}
        >
          {range}q
        </Link>
      ))}
    </div>
  );
}
