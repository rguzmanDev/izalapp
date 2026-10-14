import { ActionForm } from "@/components/form/action-form";
import { AllocationFields } from "@/components/form/allocation-fields";
import { CheckboxField, SelectField, TextField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { Income } from "@/db/schema";
import type { FormState } from "@/lib/form";

type IncomeFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  income?: Income;
  accountOptions: SelectOption[];
};

export function IncomeForm({ action, income, accountOptions }: IncomeFormProps) {
  return (
    <ActionForm action={action}>
      <TextField name="name" label="Nombre" placeholder="Salario" defaultValue={income?.name} />
      <AllocationFields defaultValue={income} />
      <SelectField
        name="depositAccountId"
        label="Se deposita en"
        placeholder="Selecciona una cuenta"
        options={accountOptions}
        defaultValue={income?.depositAccountId ?? ""}
      />
      <CheckboxField name="isActive" label="Activo" defaultChecked={income?.isActive ?? true} />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
