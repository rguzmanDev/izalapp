import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { accountLabel, toAccountOptions } from "@/features/accounts/format";
import { setAsideWithTransfer } from "@/features/periods/actions";
import { SetAsideForm } from "@/features/periods/components/set-aside-form";
import { getPeriodItem, listPeriodItems } from "@/features/periods/data";
import { fundingAccountId } from "@/features/transfers/plan";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function SetAsidePage({ params }: PageProps<"/partidas/[id]/apartar">) {
  const { id } = await params;
  const user = await requireUser();
  const item = await getPeriodItem(user.id, id);
  if (!item || (item.kind !== "budget" && item.kind !== "fixed_expense")) notFound();
  if (item.paymentStatus !== "pending") notFound();

  const [accounts, rows] = await Promise.all([
    listAccounts(user.id),
    listPeriodItems(user.id, item.periodId),
  ]);
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const itemAccount = accountsById.get(item.accountId);
  const toAccountId = fundingAccountId(itemAccount, item.accountId);
  const toAccount = accountsById.get(toAccountId);
  if (!toAccount) notFound();

  const fromAccounts = accounts.filter((account) => account.type !== "credit");
  const incomeAccountId = rows.find((row) => row.item.kind === "income")?.item.accountId;
  const defaultFrom =
    incomeAccountId && fromAccounts.some((account) => account.id === incomeAccountId)
      ? incomeAccountId
      : fromAccounts[0]?.id;

  return (
    <>
      <PageHeader
        title={`Apartar ${item.name}`}
        description={`${formatMoney(item.plannedCents)} · destino ${accountLabel(toAccount)}`}
        backHref="/"
      />
      <SetAsideForm
        action={setAsideWithTransfer.bind(null, item.id)}
        amountCents={item.plannedCents}
        toAccountLabel={accountLabel(toAccount)}
        fromAccountOptions={toAccountOptions(fromAccounts)}
        defaultFromAccountId={defaultFrom}
      />
    </>
  );
}
