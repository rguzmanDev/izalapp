import Link from "next/link";
import { cn } from "@/lib/utils";
import { MOVEMENT_FILTERS, type MovementFilter } from "../movement-report";

const LABELS: Record<MovementFilter, string> = {
  todos: "Todos",
  ingresos: "Ingresos",
  gastos: "Gastos",
  transferencias: "Transferencias",
};

export function MovementFilterBar({
  current,
  hrefFor,
}: {
  current: MovementFilter;
  hrefFor: (filter: MovementFilter) => string;
}) {
  return (
    <div className="flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-1 text-sm">
      {MOVEMENT_FILTERS.map((filter) => (
        <Link
          key={filter}
          href={hrefFor(filter)}
          className={cn(
            "rounded-md px-3 py-1 text-muted-foreground",
            filter === current && "bg-background text-foreground shadow-sm",
          )}
        >
          {LABELS[filter]}
        </Link>
      ))}
    </div>
  );
}

/** Filter chips for the reportes page (keeps prior import path working). */
export function MovementFilter({
  current,
  range,
}: {
  current: MovementFilter;
  range: number;
}) {
  return (
    <MovementFilterBar
      current={current}
      hrefFor={(filter) => `/reportes?quincenas=${range}&tipo=${filter}`}
    />
  );
}
