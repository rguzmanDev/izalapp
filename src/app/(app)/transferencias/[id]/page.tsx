import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toMoneyAccountOptions } from "@/features/accounts/format";
import { removeTransfer, saveTransfer } from "@/features/transfers/actions";
import { TransferForm } from "@/features/transfers/components/transfer-form";
import { getTransfer } from "@/features/transfers/data";
import { isSetAsideTransferNote } from "@/features/transfers/plan";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function EditTransferPage({ params }: PageProps<"/transferencias/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const transfer = await getTransfer(user.id, id);
  if (!transfer) notFound();

  const accounts = await listAccounts(user.id);
  const isApartado = isSetAsideTransferNote(transfer.note);

  return (
    <>
      <PageHeader
        title={`Transferencia de ${formatMoney(transfer.amountCents)}`}
        backHref="/movimientos"
      />
      {isApartado ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 text-sm">
          <p>
            Esta es una transferencia de <span className="font-medium">apartado</span>
            {transfer.note ? ` (${transfer.note})` : ""}. No se edita ni elimina aquí.
          </p>
          <p className="text-muted-foreground">
            Para revertirla usa <span className="font-medium text-foreground">Deshacer</span> en la
            partida correspondiente en Inicio.
          </p>
          <Link href="/" className="text-sm font-medium text-foreground underline-offset-2 hover:underline">
            Ir a Inicio
          </Link>
        </div>
      ) : (
        <>
          <TransferForm
            action={saveTransfer.bind(null, transfer.id)}
            defaults={transfer}
            accountOptions={toMoneyAccountOptions(accounts)}
          />
          <DeleteButton
            action={removeTransfer.bind(null, transfer.id)}
            confirmMessage="¿Eliminar esta transferencia?"
          />
        </>
      )}
    </>
  );
}
