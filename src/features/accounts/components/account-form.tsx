"use client";

import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import { SelectField, TextField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { FinancialAccount } from "@/db/schema";
import type { FormState } from "@/lib/form";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, type AccountType } from "../constants";

const typeOptions = ACCOUNT_TYPES.map((type) => ({ value: type, label: ACCOUNT_TYPE_LABELS[type] }));

type AccountFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  account?: FinancialAccount;
  paymentAccountOptions: SelectOption[];
};

export function AccountForm({ action, account, paymentAccountOptions }: AccountFormProps) {
  const [type, setType] = useState<AccountType>(account?.type ?? "checking");

  return (
    <ActionForm action={action}>
      <TextField name="name" label="Nombre" placeholder="Nómina" defaultValue={account?.name} />
      <TextField name="bank" label="Banco" placeholder="Banco A" defaultValue={account?.bank ?? ""} />
      <SelectField
        name="type"
        label="Tipo"
        options={typeOptions}
        value={type}
        onChange={(event) => setType(event.target.value as AccountType)}
      />
      {type === "credit" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              name="statementDay"
              label="Día de corte"
              inputMode="numeric"
              defaultValue={account?.statementDay ?? ""}
            />
            <TextField
              name="paymentDueDay"
              label="Día de pago"
              inputMode="numeric"
              defaultValue={account?.paymentDueDay ?? ""}
            />
          </div>
          <SelectField
            name="paymentAccountId"
            label="Se paga desde"
            placeholder="Sin definir"
            options={paymentAccountOptions}
            defaultValue={account?.paymentAccountId ?? ""}
          />
        </>
      )}
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
