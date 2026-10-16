import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { accountLabel } from "@/features/accounts/format";
import { listIncomes } from "@/features/incomes/data";
import { describeHalves } from "@/lib/allocation";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function IncomesPage() {
  const user = await requireUser();
  const rows = await listIncomes(user.id);

  return (
    <>
      <PageHeader
        title="Ingresos"
        description="Ingresos fijos de tu plan mensual"
        backHref="/ajustes"
        action={<LinkButton href="/ingresos/nuevo">Nuevo</LinkButton>}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Aún no tienes ingresos"
          description="Registra cada ingreso recurrente y la cuenta donde se deposita."
        />
      ) : (
        <ItemList>
          {rows.map(({ income, account }) => (
            <ItemLink
              key={income.id}
              href={`/ingresos/${income.id}`}
              title={income.name}
              subtitle={`${accountLabel(account)} · ${describeHalves(income)}`}
              trailing={formatMoney(income.monthlyAmountCents)}
              muted={!income.isActive}
            />
          ))}
        </ItemList>
      )}
    </>
  );
}
