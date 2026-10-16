import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { accountLabel, toAccountOptions } from "@/features/accounts/format";
import { isPeriodOpen } from "@/features/periods/data";
import { SetAsideForm } from "@/features/periods/components/set-aside-form";
import { completeTransferStep } from "@/features/transfers/actions";
import { getTransferPlan } from "@/features/transfers/data";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function FundAccountPage({
  params,
}: PageProps<"/fondear/[periodId]/[toAccountId]">) {
  const { periodId, toAccountId } = await params;
  const user = await requireUser();
  if (!(await isPeriodOpen(user.id, periodId))) redirect("/");

  const [{ steps, accounts }, allAccounts] = await Promise.all([
    getTransferPlan(user.id, periodId),
    listAccounts(user.id),
  ]);
  const step = steps.find((candidate) => candidate.toAccountId === toAccountId);
  const pendingCents = step ? step.amountCents - step.doneCents : 0;
  if (!step || pendingCents <= 0) notFound();

  const toAccount = accounts.find((account) => account.id === toAccountId);
  if (!toAccount) notFound();

  const fromAccounts = allAccounts.filter((account) => account.type !== "credit");
  const defaultFrom =
    fromAccounts.some((account) => account.id === step.suggestedFromAccountId)
      ? step.suggestedFromAccountId
      : fromAccounts[0]?.id;
  const toLabel = accountLabel(toAccount);

  return (
    <>
      <PageHeader
        title="Registrar fondeo"
        description={`${formatMoney(pendingCents)} hacia ${toLabel}`}
        backHref="/"
      />
      <SetAsideForm
        action={completeTransferStep.bind(null, periodId, toAccountId)}
        amountCents={pendingCents}
        toAccountLabel={toLabel}
        fromAccountOptions={toAccountOptions(fromAccounts)}
        defaultFromAccountId={defaultFrom}
        description={
          <>
            Se registrará una transferencia de {formatMoney(pendingCents)} hacia{" "}
            <span className="font-medium text-foreground">{toLabel}</span> y se apartará lo
            pendiente de esa cuenta. Puedes cambiar el origen si moviste el dinero desde otra
            cuenta.
          </>
        }
        confirmMessage={`¿Registrar fondeo de ${formatMoney(pendingCents)} hacia ${toLabel}?`}
        submitLabel="Registrar fondeo"
      />
    </>
  );
}
