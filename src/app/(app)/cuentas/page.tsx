import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { accountLabel, describeAccount } from "@/features/accounts/format";
import { requireUser } from "@/lib/session";

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);

  return (
    <>
      <PageHeader
        title="Cuentas"
        description="Cuentas bancarias y tarjetas de crédito"
        backHref="/ajustes"
        action={<LinkButton href="/cuentas/nueva">Nueva</LinkButton>}
      />
      {accounts.length === 0 ? (
        <EmptyState
          title="Aún no tienes cuentas"
          description="Agrega la cuenta donde recibes tu salario y las demás a las que mueves dinero."
        />
      ) : (
        <ItemList>
          {accounts.map((account) => (
            <ItemLink
              key={account.id}
              href={`/cuentas/${account.id}`}
              title={accountLabel(account)}
              subtitle={describeAccount(account)}
            />
          ))}
        </ItemList>
      )}
    </>
  );
}
