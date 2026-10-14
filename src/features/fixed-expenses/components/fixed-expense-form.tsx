import { ActionForm } from "@/components/form/action-form";
import { AllocationFields } from "@/components/form/allocation-fields";
import { CheckboxField, SelectField, TextField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { FixedExpense } from "@/db/schema";
import type { FormState } from "@/lib/form";

type FixedExpenseFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  expense?: FixedExpense;
  accountOptions: SelectOption[];
};

export function FixedExpenseForm({ action, expense, accountOptions }: FixedExpenseFormProps) {
  return (
    <ActionForm action={action}>
      <TextField name="name" label="Nombre" placeholder="Préstamo" defaultValue={expense?.name} />
      <AllocationFields defaultValue={expense} />
      <TextField
        name="dueDay"
        label="Día de pago"
        hint="Día del mes en que vence o se cobra"
        inputMode="numeric"
        defaultValue={expense?.dueDay ?? ""}
      />
      <SelectField
        name="paymentAccountId"
        label="Se paga con"
        placeholder="Selecciona una cuenta o tarjeta"
        options={accountOptions}
        defaultValue={expense?.paymentAccountId ?? ""}
      />
      <CheckboxField name="isActive" label="Activo" defaultChecked={expense?.isActive ?? true} />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
