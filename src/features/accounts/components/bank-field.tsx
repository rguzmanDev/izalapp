"use client";

import { useState } from "react";
import { useFieldError } from "@/components/form/action-form";
import { Field } from "@/components/form/fields";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { NOTE_MAX_LENGTH } from "@/lib/limits";
import { BANK_GROUPS, isListedBank } from "../banks";

const OTHER = "__other__";

/** Bank picker from the list of Salvadoran banks; "Otro" lets the user type any name. */
export function BankField({ defaultValue }: { defaultValue: string | null }) {
  const error = useFieldError("bank");
  const isOther = defaultValue !== null && !isListedBank(defaultValue);
  const [choice, setChoice] = useState(isOther ? OTHER : (defaultValue ?? ""));

  return (
    <Field name="bank" label="Banco">
      <NativeSelect
        id="bank"
        name={choice === OTHER ? undefined : "bank"}
        aria-invalid={Boolean(error)}
        className="w-full [&_select]:h-10"
        value={choice}
        onChange={(event) => setChoice(event.target.value)}
      >
        <NativeSelectOption value="">Sin banco</NativeSelectOption>
        {BANK_GROUPS.map((group) => (
          <NativeSelectOptGroup key={group.label} label={group.label}>
            {group.banks.map((bank) => (
              <NativeSelectOption key={bank} value={bank}>
                {bank}
              </NativeSelectOption>
            ))}
          </NativeSelectOptGroup>
        ))}
        <NativeSelectOption value={OTHER}>Otro…</NativeSelectOption>
      </NativeSelect>
      {choice === OTHER && (
        <Input
          name="bank"
          aria-label="Nombre del banco"
          placeholder="Nombre del banco"
          aria-invalid={Boolean(error)}
          className="h-10"
          maxLength={NOTE_MAX_LENGTH}
          defaultValue={isOther ? defaultValue : ""}
          autoFocus={!isOther}
        />
      )}
    </Field>
  );
}
