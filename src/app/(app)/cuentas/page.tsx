import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import type { FinancialAccount } from "@/db/schema";
import { listAccounts } from "@/features/accounts/data";
import { accountLabel, describeAccount } from "@/features/accounts/format";
import { listAccountMoneyViews, type AccountMoneyView } from "@/features/accounts/money-view";
import { listCardStatements, type CardStatement } from "@/features/cards/data";
import { pendingCents } from "@/features/cards/payment";
import { formatMoney } from "@/lib/money";
import { todayIsoDate } from "@/lib/period";
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
  if (view.cardReservedCents <= 0) return "Saldo planificado";
  const parts = [`tras pagar ${formatMoney(view.plannedBalanceCents)}`];
  if (view.cardDueCents > 0) parts.push(`por pagar ${formatMoney(view.cardDueCents)}`);
  if (view.cardCurrentCents > 0) parts.push(`próximo corte ${formatMoney(view.cardCurrentCents)}`);
  return parts.join(" · ");
}

function bankTrailing(view: AccountMoneyView | undefined) {
  const cents = view?.bankEstimateCents ?? view?.plannedBalanceCents ?? 0;
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs text-muted-foreground">En banco</span>
      <span className="font-medium">{formatMoney(cents)}</span>
    </div>
  );
}

function cardSubtitle(statement: CardStatement | undefined, account: FinancialAccount): string {
  const base = describeAccount(account);
  if (!statement) {
    return [base, "Seguimiento informativo"].filter(Boolean).join(" · ");
  }
  const pending = pendingCents(statement);
  const parts = [base];
  if (pending > 0) parts.push(`por pagar ${formatMoney(pending)}`);
  if (statement.currentCents > 0) parts.push(`ciclo ${formatMoney(statement.currentCents)}`);
  if (pending === 0 && statement.currentCents === 0) parts.push("sin saldo");
  return parts.filter(Boolean).join(" · ");
}

function cardTrailing(statement: CardStatement | undefined) {
  if (!statement) return null;
  const pending = pendingCents(statement);
  const cents = pending > 0 ? pending : statement.currentCents;
  const label = pending > 0 ? "Por pagar" : "Próximo corte";
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{formatMoney(cents)}</span>
    </div>
  );
}

function AccountSection({
  title,
  accounts,
  views,
  statementsByCard,
}: {
  title: string;
  accounts: FinancialAccount[];
  views: Map<string, AccountMoneyView>;
  statementsByCard: Map<string, CardStatement>;
}) {
  if (accounts.length === 0) return null;
  return (
    <Section title={title}>
      <ItemList>
        {accounts.toSorted(byBankThenName).map((account) => {
          if (account.type === "credit") {
            const statement = statementsByCard.get(account.id);
            return (
              <ItemLink
                key={account.id}
                href={`/cuentas/${account.id}`}
                title={accountLabel(account)}
                subtitle={cardSubtitle(statement, account)}
                trailing={cardTrailing(statement)}
              />
            );
          }
          const view = views.get(account.id);
          return (
            <ItemLink
              key={account.id}
              href={`/cuentas/${account.id}`}
              title={accountLabel(account)}
              subtitle={bankSubtitle(view)}
              trailing={bankTrailing(view)}
            />
          );
        })}
      </ItemList>
    </Section>
  );
}

export default async function AccountsPage() {
  const user = await requireUser();
  const today = todayIsoDate();
  const [accounts, views, statements] = await Promise.all([
    listAccounts(user.id),
    listAccountMoneyViews(user.id, today),
    listCardStatements(user.id, today),
  ]);
  const statementsByCard = new Map(statements.map((statement) => [statement.card.id, statement]));

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
            statementsByCard={statementsByCard}
          />
          <AccountSection
            title="Tarjetas de crédito"
            accounts={accounts.filter((account) => account.type === "credit")}
            views={views}
            statementsByCard={statementsByCard}
          />
        </>
      )}
    </>
  );
}
