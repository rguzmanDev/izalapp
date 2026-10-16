"use client";

import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import { MoneyField, SelectField, TextField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { Transaction } from "@/db/schema";
import type { FormState } from "@/lib/form";
import { NOTE_MAX_LENGTH } from "@/lib/limits";

export type ItemOption = SelectOption & { accountId: string };

type TransactionFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  transaction?: Transaction;
  defaultItemId?: string;
  defaultDate: string;
  itemOptions: ItemOption[];
  accountOptions: SelectOption[];
  /** All credit cards; filtered client-side by the funding account. */
  cardOptionsByAccount: Record<string, SelectOption[]>;
};

export function TransactionForm({
  action,
  transaction,
  defaultItemId,
  defaultDate,
  itemOptions,
  accountOptions,
  cardOptionsByAccount,
}: TransactionFormProps) {
  const accountOfItem = (itemId: string) =>
    itemOptions.find((option) => option.value === itemId)?.accountId;

  const initialItemId = transaction?.itemId ?? defaultItemId ?? "";
  const [itemId, setItemId] = useState(initialItemId);
  const lockedAccountId = itemId ? accountOfItem(itemId) : undefined;
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? lockedAccountId ?? "",
  );
  const fundingAccountId = lockedAccountId ?? accountId;
  const cardOptions = fundingAccountId ? (cardOptionsByAccount[fundingAccountId] ?? []) : [];
  const [creditCardId, setCreditCardId] = useState(transaction?.creditCardId ?? "");

  function handleItemChange(nextItemId: string) {
    setItemId(nextItemId);
    const itemAccountId = accountOfItem(nextItemId);
    if (itemAccountId) {
      setAccountId(itemAccountId);
      setCreditCardId("");
    } else if (!nextItemId) {
      setAccountId("");
      setCreditCardId("");
    }
  }

  function handleAccountChange(nextAccountId: string) {
    setAccountId(nextAccountId);
    setCreditCardId("");
  }

  return (
    <ActionForm
      action={action}
      confirmMessage={transaction ? "¿Guardar los cambios de este gasto?" : "¿Registrar este gasto?"}
    >
      <MoneyField
        name="amountCents"
        label="Monto"
        required
        defaultCents={transaction?.amountCents}
        autoFocus={!transaction}
      />
      <SelectField
        name="itemId"
        label="Presupuesto o gasto fijo"
        placeholder="Sin presupuesto"
        options={itemOptions}
        value={itemId}
        onChange={(event) => handleItemChange(event.target.value)}
      />
      {lockedAccountId ? (
        <>
          <input type="hidden" name="accountId" value={lockedAccountId} />
          <p className="text-sm text-muted-foreground">
            Cuenta:{" "}
            <span className="font-medium text-foreground">
              {accountOptions.find((option) => option.value === lockedAccountId)?.label ??
                "Cuenta de la partida"}
            </span>
            . Compra con tarjeta → baja esta cuenta y sube el «por pagar»; Pagar tarjeta → solo marca
            liquidación.
          </p>
        </>
      ) : (
        <SelectField
          name="accountId"
          label="Cuenta"
          required
          placeholder="Selecciona una cuenta"
          options={accountOptions}
          value={accountId}
          onChange={(event) => handleAccountChange(event.target.value)}
          hint="Sin presupuesto = «otros gastos». Elige la cuenta de donde salió el dinero."
        />
      )}
      {cardOptions.length > 0 && (
        <SelectField
          name="creditCardId"
          label="¿Cómo pagaste?"
          placeholder="Directo a la cuenta"
          options={cardOptions}
          value={creditCardId}
          onChange={(event) => setCreditCardId(event.target.value)}
          hint="Directo = solo baja la cuenta. Tarjeta = baja la cuenta y suma al «por pagar» (informativo)."
        />
      )}
      <TextField
        name="occurredOn"
        label="Fecha"
        type="date"
        required
        hint="La fecha es cuándo moviste el dinero. El gasto va al corte que tengas abierto."
        defaultValue={transaction?.occurredOn ?? defaultDate}
      />
      <TextField
        name="note"
        label="Nota"
        maxLength={NOTE_MAX_LENGTH}
        defaultValue={transaction?.note ?? ""}
      />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
