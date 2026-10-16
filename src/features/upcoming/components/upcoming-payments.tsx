import { ItemLink, ItemList } from "@/components/item-list";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
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

/** Dated fixed expenses due within a week (cards live in the Tarjetas section). */
function listUpcomingPayments(fixedExpenses: PeriodItemRow[], today: string): UpcomingPayment[] {
  return fixedExpenses
    .flatMap(({ item }) => {
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
    })
    .filter((payment) => isDueSoon(payment.daysLeft))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

type UpcomingPaymentsProps = {
  fixedExpenses: PeriodItemRow[];
  today: string;
};

export function UpcomingPayments({ fixedExpenses, today }: UpcomingPaymentsProps) {
  const payments = listUpcomingPayments(fixedExpenses, today);
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
