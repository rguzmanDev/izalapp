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
};

export function TransactionForm({
  action,
  transaction,
  defaultItemId,
  defaultDate,
  itemOptions,
  accountOptions,
}: TransactionFormProps) {
  const accountOfItem = (itemId: string) =>
    itemOptions.find((option) => option.value === itemId)?.accountId;

  const initialItemId = transaction?.itemId ?? defaultItemId ?? "";
  const [itemId, setItemId] = useState(initialItemId);
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? accountOfItem(initialItemId) ?? "",
  );

  function handleItemChange(nextItemId: string) {
    setItemId(nextItemId);
    const itemAccountId = accountOfItem(nextItemId);
    if (itemAccountId) setAccountId(itemAccountId);
  }

  return (
    <ActionForm action={action}>
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
      <SelectField
        name="accountId"
        label="Cuenta"
        required
        placeholder="Selecciona una cuenta"
        options={accountOptions}
        value={accountId}
        onChange={(event) => setAccountId(event.target.value)}
      />
      <TextField
        name="occurredOn"
        label="Fecha"
        type="date"
        required
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
