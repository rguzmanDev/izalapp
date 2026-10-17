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
  lockAccount?: boolean;
  lockFuelOff?: boolean;
};

export function BudgetForm({
  action,
  budget,
  accountOptions,
  lockAccount = false,
  lockFuelOff = false,
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
      <AllocationFields defaultValue={budget} />
      <SelectField
        name="spendingAccountId"
        label="Se gasta desde"
        required
        placeholder="Selecciona una cuenta bancaria o efectivo"
        hint={
          lockAccount
            ? "Ya está apartado o tiene gastos en una quincena; no se puede cambiar la cuenta."
            : "El dinero sale de esta cuenta. Al gastar podrás marcar si usaste una tarjeta ligada."
        }
        options={accountOptions}
        defaultValue={budget?.spendingAccountId ?? ""}
        locked={lockAccount}
      />
      <CheckboxField
        name="isFuel"
        label="Es de gasolina (registra odómetro y galones)"
        defaultChecked={budget?.isFuel ?? false}
        locked={lockFuelOff && Boolean(budget?.isFuel)}
        hint={
          lockFuelOff && budget?.isFuel
            ? "Ya hay cargas de gasolina ligadas; no se puede quitar esta marca."
            : undefined
        }
      />
      <CheckboxField name="isActive" label="Activo" defaultChecked={budget?.isActive ?? true} />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
