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
  const lockedAccountId = itemId ? accountOfItem(itemId) : undefined;
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? lockedAccountId ?? "",
  );

  function handleItemChange(nextItemId: string) {
    setItemId(nextItemId);
    const itemAccountId = accountOfItem(nextItemId);
    if (itemAccountId) setAccountId(itemAccountId);
    else if (!nextItemId) setAccountId("");
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
            . Los gastos de un presupuesto o gasto fijo siempre usan su cuenta (en tarjeta, la deuda
            de la tarjeta; el banco solo se mueve al pagar o fondear).
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
          onChange={(event) => setAccountId(event.target.value)}
        />
      )}
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
