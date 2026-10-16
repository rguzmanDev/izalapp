import { ActionForm } from "@/components/form/action-form";
import { MoneyField, SelectField, TextField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { Transfer } from "@/db/schema";
import type { FormState } from "@/lib/form";
import { NOTE_MAX_LENGTH } from "@/lib/limits";

export type TransferDefaults = Partial<
  Pick<Transfer, "amountCents" | "fromAccountId" | "toAccountId" | "note">
> &
  Pick<Transfer, "occurredOn">;

type TransferFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: TransferDefaults;
  accountOptions: SelectOption[];
};

export function TransferForm({ action, defaults, accountOptions }: TransferFormProps) {
  return (
    <ActionForm action={action} confirmMessage="¿Registrar esta transferencia?">
      <MoneyField
        name="amountCents"
        label="Monto"
        required
        defaultCents={defaults.amountCents}
        autoFocus={defaults.amountCents === undefined}
      />
      <SelectField
        name="fromAccountId"
        label="Desde"
        required
        placeholder="Selecciona una cuenta"
        options={accountOptions}
        defaultValue={defaults.fromAccountId ?? ""}
      />
      <SelectField
        name="toAccountId"
        label="Hacia"
        required
        hint="Para pagar una tarjeta, elígela como destino."
        placeholder="Selecciona una cuenta"
        options={accountOptions}
        defaultValue={defaults.toAccountId ?? ""}
      />
      <TextField
        name="occurredOn"
        label="Fecha"
        type="date"
        required
        defaultValue={defaults.occurredOn}
      />
      <TextField
        name="note"
        label="Nota"
        maxLength={NOTE_MAX_LENGTH}
        defaultValue={defaults.note ?? ""}
      />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
