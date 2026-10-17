"use client";

import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import { SelectField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { FormState } from "@/lib/form";
import { formatMoney } from "@/lib/money";

type MarkPaidFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  amountCents: number;
  accountLabel: string;
  cardOptions: SelectOption[];
};

export function MarkPaidForm({
  action,
  amountCents,
  accountLabel,
  cardOptions,
}: MarkPaidFormProps) {
  const [creditCardId, setCreditCardId] = useState("");

  return (
    <ActionForm
      action={action}
      confirmMessage={`¿Marcar como pagado ${formatMoney(amountCents)} desde ${accountLabel}?`}
    >
      <p className="text-sm text-muted-foreground">
        Se registra el gasto de {formatMoney(amountCents)} en{" "}
        <span className="font-medium text-foreground">{accountLabel}</span>.
        {cardOptions.length > 0
          ? " Si pagaste con tarjeta, elige cuál: baja la cuenta y suma al «por pagar»."
          : null}
      </p>
      {cardOptions.length > 0 && (
        <SelectField
          name="creditCardId"
          label="¿Cómo pagaste?"
          placeholder="Directo a la cuenta"
          options={cardOptions}
          value={creditCardId}
          onChange={(event) => setCreditCardId(event.target.value)}
          hint="Directo = solo baja la cuenta. Tarjeta = baja la cuenta y suma al «por pagar»."
        />
      )}
      <SubmitButton>Marcar pagado</SubmitButton>
    </ActionForm>
  );
}
