import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getAccount } from "@/features/accounts/data";
import { accountLabel } from "@/features/accounts/format";
import { saveCardPayment } from "@/features/cards/actions";
import { CardPaymentForm } from "@/features/cards/components/card-payment-form";
import { listCardStatements } from "@/features/cards/data";
import { pendingCents } from "@/features/cards/payment";
import { formatMoney } from "@/lib/money";
import { todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function PayCardPage({
  params,
  searchParams,
}: PageProps<"/tarjetas/[id]/pagar">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const today = todayIsoDate();
  const card = await getAccount(user.id, id);
  if (!card || card.type !== "credit") notFound();

  const statements = await listCardStatements(user.id, today);
  const statement = statements.find((row) => row.card.id === card.id);
  const pending = statement ? pendingCents(statement) : 0;
  const monto = Number(typeof query.monto === "string" ? query.monto : "");
  const defaultAmount =
    Number.isInteger(monto) && monto > 0 ? monto : pending > 0 ? pending : 0;

  return (
    <>
      <PageHeader
        title={`Pagar ${accountLabel(card)}`}
        description={
          pending > 0
            ? `Por pagar del corte: ${formatMoney(pending)}. Esto no mueve el banco.`
            : "No hay pendiente del corte actual. Puedes registrar un pago igual."
        }
        backHref="/"
      />
      <CardPaymentForm
        action={saveCardPayment}
        cardId={card.id}
        defaultAmountCents={defaultAmount}
        defaultDate={today}
      />
    </>
  );
}
