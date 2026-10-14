"use client";

import { useState } from "react";
import { SPLIT_LABELS, SPLITS, type Allocation, type Split } from "@/lib/allocation";
import { MoneyField, SelectField } from "./fields";

const splitOptions = SPLITS.map((split) => ({ value: split, label: SPLIT_LABELS[split] }));

export function AllocationFields({ defaultValue }: { defaultValue?: Allocation }) {
  const [split, setSplit] = useState<Split>(defaultValue?.split ?? "even");

  return (
    <>
      <MoneyField
        name="monthlyAmountCents"
        label="Monto mensual"
        defaultCents={defaultValue?.monthlyAmountCents}
      />
      <SelectField
        name="split"
        label="Reparto por quincena"
        options={splitOptions}
        value={split}
        onChange={(event) => setSplit(event.target.value as Split)}
      />
      {split === "custom" && (
        <MoneyField
          name="customFirstHalfCents"
          label="Monto en la 1ª quincena"
          hint="El resto se asigna a la 2ª quincena"
          defaultCents={defaultValue?.customFirstHalfCents}
        />
      )}
    </>
  );
}
