import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { removeAccount, saveAccount } from "@/features/accounts/actions";
import { AccountForm } from "@/features/accounts/components/account-form";
import { getAccount, listAccounts } from "@/features/accounts/data";
import { accountLabel, toAccountOptions } from "@/features/accounts/format";
import { accountHasLedgerActivity, cardHasStatementActivity } from "@/features/accounts/locks";
import { listAccountMoneyViews } from "@/features/accounts/money-view";
import { listCardStatements } from "@/features/cards/data";
import { pendingCents } from "@/features/cards/payment";
import { formatMoney } from "@/lib/money";
import { todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function EditAccountPage({ params }: PageProps<"/cuentas/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const today = todayIsoDate();
  const [account, accounts, views, statements] = await Promise.all([
    getAccount(user.id, id),
    listAccounts(user.id),
    listAccountMoneyViews(user.id, today),
    listCardStatements(user.id, today),
  ]);
  if (!account) notFound();

  const hasCardActivity =
    account.type === "credit" ? await cardHasStatementActivity(user.id, id) : false;
  const canDelete =
    !(await accountHasLedgerActivity(user.id, id)) &&
    !(account.type === "credit" && hasCardActivity);

  const paymentAccounts = accounts.filter((other) => other.type !== "credit" && other.id !== id);
  const view = views.get(account.id);
  const statement = statements.find((row) => row.card.id === account.id);

  return (
    <>
      <PageHeader title={accountLabel(account)} backHref="/cuentas" />
      {account.type !== "credit" && view && (
        <Section title="Saldo">
          <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border/80 bg-card">
            <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-muted-foreground">En banco</span>
              <span className="font-medium tabular-nums select-text">
                {formatMoney(view.bankEstimateCents)}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {view.cardReservedCents > 0 ? "Tras pagar tarjetas" : "Saldo planificado"}
              </span>
              <span className="font-medium tabular-nums select-text">
                {formatMoney(view.plannedBalanceCents)}
              </span>
            </li>
            {view.cardReservedCents > 0 && (
              <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Reservado (tarjetas)</span>
                <span className="font-medium tabular-nums select-text">
                  {formatMoney(view.cardReservedCents)}
                </span>
              </li>
            )}
          </ul>
          <p className="text-xs text-muted-foreground">
            Compra con tarjeta → baja esta cuenta y sube el «por pagar». Pagar tarjeta → solo marca
            liquidación.
          </p>
        </Section>
      )}
      {account.type === "credit" && statement && (
        <Section title="Estado">
          <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border/80 bg-card">
            <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Por pagar (corte)</span>
              <span className="font-medium tabular-nums select-text">
                {formatMoney(pendingCents(statement))}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Próximo corte</span>
              <span className="font-medium tabular-nums select-text">
                {formatMoney(statement.currentCents)}
              </span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Seguimiento informativo: el dinero vive en la cuenta «Se paga desde». Pagar solo actualiza
            el «por pagar».
          </p>
        </Section>
      )}
      <AccountForm
        action={saveAccount.bind(null, account.id)}
        account={account}
        paymentAccountOptions={toAccountOptions(paymentAccounts)}
        locks={{
          type: true,
          openingBalance: true,
          paymentAccount: account.type === "credit",
          statementSchedule: hasCardActivity,
        }}
      />
      {canDelete ? (
        <DeleteButton
          action={removeAccount.bind(null, account.id)}
          confirmMessage={`¿Eliminar la cuenta "${account.name}"?`}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No se puede eliminar: ya tiene movimientos, partidas o actividad de tarjeta.
        </p>
      )}
    </>
  );
}
