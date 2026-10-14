import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { removeTransfer, saveTransfer } from "@/features/transfers/actions";
import { TransferForm } from "@/features/transfers/components/transfer-form";
import { getTransfer } from "@/features/transfers/data";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function EditTransferPage({ params }: PageProps<"/transferencias/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const transfer = await getTransfer(user.id, id);
  if (!transfer) notFound();

  const accounts = await listAccounts(user.id);

  return (
    <>
      <PageHeader
        title={`Transferencia de ${formatMoney(transfer.amountCents)}`}
        backHref="/movimientos"
      />
      <TransferForm
        action={saveTransfer.bind(null, transfer.id)}
        defaults={transfer}
        accountOptions={toAccountOptions(accounts)}
      />
      <DeleteButton
        action={removeTransfer.bind(null, transfer.id)}
        confirmMessage="¿Eliminar esta transferencia?"
      />
    </>
  );
}
