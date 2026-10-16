"use client";

import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import {
  IntegerField,
  MoneyField,
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { FinancialAccount } from "@/db/schema";
import type { FormState } from "@/lib/form";
import { DAY_OF_MONTH_MAX, NAME_MAX_LENGTH } from "@/lib/limits";
import {
  ACCOUNT_NAME_PREFIXES,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  MAX_DAYS_AFTER_CUTOFF,
  PAYMENT_DUE_MODE_LABELS,
  PAYMENT_DUE_MODES,
  type AccountType,
  type PaymentDueMode,
} from "../constants";
import { BankField } from "./bank-field";

const typeOptions = ACCOUNT_TYPES.map((type) => ({ value: type, label: ACCOUNT_TYPE_LABELS[type] }));

const paymentDueModeOptions = PAYMENT_DUE_MODES.map((mode) => ({
  value: mode,
  label: PAYMENT_DUE_MODE_LABELS[mode],
}));

type AccountFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  account?: FinancialAccount;
  paymentAccountOptions: SelectOption[];
};

export function AccountForm({ action, account, paymentAccountOptions }: AccountFormProps) {
  const [type, setType] = useState<AccountType>(account?.type ?? "checking");
  const [lastFour, setLastFour] = useState(account?.lastFour ?? "");
  const [paymentDueMode, setPaymentDueMode] = useState<PaymentDueMode>(
    account?.paymentDueDaysAfterCutoff != null ? "daysAfterCutoff" : "dayOfMonth",
  );

  return (
    <ActionForm
      action={action}
      confirmMessage={account ? "¿Guardar los cambios de esta cuenta?" : "¿Crear esta cuenta?"}
    >
      <SelectField
        name="type"
        label="Tipo"
        required
        options={typeOptions}
        value={type}
        onChange={(event) => setType(event.target.value as AccountType)}
      />
      <TextField
        name="name"
        label="Nombre"
        hint="Solo un apodo para reconocerla; el tipo ya va incluido."
        required
        startText={ACCOUNT_NAME_PREFIXES[type]}
        placeholder="Apodo de la cuenta"
        maxLength={NAME_MAX_LENGTH}
        defaultValue={account?.name}
      />
      <BankField defaultValue={account?.bank ?? null} />
      <TextField
        name="lastFour"
        label="Últimos 4 dígitos"
        hint="Sirven para distinguir cuentas o tarjetas parecidas."
        placeholder="1234"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={lastFour}
        onChange={(event) => setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))}
      />
      {type === "credit" && (
        <>
          <IntegerField
            name="statementDay"
            label="Día de corte"
            required
            max={DAY_OF_MONTH_MAX}
            placeholder={`1 a ${DAY_OF_MONTH_MAX}`}
            defaultValue={account?.statementDay}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="paymentDueMode"
              label="Fecha límite de pago"
              required
              options={paymentDueModeOptions}
              value={paymentDueMode}
              onChange={(event) => setPaymentDueMode(event.target.value as PaymentDueMode)}
            />
            {paymentDueMode === "dayOfMonth" ? (
              <IntegerField
                key="paymentDueDay"
                name="paymentDueDay"
                label="Día de pago"
                required
                max={DAY_OF_MONTH_MAX}
                placeholder={`1 a ${DAY_OF_MONTH_MAX}`}
                defaultValue={account?.paymentDueDay}
              />
            ) : (
              <IntegerField
                key="paymentDueDaysAfterCutoff"
                name="paymentDueDaysAfterCutoff"
                label="Días después del corte"
                required
                max={MAX_DAYS_AFTER_CUTOFF}
                placeholder={`1 a ${MAX_DAYS_AFTER_CUTOFF}`}
                defaultValue={account?.paymentDueDaysAfterCutoff}
              />
            )}
          </div>
          <SelectField
            name="paymentAccountId"
            label="Se paga desde"
            placeholder="Sin definir"
            options={paymentAccountOptions}
            defaultValue={account?.paymentAccountId ?? ""}
          />
          <MoneyField
            name="openingBalanceCents"
            label="Deuda inicial"
            hint="Lo que ya debías al empezar a usar IzalApp. Déjalo en 0 si partes de cero."
            defaultCents={
              account && account.openingBalanceCents < 0 ? -account.openingBalanceCents : 0
            }
          />
        </>
      )}
      {type !== "credit" && (
        <MoneyField
          name="openingBalanceCents"
          label="Saldo inicial"
          hint="Dinero que ya tenía esta cuenta al empezar. Puedes usar una cuenta «Efectivo»."
          defaultCents={account?.type !== "credit" ? (account?.openingBalanceCents ?? 0) : 0}
        />
      )}
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
