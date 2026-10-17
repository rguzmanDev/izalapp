import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { accountLabel, toCardOptionsForAccount } from "@/features/accounts/format";
import { markFixedExpensePaid } from "@/features/periods/actions";
import { MarkPaidForm } from "@/features/periods/components/mark-paid-form";
import { getPeriodItem } from "@/features/periods/data";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function MarkPaidPage({ params }: PageProps<"/partidas/[id]/pagar">) {
  const { id } = await params;
  const user = await requireUser();
  const item = await getPeriodItem(user.id, id);
  if (!item || item.kind !== "fixed_expense") notFound();
  if (item.paymentStatus === "paid") notFound();

  const accounts = await listAccounts(user.id);
  const itemAccount = accounts.find((account) => account.id === item.accountId);
  if (!itemAccount || itemAccount.type === "credit") notFound();

  const cardOptions = toCardOptionsForAccount(accounts, item.accountId);

  return (
    <>
      <PageHeader
        title={`Pagar ${item.name}`}
        description={`${formatMoney(item.plannedCents)} · ${accountLabel(itemAccount)}`}
        backHref="/"
      />
      <MarkPaidForm
        action={markFixedExpensePaid.bind(null, item.id)}
        amountCents={item.plannedCents}
        accountLabel={accountLabel(itemAccount)}
        cardOptions={cardOptions}
      />
    </>
  );
}
