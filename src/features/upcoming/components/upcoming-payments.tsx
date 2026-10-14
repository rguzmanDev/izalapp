import { ItemLink, ItemList } from "@/components/item-list";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { accountLabel } from "@/features/accounts/format";
import type { CardStatement } from "@/features/cards/data";
import { paymentHref, pendingCents } from "@/features/cards/payment";
import type { PeriodItemRow } from "@/features/periods/data";
import { describeDueIn, isDueSoon } from "@/lib/due";
import { formatMoney } from "@/lib/money";
import { daysBetween, formatLongDate, nextDayOfMonth } from "@/lib/period";

type UpcomingPayment = {
  id: string;
  name: string;
  amountCents: number;
  dueDate: string;
  daysLeft: number;
  href: string;
};

/** Unpaid card statements and dated fixed expenses due within a week, overdue cards included. */
function listUpcomingPayments(
  cardStatements: CardStatement[],
  fixedExpenses: PeriodItemRow[],
  today: string,
): UpcomingPayment[] {
  const cards = cardStatements
    .filter((statement) => pendingCents(statement) > 0)
    .map((statement) => ({
      id: statement.card.id,
      name: accountLabel(statement.card),
      amountCents: pendingCents(statement),
      dueDate: statement.cycle.dueDate,
      daysLeft: daysBetween(today, statement.cycle.dueDate),
      href: paymentHref(statement),
    }));

  const expenses = fixedExpenses.flatMap(({ item }) => {
    if (item.dueDay === null || item.paymentStatus === "paid") return [];
    const dueDate = nextDayOfMonth(item.dueDay, today);
    return [
      {
        id: item.id,
        name: item.name,
        amountCents: item.plannedCents,
        dueDate,
        daysLeft: daysBetween(today, dueDate),
        href: `/partidas/${item.id}`,
      },
    ];
  });

  return [...cards, ...expenses]
    .filter((payment) => isDueSoon(payment.daysLeft))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

type UpcomingPaymentsProps = {
  cardStatements: CardStatement[];
  fixedExpenses: PeriodItemRow[];
  today: string;
};

export function UpcomingPayments({ cardStatements, fixedExpenses, today }: UpcomingPaymentsProps) {
  const payments = listUpcomingPayments(cardStatements, fixedExpenses, today);
  if (payments.length === 0) return null;

  return (
    <Section title="Próximos pagos">
      <ItemList>
        {payments.map((payment) => (
          <ItemLink
            key={payment.id}
            href={payment.href}
            title={payment.name}
            subtitle={formatLongDate(payment.dueDate)}
            trailing={
              <div className="flex flex-col items-end gap-1">
                <span>{formatMoney(payment.amountCents)}</span>
                <Badge variant={payment.daysLeft <= 1 ? "destructive" : "outline"}>
                  {describeDueIn(payment.daysLeft)}
                </Badge>
              </div>
            }
          />
        ))}
      </ItemList>
    </Section>
  );
}
