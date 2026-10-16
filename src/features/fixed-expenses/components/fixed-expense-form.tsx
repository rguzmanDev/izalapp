"use client";

import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import { AllocationFields } from "@/components/form/allocation-fields";
import {
  CheckboxField,
  IntegerField,
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { FixedExpense } from "@/db/schema";
import type { FormState } from "@/lib/form";
import { DAY_OF_MONTH_MAX, NAME_MAX_LENGTH } from "@/lib/limits";
import { DUE_MODE_LABELS, DUE_MODES, type DueMode } from "../constants";

const dueModeOptions = DUE_MODES.map((mode) => ({ value: mode, label: DUE_MODE_LABELS[mode] }));

type FixedExpenseFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  expense?: FixedExpense;
  accountOptions: SelectOption[];
};

export function FixedExpenseForm({ action, expense, accountOptions }: FixedExpenseFormProps) {
  const [dueMode, setDueMode] = useState<DueMode>(expense?.dueDay ? "dueDate" : "onPayday");

  return (
    <ActionForm
      action={action}
      confirmMessage={expense ? "¿Guardar los cambios de este gasto fijo?" : "¿Crear este gasto fijo?"}
    >
      <TextField
        name="name"
        label="Nombre"
        required
        placeholder="Nombre del gasto"
        maxLength={NAME_MAX_LENGTH}
        defaultValue={expense?.name}
      />
      <AllocationFields defaultValue={expense} />
      <SelectField
        name="dueMode"
        label="¿Cuándo se paga?"
        hint={
          dueMode === "onPayday"
            ? "Sin día de vencimiento: se paga cuando recibes tu ingreso."
            : "Tiene un día límite en el mes para liquidarlo."
        }
        required
        options={dueModeOptions}
        value={dueMode}
        onChange={(event) => setDueMode(event.target.value as DueMode)}
      />
      {dueMode === "dueDate" && (
        <IntegerField
          name="dueDay"
          label="Día de vencimiento"
          required
          max={DAY_OF_MONTH_MAX}
          placeholder={`1 a ${DAY_OF_MONTH_MAX}`}
          defaultValue={expense?.dueDay}
        />
      )}
      <SelectField
        name="paymentAccountId"
        label="Se paga con"
        required
        placeholder="Selecciona una cuenta bancaria o efectivo"
        hint="El dinero sale de esta cuenta. Al gastar podrás marcar si usaste una tarjeta ligada."
        options={accountOptions}
        defaultValue={expense?.paymentAccountId ?? ""}
      />
      <CheckboxField name="isActive" label="Activo" defaultChecked={expense?.isActive ?? true} />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
