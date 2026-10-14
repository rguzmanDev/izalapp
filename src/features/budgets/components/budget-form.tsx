import { ActionForm } from "@/components/form/action-form";
import { AllocationFields } from "@/components/form/allocation-fields";
import { CheckboxField, SelectField, TextField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { Budget } from "@/db/schema";
import type { FormState } from "@/lib/form";

type BudgetFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  budget?: Budget;
  accountOptions: SelectOption[];
};

export function BudgetForm({ action, budget, accountOptions }: BudgetFormProps) {
  return (
    <ActionForm action={action}>
      <TextField name="name" label="Nombre" placeholder="Gasolina" defaultValue={budget?.name} />
      <AllocationFields defaultValue={budget} />
      <SelectField
        name="spendingAccountId"
        label="Se gasta desde"
        placeholder="Selecciona una cuenta o tarjeta"
        options={accountOptions}
        defaultValue={budget?.spendingAccountId ?? ""}
      />
      <CheckboxField
        name="isFuel"
        label="Es de gasolina (registra odómetro y galones)"
        defaultChecked={budget?.isFuel ?? false}
      />
      <CheckboxField name="isActive" label="Activo" defaultChecked={budget?.isActive ?? true} />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
