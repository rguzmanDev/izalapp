"use client";

import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import {
  CheckboxField,
  MoneyField,
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { ItemOption } from "@/features/transactions/components/transaction-form";
import type { FormState } from "@/lib/form";
import { formatMoney } from "@/lib/money";
import type { FuelLogRow } from "../data";
import { formatMiles } from "../format";

type FuelFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  row?: FuelLogRow;
  defaultItemId?: string;
  defaultDate: string;
  lastOdometer: number | null;
  itemOptions: ItemOption[];
  accountOptions: SelectOption[];
};

/** Estimated total for the hint; the server computes the real one when the field is left empty. */
function estimateCents(gallons: string, price: string): number | null {
  const total = Number(gallons) * Number(price);
  return Number.isFinite(total) && total > 0 ? Math.round(total * 100) : null;
}

export function FuelForm({
  action,
  row,
  defaultItemId,
  defaultDate,
  lastOdometer,
  itemOptions,
  accountOptions,
}: FuelFormProps) {
  const accountOfItem = (itemId: string) =>
    itemOptions.find((option) => option.value === itemId)?.accountId;

  const initialItemId = row?.transaction.itemId ?? defaultItemId ?? "";
  const [itemId, setItemId] = useState(initialItemId);
  const [accountId, setAccountId] = useState(
    row?.transaction.accountId ?? accountOfItem(initialItemId) ?? "",
  );
  const [gallons, setGallons] = useState(row ? String(row.log.gallons) : "");
  const [price, setPrice] = useState(row ? String(row.log.pricePerGallon) : "");
  const estimate = estimateCents(gallons, price);

  function handleItemChange(nextItemId: string) {
    setItemId(nextItemId);
    const itemAccountId = accountOfItem(nextItemId);
    if (itemAccountId) setAccountId(itemAccountId);
  }

  return (
    <ActionForm action={action}>
      <TextField
        name="occurredOn"
        label="Fecha"
        type="date"
        hint="Cámbiala si registras una carga de otro día."
        defaultValue={row?.transaction.occurredOn ?? defaultDate}
      />
      <TextField
        name="odometer"
        label="Odómetro (millas)"
        inputMode="numeric"
        autoComplete="off"
        placeholder={lastOdometer ? `Último: ${formatMiles(lastOdometer)}` : undefined}
        defaultValue={row?.log.odometer}
        autoFocus={!row}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          name="gallons"
          label="Galones"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.000"
          value={gallons}
          onChange={(event) => setGallons(event.target.value)}
        />
        <TextField
          name="pricePerGallon"
          label="Precio por galón"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.000"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </div>
      <MoneyField
        name="amountCents"
        label="Total pagado"
        hint={
          estimate
            ? `Si lo dejas vacío se guarda ${formatMoney(estimate)} (galones × precio).`
            : "Déjalo vacío para usar galones × precio."
        }
        defaultCents={row?.transaction.amountCents}
      />
      <TextField
        name="station"
        label="Gasolinera"
        placeholder="Opcional"
        defaultValue={row?.log.station ?? ""}
      />
      <CheckboxField
        name="isFullTank"
        label="Llené el tanque"
        defaultChecked={row?.log.isFullTank ?? true}
      />
      <SelectField
        name="itemId"
        label="Presupuesto"
        placeholder="Sin presupuesto"
        options={itemOptions}
        value={itemId}
        onChange={(event) => handleItemChange(event.target.value)}
      />
      <SelectField
        name="accountId"
        label="Cuenta"
        placeholder="Selecciona una cuenta"
        options={accountOptions}
        value={accountId}
        onChange={(event) => setAccountId(event.target.value)}
      />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
