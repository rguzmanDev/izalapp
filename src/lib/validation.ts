import { z } from "zod";
import { SPLITS, type Allocation } from "./allocation";
import { parseMoney } from "./money";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const requiredText = z.string().trim().min(1, "Requerido").max(100, "Máximo 100 caracteres");

export const optionalText = z
  .string()
  .trim()
  .max(100, "Máximo 100 caracteres")
  .optional()
  .transform((value) => value || null);

export const money = z.string().transform((value, ctx) => {
  const cents = parseMoney(value);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: "Monto inválido" });
    return z.NEVER;
  }
  return cents;
});

export const positiveMoney = money.refine((cents) => cents > 0, "Debe ser mayor a 0");

export const optionalMoney = z.preprocess(emptyToUndefined, money.optional()).transform(
  (value) => value ?? null,
);

/** Positive number with up to `maxDecimals` decimals, such as gallons or a price per gallon. */
export function positiveDecimal(maxDecimals: number) {
  const pattern = new RegExp(`^\\d+(\\.\\d{1,${maxDecimals}})?$`);
  return z.string().transform((value, ctx) => {
    const normalized = value.replace(/[$,\s]/g, "");
    if (!pattern.test(normalized) || Number(normalized) <= 0) {
      ctx.addIssue({ code: "custom", message: "Número inválido" });
      return z.NEVER;
    }
    return Number(normalized);
  });
}

export const positiveInteger = z.string().transform((value, ctx) => {
  const normalized = value.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(normalized) || Number(normalized) <= 0) {
    ctx.addIssue({ code: "custom", message: "Debe ser un número entero mayor a 0" });
    return z.NEVER;
  }
  return Number(normalized);
});

export const optionalDayOfMonth = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .int("Día inválido")
    .min(1, "Día entre 1 y 31")
    .max(31, "Día entre 1 y 31")
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
  monthlyAmountCents: money,
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
          message: "Indica cuánto va en la 1ª quincena",
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
