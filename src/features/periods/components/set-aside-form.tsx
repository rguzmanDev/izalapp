"use client";

import type { ReactNode } from "react";
import { ActionForm } from "@/components/form/action-form";
import { SelectField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { FormState } from "@/lib/form";
import { formatMoney } from "@/lib/money";

type SetAsideFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  amountCents: number;
  toAccountLabel: string;
  fromAccountOptions: SelectOption[];
  defaultFromAccountId?: string;
  description?: ReactNode;
  confirmMessage?: string;
  submitLabel?: string;
};

export function SetAsideForm({
  action,
  amountCents,
  toAccountLabel,
  fromAccountOptions,
  defaultFromAccountId,
  description,
  confirmMessage,
  submitLabel = "Apartar y transferir",
}: SetAsideFormProps) {
  return (
    <ActionForm
      action={action}
      confirmMessage={
        confirmMessage ?? `¿Apartar ${formatMoney(amountCents)} hacia ${toAccountLabel}?`
      }
    >
      <p className="text-sm text-muted-foreground">
        {description ?? (
          <>
            Se registrará una transferencia de {formatMoney(amountCents)} hacia{" "}
            <span className="font-medium text-foreground">{toAccountLabel}</span> y la partida
            quedará apartada.
          </>
        )}
      </p>
      <SelectField
        name="fromAccountId"
        label="Desde (origen)"
        required
        placeholder="Selecciona la cuenta"
        options={fromAccountOptions}
        defaultValue={defaultFromAccountId ?? ""}
      />
      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
