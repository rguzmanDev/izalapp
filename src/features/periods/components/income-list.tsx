import Link from "next/link";
import { accountLabel } from "@/features/accounts/format";
import { formatMoney } from "@/lib/money";
import { isExtraIncome } from "../constants";
import type { PeriodItemRow } from "../data";

export function IncomeList({ rows, readOnly }: { rows: PeriodItemRow[]; readOnly?: boolean }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {rows.map(({ item, account }) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-col select-text">
            {readOnly ? (
              <span className="truncate font-medium">{item.name}</span>
            ) : (
              <Link href={`/partidas/${item.id}`} className="truncate font-medium hover:underline">
                {item.name}
              </Link>
            )}
            <span className="truncate text-sm text-muted-foreground">
              {isExtraIncome(item) ? `Extra · ${accountLabel(account)}` : accountLabel(account)}
            </span>
          </div>
          <span className="shrink-0 text-sm tabular-nums select-text">
            {formatMoney(item.plannedCents)}
          </span>
        </li>
      ))}
    </ul>
  );
}
