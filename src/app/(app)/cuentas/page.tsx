import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import type { FinancialAccount } from "@/db/schema";
import { listAccounts } from "@/features/accounts/data";
import { accountLabel, describeAccount } from "@/features/accounts/format";
import { listAccountMoneyViews, type AccountMoneyView } from "@/features/accounts/money-view";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

const byBankThenName = (a: FinancialAccount, b: FinancialAccount) => {
  if (!a.bank !== !b.bank) return a.bank ? -1 : 1;
  return (
    (a.bank ?? "").localeCompare(b.bank ?? "", "es", { sensitivity: "base" }) ||
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );
};

function bankSubtitle(view: AccountMoneyView | undefined): string {
  if (!view) return "";
  if (view.cardReservedCents <= 0) return `Tras pagar tarjetas ${formatMoney(view.plannedBalanceCents)}`;
  const parts = [
    `En banco ${formatMoney(view.bankEstimateCents)}`,
    `tras pagar ${formatMoney(view.plannedBalanceCents)}`,
  ];
  if (view.cardDueCents > 0) parts.push(`por pagar ${formatMoney(view.cardDueCents)}`);
  if (view.cardCurrentCents > 0) parts.push(`próximo corte ${formatMoney(view.cardCurrentCents)}`);
  return parts.join(" · ");
}

function AccountSection({
  title,
  accounts,
  views,
}: {
  title: string;
  accounts: FinancialAccount[];
  views: Map<string, AccountMoneyView>;
}) {
  if (accounts.length === 0) return null;
  return (
    <Section title={title}>
      <ItemList>
        {accounts.toSorted(byBankThenName).map((account) => {
          if (account.type === "credit") {
            return (
              <ItemLink
                key={account.id}
                href={`/cuentas/${account.id}`}
                title={accountLabel(account)}
                subtitle={[describeAccount(account), "Seguimiento informativo (compras / por pagar)"]
                  .filter(Boolean)
                  .join(" · ")}
              />
            );
          }
          const view = views.get(account.id);
          const trailing = view?.bankEstimateCents ?? view?.plannedBalanceCents ?? 0;
          return (
            <ItemLink
              key={account.id}
              href={`/cuentas/${account.id}`}
              title={accountLabel(account)}
              subtitle={bankSubtitle(view)}
              trailing={formatMoney(trailing)}
            />
          );
        })}
      </ItemList>
    </Section>
  );
}

export default async function AccountsPage() {
  const user = await requireUser();
  const [accounts, views] = await Promise.all([
    listAccounts(user.id),
    listAccountMoneyViews(user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Cuentas"
        description="En banco ≈ lo físico (aún no pagaste tarjetas). Tras pagar = lo que queda cuando liquides esas compras."
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
            views={views}
          />
          <AccountSection
            title="Tarjetas de crédito"
            accounts={accounts.filter((account) => account.type === "credit")}
            views={views}
          />
        </>
      )}
    </>
  );
}
