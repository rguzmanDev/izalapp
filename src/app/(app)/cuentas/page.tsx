import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import type { FinancialAccount } from "@/db/schema";
import { listAccountBalances } from "@/features/accounts/balance";
import { listAccounts } from "@/features/accounts/data";
import { accountLabel, describeAccount } from "@/features/accounts/format";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

const byBankThenName = (a: FinancialAccount, b: FinancialAccount) => {
  if (!a.bank !== !b.bank) return a.bank ? -1 : 1;
  return (
    (a.bank ?? "").localeCompare(b.bank ?? "", "es", { sensitivity: "base" }) ||
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );
};

function AccountSection({
  title,
  accounts,
  balances,
}: {
  title: string;
  accounts: FinancialAccount[];
  balances: Map<string, { plannedBalanceCents: number }>;
}) {
  if (accounts.length === 0) return null;
  return (
    <Section title={title}>
      <ItemList>
        {accounts.toSorted(byBankThenName).map((account) => {
          const planned = balances.get(account.id)?.plannedBalanceCents ?? 0;
          const subtitle =
            account.type === "credit"
              ? [describeAccount(account), planned < 0 ? `Deuda ${formatMoney(-planned)}` : "Sin deuda planificada"]
                  .filter(Boolean)
                  .join(" · ")
              : describeAccount(account);
          return (
            <ItemLink
              key={account.id}
              href={`/cuentas/${account.id}`}
              title={accountLabel(account)}
              subtitle={subtitle}
              trailing={account.type === "credit" ? undefined : formatMoney(planned)}
            />
          );
        })}
      </ItemList>
    </Section>
  );
}

export default async function AccountsPage() {
  const user = await requireUser();
  const [accounts, balances] = await Promise.all([
    listAccounts(user.id),
    listAccountBalances(user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Cuentas"
        description="Saldo planificado: inicial + ingresos − gastos ± transferencias (no es el saldo del banco)."
        backHref="/ajustes"
        action={<LinkButton href="/cuentas/nueva">Nueva</LinkButton>}
      />
      {accounts.length === 0 ? (
        <EmptyState
          title="Aún no tienes cuentas"
          description="Agrega las cuentas donde recibes y mueves dinero. Para efectivo, crea una cuenta llamada Efectivo."
        />
      ) : (
        <>
          <AccountSection
            title="Cuentas bancarias"
            accounts={accounts.filter((account) => account.type !== "credit")}
            balances={balances}
          />
          <AccountSection
            title="Tarjetas de crédito"
            accounts={accounts.filter((account) => account.type === "credit")}
            balances={balances}
          />
        </>
      )}
    </>
  );
}
