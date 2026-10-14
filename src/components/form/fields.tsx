"use client";

import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { centsToInput } from "@/lib/money";
import { useFieldError } from "./action-form";

type FieldProps = {
  name: string;
  label: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ name, label, hint, children }: FieldProps) {
  const error = useFieldError(name);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<FieldProps, "children"> & ComponentProps<"input">;

export function TextField({ name, label, hint, ...inputProps }: TextFieldProps) {
  const error = useFieldError(name);

  return (
    <Field name={name} label={label} hint={hint}>
      <Input id={name} name={name} aria-invalid={Boolean(error)} className="h-10" {...inputProps} />
    </Field>
  );
}

type MoneyFieldProps = Omit<TextFieldProps, "defaultValue" | "type"> & {
  defaultCents?: number | null;
};

export function MoneyField({ defaultCents, ...props }: MoneyFieldProps) {
  return (
    <TextField
      inputMode="decimal"
      placeholder="0.00"
      autoComplete="off"
      defaultValue={centsToInput(defaultCents)}
      {...props}
    />
  );
}

export type SelectOption = { value: string; label: string };

type SelectFieldProps = Omit<FieldProps, "children"> &
  Omit<ComponentProps<"select">, "size"> & {
    options: SelectOption[];
    placeholder?: string;
  };

export function SelectField({
  name,
  label,
  hint,
  options,
  placeholder,
  ...selectProps
}: SelectFieldProps) {
  const error = useFieldError(name);

  return (
    <Field name={name} label={label} hint={hint}>
      <NativeSelect
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        className="w-full [&_select]:h-10"
        {...selectProps}
      >
        {placeholder !== undefined && (
          <NativeSelectOption value="">{placeholder}</NativeSelectOption>
        )}
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

type CheckboxFieldProps = { name: string; label: string; defaultChecked?: boolean };

export function CheckboxField({ name, label, defaultChecked }: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}
