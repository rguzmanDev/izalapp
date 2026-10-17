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
    <div className="flex w-fit gap-1 rounded-lg bg-muted p-1 text-sm">
      {REPORT_RANGES.map((range) => (
        <Link
          key={range}
          href={`/reportes?quincenas=${range}&tipo=${tipo}`}
          className={cn(
            "rounded-md px-3 py-1 text-muted-foreground",
            range === current && "bg-card font-medium text-primary shadow-sm",
          )}
        >
          {range} quincenas
        </Link>
      ))}
    </div>
  );
}
