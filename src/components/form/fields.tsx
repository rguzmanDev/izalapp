"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { MONEY_MAX_DIGITS } from "@/lib/limits";
import { cn } from "@/lib/utils";
import { useFieldError } from "./action-form";

type FieldProps = {
  name: string;
  label: string;
  hint?: string;
  /** Marks the label with an asterisk; the server is what actually enforces it. */
  required?: boolean;
  children: ReactNode;
};

export function Field({ name, label, hint, required, children }: FieldProps) {
  const error = useFieldError(name);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required && (
          <span className="-ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<FieldProps, "children"> &
  ComponentProps<"input"> & {
    /** Fixed text shown inside the field before the value; it can't be edited and isn't submitted. */
    startText?: string;
  };

export function TextField({ name, label, hint, required, startText, ...inputProps }: TextFieldProps) {
  const error = useFieldError(name);
  const input = (
    <Input
      id={name}
      name={name}
      aria-invalid={Boolean(error)}
      aria-required={required}
      className={cn(
        "h-10",
        startText &&
          "h-full border-0 bg-transparent pl-1.5 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
      )}
      {...inputProps}
    />
  );

  return (
    <Field name={name} label={label} hint={hint} required={required}>
      {startText ? (
        <div className="flex h-10 items-center rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 dark:bg-input/30">
          <span className="shrink-0 pl-2.5 text-base text-muted-foreground md:text-sm">
            {startText}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
    </Field>
  );
}

type IntegerFieldProps = Omit<FieldProps, "children"> & {
  max: number;
  defaultValue?: number | null;
  placeholder?: string;
};

/** Whole number typed directly; non-digits and values above `max` are ignored as the user types. */
export function IntegerField({
  name,
  label,
  hint,
  required,
  max,
  defaultValue,
  placeholder,
}: IntegerFieldProps) {
  const error = useFieldError(name);
  const [value, setValue] = useState(defaultValue == null ? "" : String(defaultValue));

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").replace(/^0+/, "");
    if (Number(digits) <= max) setValue(digits);
  }

  return (
    <Field name={name} label={label} hint={hint} required={required}>
      <Input
        id={name}
        name={name}
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-required={required}
        className="h-10 tabular-nums"
        maxLength={String(max).length}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
    </Field>
  );
}

type NumberFieldProps = Omit<FieldProps, "children"> & {
  decimals: number;
  maxDigits: number;
  prefix?: string;
  /** Initial value as an integer scaled by 10^decimals (cents when decimals is 2). */
  defaultUnits?: number | null;
  /** Submits an empty value instead of zero, for fields where "empty" has a meaning. */
  optional?: boolean;
  /** Shows the value but keeps it fixed (still submitted via the hidden input). */
  locked?: boolean;
  onUnitsChange?: (units: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * Cash-register style input: only digits are accepted and they fill the number from
 * right to left (typing 1, 3, 0, 0 shows 13.00), so the user never types the decimal point.
 * The visible text is formatted; a hidden input submits the plain number under `name`.
 */
export function NumberField({
  name,
  label,
  hint,
  required,
  decimals,
  maxDigits,
  prefix = "",
  defaultUnits,
  optional = false,
  locked = false,
  onUnitsChange,
  placeholder,
  autoFocus,
}: NumberFieldProps) {
  const error = useFieldError(name);
  const [units, setUnits] = useState(defaultUnits ?? 0);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals],
  );
  const scale = 10 ** decimals;
  const format = (value: number) => prefix + formatter.format(value / scale);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (locked) return;
    const digits = event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, maxDigits);
    const next = Number(digits || "0");
    setUnits(next);
    onUnitsChange?.(next);
  }

  function moveCaretToEnd(event: SyntheticEvent<HTMLInputElement>) {
    if (locked) return;
    const input = event.currentTarget;
    requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
  }

  return (
    <Field name={name} label={label} hint={hint} required={required}>
      <Input
        id={name}
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-required={required}
        readOnly={locked}
        className={cn("h-10 tabular-nums", locked && "bg-muted text-muted-foreground")}
        placeholder={placeholder ?? format(0)}
        value={units === 0 ? "" : format(units)}
        onChange={handleChange}
        onFocus={moveCaretToEnd}
        onClick={moveCaretToEnd}
        autoFocus={autoFocus && !locked}
      />
      <input
        type="hidden"
        name={name}
        value={optional && units === 0 ? "" : (units / scale).toFixed(decimals)}
      />
    </Field>
  );
}

type MoneyFieldProps = Omit<
  NumberFieldProps,
  "decimals" | "maxDigits" | "prefix" | "defaultUnits" | "onUnitsChange"
> & {
  defaultCents?: number | null;
};

export function MoneyField({ defaultCents, ...props }: MoneyFieldProps) {
  return (
    <NumberField
      decimals={2}
      maxDigits={MONEY_MAX_DIGITS}
      prefix="$"
      defaultUnits={defaultCents}
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
  required,
  options,
  placeholder,
  locked = false,
  value,
  defaultValue,
  ...selectProps
}: SelectFieldProps & { locked?: boolean }) {
  const error = useFieldError(name);
  const lockedValue = String(value ?? defaultValue ?? "");

  return (
    <Field name={name} label={label} hint={hint} required={required}>
      {locked ? (
        <>
          <input type="hidden" name={name} value={lockedValue} />
          <NativeSelect
            id={name}
            aria-invalid={Boolean(error)}
            aria-required={required}
            disabled
            className="w-full [&_select]:h-10"
            value={lockedValue}
          >
            {placeholder !== undefined && lockedValue === "" && (
              <NativeSelectOption value="">{placeholder}</NativeSelectOption>
            )}
            {options.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </>
      ) : (
        <NativeSelect
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-required={required}
          className="w-full [&_select]:h-10"
          value={value}
          defaultValue={defaultValue}
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
      )}
    </Field>
  );
}

type CheckboxFieldProps = {
  name: string;
  label: string;
  defaultChecked?: boolean;
  /** Keeps the value fixed but still submits it. */
  locked?: boolean;
  hint?: string;
};

export function CheckboxField({
  name,
  label,
  defaultChecked,
  locked = false,
  hint,
}: CheckboxFieldProps) {
  const checked = Boolean(defaultChecked);
  return (
    <div className="flex flex-col gap-1">
      <label
        className={cn(
          "flex items-center gap-2 text-sm font-medium",
          locked && "text-muted-foreground",
        )}
      >
        {locked && checked ? <input type="hidden" name={name} value="on" /> : null}
        <input
          type="checkbox"
          name={locked ? undefined : name}
          defaultChecked={checked}
          checked={locked ? checked : undefined}
          disabled={locked}
          className="size-4 accent-primary"
        />
        {label}
      </label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
