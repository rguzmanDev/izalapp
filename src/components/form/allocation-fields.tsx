"use client";

import { useState } from "react";
import { SPLIT_LABELS, SPLITS, type Allocation, type Split } from "@/lib/allocation";
import { MoneyField, SelectField } from "./fields";

const splitOptions = SPLITS.map((split) => ({ value: split, label: SPLIT_LABELS[split] }));

export function AllocationFields({
  defaultValue,
  lockSplit = false,
}: {
  defaultValue?: Allocation;
  /** When true, only the monthly amount stays editable. */
  lockSplit?: boolean;
}) {
  const [split, setSplit] = useState<Split>(defaultValue?.split ?? "even");

  return (
    <>
      <MoneyField
        name="monthlyAmountCents"
        label="Monto mensual"
        required
        defaultCents={defaultValue?.monthlyAmountCents}
      />
      <SelectField
        name="split"
        label="Reparto por pago"
        required
        options={splitOptions}
        value={split}
        onChange={(event) => setSplit(event.target.value as Split)}
        locked={lockSplit}
        hint={
          lockSplit
            ? "Ya se usó en una quincena; no se puede cambiar el reparto."
            : undefined
        }
      />
      {split === "custom" && (
        <MoneyField
          name="customFirstHalfCents"
          label="Monto en el pago del 15"
          hint={
            lockSplit
              ? "Ya se usó en una quincena; no se puede cambiar el reparto."
              : "El resto se asigna al pago del 30"
          }
          required
          locked={lockSplit}
          defaultCents={defaultValue?.customFirstHalfCents}
        />
      )}
    </>
  );
}
