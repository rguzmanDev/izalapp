import { ActionForm } from "@/components/form/action-form";
import { AllocationFields } from "@/components/form/allocation-fields";
import { CheckboxField, SelectField, TextField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { Budget } from "@/db/schema";
import type { FormState } from "@/lib/form";
import { NAME_MAX_LENGTH } from "@/lib/limits";

type BudgetFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  budget?: Budget;
  accountOptions: SelectOption[];
  lockStructure?: boolean;
  lockFuel?: boolean;
};

export function BudgetForm({
  action,
  budget,
  accountOptions,
  lockStructure = false,
  lockFuel = false,
}: BudgetFormProps) {
  return (
    <ActionForm
      action={action}
      confirmMessage={budget ? "¿Guardar los cambios de este presupuesto?" : "¿Crear este presupuesto?"}
    >
      <TextField
        name="name"
        label="Nombre"
        required
        placeholder="Nombre del presupuesto"
        maxLength={NAME_MAX_LENGTH}
        defaultValue={budget?.name}
      />
      <AllocationFields defaultValue={budget} lockSplit={lockStructure} />
      <SelectField
        name="spendingAccountId"
        label="Se gasta desde"
        required
        placeholder="Selecciona una cuenta bancaria o efectivo"
        hint={
          lockStructure
            ? "Ya se usó en una quincena; no se puede cambiar la cuenta."
            : "El dinero sale de esta cuenta. Al gastar podrás marcar si usaste una tarjeta ligada."
        }
        options={accountOptions}
        defaultValue={budget?.spendingAccountId ?? ""}
        locked={lockStructure}
      />
      <CheckboxField
        name="isFuel"
        label="Es de gasolina (registra odómetro y galones)"
        defaultChecked={budget?.isFuel ?? false}
        locked={lockFuel}
        hint={
          lockFuel
            ? "Ya se usó en una quincena o tiene cargas; no se puede cambiar «es gasolina»."
            : undefined
        }
      />
      <CheckboxField name="isActive" label="Activo" defaultChecked={budget?.isActive ?? true} />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
