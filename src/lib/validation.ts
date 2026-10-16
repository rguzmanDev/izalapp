import { z } from "zod";
import { SPLITS, type Allocation } from "./allocation";
import { DAY_OF_MONTH_MAX, MONEY_MAX_DIGITS, NAME_MAX_LENGTH, NOTE_MAX_LENGTH } from "./limits";
import { parseMoney } from "./money";

export const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

/** Emojis and invisible control characters have no place in names or notes. */
const hasForbiddenCharacters = (value: string) => /[\p{Extended_Pictographic}\p{Cc}]/u.test(value);
const forbiddenCharactersMessage = "No se permiten emojis ni caracteres especiales";

export const requiredText = z
  .string()
  .trim()
  .min(1, "Requerido")
  .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres`)
  .refine((value) => !hasForbiddenCharacters(value), forbiddenCharactersMessage);

export const optionalText = z
  .string()
  .trim()
  .max(NOTE_MAX_LENGTH, `Máximo ${NOTE_MAX_LENGTH} caracteres`)
  .refine((value) => !hasForbiddenCharacters(value), forbiddenCharactersMessage)
  .optional()
  .transform((value) => value || null);

const MAX_CENTS = 10 ** MONEY_MAX_DIGITS - 1;

export const money = z.string().transform((value, ctx) => {
  const cents = parseMoney(value);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: "Monto inválido" });
    return z.NEVER;
  }
  if (cents > MAX_CENTS) {
    ctx.addIssue({ code: "custom", message: "Monto demasiado alto" });
    return z.NEVER;
  }
  return cents;
});

export const positiveMoney = money.refine((cents) => cents > 0, "Debe ser mayor a 0");

export const optionalMoney = z.preprocess(emptyToUndefined, money.optional()).transform(
  (value) => value ?? null,
);

/**
 * Positive number with up to `decimals` decimals and `maxDigits` digits in total,
 * such as gallons or a price per gallon. Integers are the `decimals = 0` case.
 */
export function positiveNumber(decimals: number, maxDigits: number) {
  const pattern = decimals > 0 ? new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`) : /^\d+$/;
  const max = (10 ** maxDigits - 1) / 10 ** decimals;
  return z.string().transform((value, ctx) => {
    const normalized = value.replace(/[$,\s]/g, "");
    if (!pattern.test(normalized)) {
      ctx.addIssue({ code: "custom", message: "Número inválido" });
      return z.NEVER;
    }
    const number = Number(normalized);
    if (number <= 0) {
      ctx.addIssue({ code: "custom", message: "Debe ser mayor a 0" });
      return z.NEVER;
    }
    if (number > max) {
      ctx.addIssue({ code: "custom", message: "Valor demasiado alto" });
      return z.NEVER;
    }
    return number;
  });
}

export const optionalDayOfMonth = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .int("Día inválido")
    .min(1, `Día entre 1 y ${DAY_OF_MONTH_MAX}`)
    .max(DAY_OF_MONTH_MAX, `Día entre 1 y ${DAY_OF_MONTH_MAX}`)
    .optional()
    .transform((value) => value ?? null),
);

export const requiredId = z.uuid("Selecciona una opción");

export function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}

export const optionalId = z.preprocess(emptyToUndefined, requiredId.optional()).transform(
  (value) => value ?? null,
);

export const checkbox = z
  .string()
  .optional()
  .transform((value) => value === "on");

export const allocationShape = {
  monthlyAmountCents: positiveMoney,
  split: z.enum(SPLITS, "Selecciona una opción"),
  customFirstHalfCents: optionalMoney,
};

/** Validates the custom split and clears it when another split is selected. */
export function withAllocationRules<T extends z.ZodType<Allocation>>(schema: T) {
  return schema
    .superRefine((value, ctx) => {
      if (value.split !== "custom") return;
      if (value.customFirstHalfCents === null) {
        ctx.addIssue({
          code: "custom",
          path: ["customFirstHalfCents"],
          message: "Indica cuánto va en el pago del 15",
        });
      } else if (value.customFirstHalfCents > value.monthlyAmountCents) {
        ctx.addIssue({
          code: "custom",
          path: ["customFirstHalfCents"],
          message: "No puede ser mayor al monto mensual",
        });
      }
    })
    .transform((value) => ({
      ...value,
      customFirstHalfCents: value.split === "custom" ? value.customFirstHalfCents : null,
    }));
}
