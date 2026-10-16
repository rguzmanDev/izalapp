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
      confirmMessage="¿Registrar este pago de tarjeta? Solo marca liquidación; no mueve el banco."
    >
      <input type="hidden" name="cardId" value={cardId} />
      <MoneyField
        name="amountCents"
        label="Monto pagado"
        required
        defaultCents={defaultAmountCents > 0 ? defaultAmountCents : undefined}
        autoFocus
        hint="Compra → ya bajó la cuenta fondeadora. Este paso solo baja el «por pagar». Si transferiste entre bancos, regístralo aparte."
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
