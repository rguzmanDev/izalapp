import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { accountLabel } from "@/features/accounts/format";
import { describeDueIn, isDueSoon } from "@/lib/due";
import { formatMoney } from "@/lib/money";
import { daysBetween, formatLongDate } from "@/lib/period";
import { cn } from "@/lib/utils";
import type { CardStatement } from "../data";
import { paymentHref, pendingCents } from "../payment";

function CardStatementRow({ statement, today }: { statement: CardStatement; today: string }) {
  const { card, cycle, statementCents, currentCents } = statement;
  const pending = pendingCents(statement);
  const daysLeft = daysBetween(today, cycle.dueDate);
  const isOverdue = pending > 0 && daysLeft < 0;

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col select-text">
          <span className="truncate font-medium">{accountLabel(card)}</span>
          <span className="text-sm text-muted-foreground">
            Corte {formatLongDate(cycle.cutoff)} · Pago {formatLongDate(cycle.dueDate)}
          </span>
          {pending > 0 && isDueSoon(daysLeft) && (
            <span
              className={cn(
                "text-sm font-medium",
                daysLeft <= 1 ? "text-destructive" : "text-foreground",
              )}
            >
              El pago {describeDueIn(daysLeft)}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            Llevas {formatMoney(currentCents)} para el próximo corte
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-medium tabular-nums select-text">{formatMoney(statementCents)}</span>
          {statementCents === 0 ? (
            <Badge variant="outline">Sin saldo</Badge>
          ) : pending === 0 ? (
            <Badge>Pagada</Badge>
          ) : (
            <Badge variant={isOverdue ? "destructive" : "outline"}>
              {isOverdue ? "Vencida" : "Por pagar"} {formatMoney(pending)}
            </Badge>
          )}
        </div>
      </div>
      {pending > 0 && (
        <div className="flex justify-end">
          <Link href={paymentHref(statement)} className={buttonVariants({ size: "sm" })}>
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
