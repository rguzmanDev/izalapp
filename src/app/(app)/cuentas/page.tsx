import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import type { FinancialAccount } from "@/db/schema";
import { listAccounts } from "@/features/accounts/data";
import { accountLabel, describeAccount } from "@/features/accounts/format";
import { requireUser } from "@/lib/session";

const byBankThenName = (a: FinancialAccount, b: FinancialAccount) => {
  if (!a.bank !== !b.bank) return a.bank ? -1 : 1;
  return (
    (a.bank ?? "").localeCompare(b.bank ?? "", "es", { sensitivity: "base" }) ||
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );
};

function AccountSection({ title, accounts }: { title: string; accounts: FinancialAccount[] }) {
  if (accounts.length === 0) return null;
  return (
    <Section title={title}>
      <ItemList>
        {accounts.toSorted(byBankThenName).map((account) => (
          <ItemLink
            key={account.id}
            href={`/cuentas/${account.id}`}
            title={accountLabel(account)}
            subtitle={describeAccount(account)}
          />
        ))}
      </ItemList>
    </Section>
  );
}

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
        <>
          <AccountSection
            title="Cuentas bancarias"
            accounts={accounts.filter((account) => account.type !== "credit")}
          />
          <AccountSection
            title="Tarjetas de crédito"
            accounts={accounts.filter((account) => account.type === "credit")}
          />
        </>
      )}
    </>
  );
}
