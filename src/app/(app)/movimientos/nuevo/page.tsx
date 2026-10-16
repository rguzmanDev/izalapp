import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toCardOptionsByFundingAccount, toMoneyAccountOptions } from "@/features/accounts/format";
import { OpenPeriodPrompt } from "@/features/periods/components/open-period-prompt";
import { ClosedPeriodNotice } from "@/features/periods/components/period-notices";
import { getWorkingPeriod, listPeriodItems } from "@/features/periods/data";
import { saveTransaction } from "@/features/transactions/actions";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { toItemOptions } from "@/features/transactions/format";
import { todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function NewTransactionPage({
  searchParams,
}: PageProps<"/movimientos/nuevo">) {
  const { partida } = await searchParams;
  const user = await requireUser();
  const today = todayIsoDate();
  const { period } = await getWorkingPeriod(user.id, today);

  if (!period || period.status === "closed") {
    return (
      <>
        <PageHeader title="Nuevo gasto" backHref="/" />
        {period ? <ClosedPeriodNotice periodId={period.id} /> : <OpenPeriodPrompt hasIncome />}
      </>
    );
  }

  const [rows, accounts] = await Promise.all([
    listPeriodItems(user.id, period.id),
    listAccounts(user.id),
  ]);

  return (
    <>
      <PageHeader title="Nuevo gasto" backHref="/" />
      <TransactionForm
        action={saveTransaction.bind(null, null)}
        defaultItemId={typeof partida === "string" ? partida : undefined}
        defaultDate={today}
        itemOptions={toItemOptions(rows.map((row) => row.item))}
        accountOptions={toMoneyAccountOptions(accounts)}
        cardOptionsByAccount={toCardOptionsByFundingAccount(accounts)}
      />
    </>
  );
}
