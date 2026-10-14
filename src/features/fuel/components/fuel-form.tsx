"use client";

import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import {
  CheckboxField,
  MoneyField,
  NumberField,
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { ItemOption } from "@/features/transactions/components/transaction-form";
import type { FormState } from "@/lib/form";
import {
  GALLONS_MAX_DIGITS,
  NOTE_MAX_LENGTH,
  ODOMETER_MAX_DIGITS,
  PRICE_PER_GALLON_MAX_DIGITS,
} from "@/lib/limits";
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

/** Gallons and price per gallon are edited as thousandths. */
const THOUSANDTHS = 1000;

/** Estimated total for the hint; the server computes the real one when the field is left empty. */
function estimateCents(gallonsUnits: number, priceUnits: number): number | null {
  const total = Math.round((gallonsUnits * priceUnits * 100) / THOUSANDTHS ** 2);
  return total > 0 ? total : null;
}

const toThousandths = (value: number | undefined) =>
  value === undefined ? undefined : Math.round(value * THOUSANDTHS);

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
  const initialGallons = toThousandths(row?.log.gallons);
  const initialPrice = toThousandths(row?.log.pricePerGallon);
  const [gallons, setGallons] = useState(initialGallons ?? 0);
  const [price, setPrice] = useState(initialPrice ?? 0);
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
        required
        hint="Cámbiala si registras una carga de otro día."
        defaultValue={row?.transaction.occurredOn ?? defaultDate}
      />
      <NumberField
        name="odometer"
        label="Odómetro (millas)"
        required
        decimals={0}
        maxDigits={ODOMETER_MAX_DIGITS}
        placeholder={lastOdometer ? `Último: ${formatMiles(lastOdometer)}` : "0"}
        defaultUnits={row?.log.odometer}
        autoFocus={!row}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          name="gallons"
          label="Galones"
          required
          decimals={3}
          maxDigits={GALLONS_MAX_DIGITS}
          defaultUnits={initialGallons}
          onUnitsChange={setGallons}
        />
        <NumberField
          name="pricePerGallon"
          label="Precio por galón"
          required
          decimals={3}
          maxDigits={PRICE_PER_GALLON_MAX_DIGITS}
          prefix="$"
          defaultUnits={initialPrice}
          onUnitsChange={setPrice}
        />
      </div>
      <MoneyField
        name="amountCents"
        label="Total pagado"
        optional
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
        maxLength={NOTE_MAX_LENGTH}
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
        required
        placeholder="Selecciona una cuenta"
        options={accountOptions}
        value={accountId}
        onChange={(event) => setAccountId(event.target.value)}
      />
      <SubmitButton>Guardar</SubmitButton>
    </ActionForm>
  );
}
