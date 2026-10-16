import { notFound, redirect } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toCardOptionsByFundingAccount, toMoneyAccountOptions } from "@/features/accounts/format";
import { findFuelLogIdByTransaction } from "@/features/fuel/data";
import { listPeriodItems } from "@/features/periods/data";
import { removeTransaction, saveTransaction } from "@/features/transactions/actions";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { getTransaction } from "@/features/transactions/data";
import { toItemOptions } from "@/features/transactions/format";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function EditTransactionPage({ params }: PageProps<"/movimientos/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const transaction = await getTransaction(user.id, id);
  if (!transaction) notFound();

  const fuelLogId = await findFuelLogIdByTransaction(user.id, transaction.id);
  if (fuelLogId) redirect(`/gasolina/${fuelLogId}`);

  const [rows, accounts] = await Promise.all([
    listPeriodItems(user.id, transaction.periodId),
    listAccounts(user.id),
  ]);

  return (
    <>
      <PageHeader title={`Gasto de ${formatMoney(transaction.amountCents)}`} backHref="/movimientos" />
      <TransactionForm
        action={saveTransaction.bind(null, transaction.id)}
        transaction={transaction}
        defaultDate={transaction.occurredOn}
        itemOptions={toItemOptions(
          rows.map((row) => row.item),
          { includeId: transaction.itemId },
        )}
        accountOptions={toMoneyAccountOptions(accounts)}
        cardOptionsByAccount={toCardOptionsByFundingAccount(accounts)}
      />
      <DeleteButton
        action={removeTransaction.bind(null, transaction.id)}
        confirmMessage="¿Eliminar este movimiento?"
      />
    </>
  );
}
