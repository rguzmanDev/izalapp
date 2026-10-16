import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { listAccounts } from "@/features/accounts/data";
import { toMoneyAccountOptions } from "@/features/accounts/format";
import { closePeriodAction } from "@/features/periods/actions";
import { ClosePeriodForm } from "@/features/periods/components/close-period-form";
import { ClosingSummary } from "@/features/periods/components/closing-summary";
import { getPeriod, getUnbudgetedSpent, listPeriodItems } from "@/features/periods/data";
import { summarizePeriod } from "@/features/periods/summary";
import { periodLabel, toPeriodKey } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function ClosePeriodPage({ params }: PageProps<"/quincenas/[id]/cerrar">) {
  const { id } = await params;
  const user = await requireUser();
  const period = await getPeriod(user.id, id);
  if (!period) notFound();
  if (period.status === "closed") redirect("/");

  const [rows, unbudgetedCents, accounts] = await Promise.all([
    listPeriodItems(user.id, period.id),
    getUnbudgetedSpent(user.id, period.id),
    listAccounts(user.id),
  ]);
  const summary = summarizePeriod(rows, unbudgetedCents);
  const unpaidCount = rows.filter(
    ({ item }) => item.kind === "fixed_expense" && item.paymentStatus !== "paid",
  ).length;
  const incomeAccountId = rows.find(({ item }) => item.kind === "income")?.item.accountId;
  const savingsAccountId = accounts.find((account) => account.type === "savings")?.id;

  return (
    <>
      <PageHeader
        title="Cerrar quincena"
        description={periodLabel(toPeriodKey(period))}
        backHref="/"
      />
      <ClosingSummary summary={summary} />
      {unpaidCount > 0 && (
        <Alert>
          <AlertDescription>
            {unpaidCount === 1
              ? "Tienes 1 gasto fijo sin marcar como pagado; se cuenta como gastado."
              : `Tienes ${unpaidCount} gastos fijos sin marcar como pagados; se cuentan como gastados.`}
          </AlertDescription>
        </Alert>
      )}
      <ClosePeriodForm
        action={closePeriodAction.bind(null, period.id)}
        surplusCents={summary.actualSurplusCents}
        defaultFromAccountId={incomeAccountId}
        defaultToAccountId={savingsAccountId}
        accountOptions={toMoneyAccountOptions(accounts)}
      />
    </>
  );
}
