import { ActionForm } from "@/components/form/action-form";
import { MoneyField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { FormState } from "@/lib/form";
import { NOTE_MAX_LENGTH } from "@/lib/limits";

type CardPaymentFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  cardId: string;
  defaultAmountCents: number;
  defaultDate: string;
};

export function CardPaymentForm({
  action,
  cardId,
  defaultAmountCents,
  defaultDate,
}: CardPaymentFormProps) {
  return (
    <ActionForm
      action={action}
      confirmMessage="¿Registrar este pago de tarjeta? No mueve dinero del banco (ya salió al comprar)."
    >
      <input type="hidden" name="cardId" value={cardId} />
      <MoneyField
        name="amountCents"
        label="Monto pagado"
        required
        defaultCents={defaultAmountCents > 0 ? defaultAmountCents : undefined}
        autoFocus
        hint="Solo actualiza el «por pagar» de la tarjeta. Si también moviste dinero entre bancos, regístralo aparte como transferencia."
      />
      <TextField
        name="occurredOn"
        label="Fecha"
        type="date"
        required
        defaultValue={defaultDate}
      />
      <TextField name="note" label="Nota" maxLength={NOTE_MAX_LENGTH} defaultValue="" />
      <SubmitButton>Registrar pago</SubmitButton>
    </ActionForm>
  );
}
