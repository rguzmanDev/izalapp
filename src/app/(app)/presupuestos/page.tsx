import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { accountLabel } from "@/features/accounts/format";
import { listBudgets } from "@/features/budgets/data";
import { describeHalves } from "@/lib/allocation";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function BudgetsPage() {
  const user = await requireUser();
  const rows = await listBudgets(user.id);

  return (
    <>
      <PageHeader
        title="Presupuestos"
        description="Topes mensuales para gastos variables"
        backHref="/ajustes"
        action={<LinkButton href="/presupuestos/nuevo">Nuevo</LinkButton>}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Aún no tienes presupuestos"
          description="Define un tope mensual para cada categoría de gasto variable."
        />
      ) : (
        <ItemList>
          {rows.map(({ budget, account }) => (
            <ItemLink
              key={budget.id}
              href={`/presupuestos/${budget.id}`}
              title={budget.name}
              subtitle={`${accountLabel(account)} · ${describeHalves(budget)}`}
              trailing={formatMoney(budget.monthlyAmountCents)}
              muted={!budget.isActive}
            />
          ))}
        </ItemList>
      )}
    </>
  );
}
