import Link from "next/link";
import { ConfirmForm } from "@/components/form/confirm-form";
import { PendingButton } from "@/components/form/pending-button";
import { LinkButton } from "@/components/link-button";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { setPaymentStatus } from "../actions";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "../constants";
import type { PeriodItemRow } from "../data";

type BudgetRowProps = PeriodItemRow & { readOnly?: boolean };

function BudgetRow({ item, spentCents, readOnly }: BudgetRowProps) {
  const remaining = item.plannedCents - spentCents;
  const canSpend = item.paymentStatus !== "pending";

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
            {canSpend ? (
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
            ) : (
              <Link
                href={`/partidas/${item.id}/apartar`}
                className="text-sm font-medium text-foreground hover:underline"
              >
                Aparta primero
              </Link>
            )}
          </>
        )}
      </div>
      <ProgressBar value={spentCents} max={item.plannedCents} />
      <div className="flex justify-between gap-3 text-sm tabular-nums select-text">
        <span className="text-muted-foreground">
          {formatMoney(spentCents)} de {formatMoney(item.plannedCents)}
        </span>
        <div className="flex items-center gap-2">
          {item.paymentStatus !== "pending" && (
            <Badge variant="secondary">{PAYMENT_STATUS_LABELS[item.paymentStatus as PaymentStatus]}</Badge>
          )}
          {remaining >= 0 ? (
            <span>Quedan {formatMoney(remaining)}</span>
          ) : (
            <span className="text-destructive">Excedido {formatMoney(-remaining)}</span>
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="flex justify-end gap-2">
          {item.paymentStatus === "pending" && (
            <LinkButton href={`/partidas/${item.id}/apartar`} variant="outline" size="sm">
              Apartar
            </LinkButton>
          )}
          {item.paymentStatus === "set_aside" && (
            <ConfirmForm
              action={setPaymentStatus.bind(null, item.id, "pending")}
              confirmMessage={`¿Deshacer el apartado de "${item.name}"?`}
            >
              <PendingButton variant="outline" size="sm">
                Deshacer
              </PendingButton>
            </ConfirmForm>
          )}
        </div>
      )}
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
