import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { accountLabel } from "@/features/accounts/format";
import { formatMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/period";
import type { CardStatement } from "../data";

function paymentHref({ card }: CardStatement, amountCents: number) {
  const params = new URLSearchParams({ hacia: card.id, monto: String(amountCents) });
  if (card.paymentAccountId) params.set("desde", card.paymentAccountId);
  return `/transferencias/nueva?${params}`;
}

function CardStatementRow({ statement, today }: { statement: CardStatement; today: string }) {
  const { card, cycle, statementCents, paidCents, currentCents } = statement;
  const pendingCents = Math.max(0, statementCents - paidCents);
  const isOverdue = pendingCents > 0 && today > cycle.dueDate;

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col select-text">
          <span className="truncate font-medium">{accountLabel(card)}</span>
          <span className="text-sm text-muted-foreground">
            Corte {formatShortDate(cycle.cutoff)} · Límite {formatShortDate(cycle.dueDate)}
          </span>
          <span className="text-sm text-muted-foreground">
            Llevas {formatMoney(currentCents)} para el próximo corte
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-medium tabular-nums select-text">{formatMoney(statementCents)}</span>
          {statementCents === 0 ? (
            <Badge variant="outline">Sin saldo</Badge>
          ) : pendingCents === 0 ? (
            <Badge>Pagada</Badge>
          ) : (
            <Badge variant={isOverdue ? "destructive" : "outline"}>
              {isOverdue ? "Vencida" : "Por pagar"} {formatMoney(pendingCents)}
            </Badge>
          )}
        </div>
      </div>
      {pendingCents > 0 && (
        <div className="flex justify-end">
          <Link
            href={paymentHref(statement, pendingCents)}
            className={buttonVariants({ size: "sm" })}
          >
            Pagar
          </Link>
        </div>
      )}
    </li>
  );
}

export function CardStatementList({
  statements,
  today,
}: {
  statements: CardStatement[];
  today: string;
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {statements.map((statement) => (
        <CardStatementRow key={statement.card.id} statement={statement} today={today} />
      ))}
    </ul>
  );
}
