import Link from "next/link";
import { ProgressBar } from "@/components/progress-bar";
import { formatMoney } from "@/lib/money";
import type { PeriodItemRow } from "../data";

type BudgetRowProps = PeriodItemRow & { readOnly?: boolean };

function BudgetRow({ item, spentCents, readOnly }: BudgetRowProps) {
  const remaining = item.plannedCents - spentCents;

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        {readOnly ? (
          <span className="font-medium select-text">{item.name}</span>
        ) : (
          <>
            <Link href={`/partidas/${item.id}`} className="font-medium select-text hover:underline">
              {item.name}
            </Link>
            <Link
              href={
                item.isFuel
                  ? `/gasolina/nueva?partida=${item.id}`
                  : `/movimientos/nuevo?partida=${item.id}`
              }
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {item.isFuel ? "+ Carga" : "+ Gasto"}
            </Link>
          </>
        )}
      </div>
      <ProgressBar value={spentCents} max={item.plannedCents} />
      <div className="flex justify-between text-sm tabular-nums select-text">
        <span className="text-muted-foreground">
          {formatMoney(spentCents)} de {formatMoney(item.plannedCents)}
        </span>
        {remaining >= 0 ? (
          <span>Quedan {formatMoney(remaining)}</span>
        ) : (
          <span className="text-destructive">Excedido {formatMoney(-remaining)}</span>
        )}
      </div>
    </li>
  );
}

export function BudgetList({ rows, readOnly }: { rows: PeriodItemRow[]; readOnly?: boolean }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {rows.map((row) => (
        <BudgetRow key={row.item.id} {...row} readOnly={readOnly} />
      ))}
    </ul>
  );
}
