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
    <div
      className="flex w-full flex-wrap gap-0.5 rounded-lg border border-border/70 bg-muted/70 p-0.5 text-sm sm:w-fit"
      role="group"
      aria-label="Tipo de movimiento"
    >
      {MOVEMENT_FILTERS.map((filter) => (
        <Link
          key={filter}
          href={hrefFor(filter)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-center text-muted-foreground transition-colors sm:flex-none",
            filter === current && "bg-card font-medium text-primary shadow-sm",
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
