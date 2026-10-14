import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { accountLabel } from "@/features/accounts/format";
import { listFixedExpenses } from "@/features/fixed-expenses/data";
import { describeHalves } from "@/lib/allocation";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function FixedExpensesPage() {
  const user = await requireUser();
  const rows = await listFixedExpenses(user.id);

  return (
    <>
      <PageHeader
        title="Gastos fijos"
        description="Pagos recurrentes y cómo se reparten por quincena"
        backHref="/ajustes"
        action={<LinkButton href="/gastos-fijos/nuevo">Nuevo</LinkButton>}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Aún no tienes gastos fijos"
          description="Agrega pagos como préstamos, seguros, teléfono o el aporte de la casa."
        />
      ) : (
        <ItemList>
          {rows.map(({ expense, account }) => (
            <ItemLink
              key={expense.id}
              href={`/gastos-fijos/${expense.id}`}
              title={expense.dueDay ? `${expense.name} · día ${expense.dueDay}` : expense.name}
              subtitle={`${accountLabel(account)} · ${describeHalves(expense)}`}
              trailing={formatMoney(expense.monthlyAmountCents)}
              muted={!expense.isActive}
            />
          ))}
        </ItemList>
      )}
    </>
  );
}
