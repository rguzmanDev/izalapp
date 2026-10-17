import { ActionForm } from "@/components/form/action-form";
import { AllocationFields } from "@/components/form/allocation-fields";
import { CheckboxField, SelectField, TextField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { Income } from "@/db/schema";
import type { FormState } from "@/lib/form";
import { NAME_MAX_LENGTH } from "@/lib/limits";

type IncomeFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  income?: Income;
  accountOptions: SelectOption[];
  lockAccount?: boolean;
};

export function IncomeForm({
  action,
  income,
  accountOptions,
  lockAccount = false,
}: IncomeFormProps) {
  return (
    <ActionForm
      action={action}
      confirmMessage={income ? "¿Guardar los cambios de este ingreso?" : "¿Crear este ingreso?"}
    >
      <TextField
        name="name"
        label="Nombre"
        required
        placeholder="Nombre del ingreso"
        maxLength={NAME_MAX_LENGTH}
        defaultValue={income?.name}
      />
      <AllocationFields defaultValue={income} />
      <SelectField
        name="depositAccountId"
        label="Se deposita en"
        required
        placeholder="Selecciona una cuenta"
        hint={
          lockAccount
            ? "Ya se usó en una quincena; no se puede cambiar la cuenta de depósito."
            : undefined
        }
        options={accountOptions}
        defaultValue={income?.depositAccountId ?? ""}
        locked={lockAccount}
      />
      <CheckboxField name="isActive" label="Activo" defaultChecked={income?.isActive ?? true} />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
