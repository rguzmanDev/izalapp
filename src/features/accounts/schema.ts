import { z } from "zod";
import {
  emptyToUndefined,
  optionalDayOfMonth,
  optionalId,
  optionalText,
  requiredText,
} from "@/lib/validation";
import { ACCOUNT_TYPES, MAX_DAYS_AFTER_CUTOFF, PAYMENT_DUE_MODES } from "./constants";

const lastFour = z
  .string()
  .trim()
  .regex(/^(\d{4})?$/, "Escribe los 4 dígitos")
  .optional()
  .transform((value) => value || null);

const daysAfterCutoff = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .int("Número inválido")
    .min(1, `Entre 1 y ${MAX_DAYS_AFTER_CUTOFF} días`)
    .max(MAX_DAYS_AFTER_CUTOFF, `Entre 1 y ${MAX_DAYS_AFTER_CUTOFF} días`)
    .optional()
    .transform((value) => value ?? null),
);

export const accountSchema = z
  .object({
    name: requiredText,
    bank: optionalText,
    lastFour,
    type: z.enum(ACCOUNT_TYPES, "Selecciona un tipo"),
    statementDay: optionalDayOfMonth,
    paymentDueMode: z.enum(PAYMENT_DUE_MODES).optional(),
    paymentDueDay: optionalDayOfMonth,
    paymentDueDaysAfterCutoff: daysAfterCutoff,
    paymentAccountId: optionalId,
  })
  .superRefine((account, ctx) => {
    if (account.type !== "credit") return;
    if (account.statementDay === null) {
      ctx.addIssue({ code: "custom", path: ["statementDay"], message: "Requerido para tarjetas" });
    }
    if (account.paymentDueMode === "daysAfterCutoff") {
      if (account.paymentDueDaysAfterCutoff === null) {
        ctx.addIssue({
          code: "custom",
          path: ["paymentDueDaysAfterCutoff"],
          message: "Requerido para tarjetas",
        });
      }
    } else if (account.paymentDueDay === null) {
      ctx.addIssue({ code: "custom", path: ["paymentDueDay"], message: "Requerido para tarjetas" });
    }
  })
  .transform(({ paymentDueMode, ...account }) => {
    if (account.type !== "credit") {
      return {
        ...account,
        statementDay: null,
        paymentDueDay: null,
        paymentDueDaysAfterCutoff: null,
        paymentAccountId: null,
      };
    }
    return paymentDueMode === "daysAfterCutoff"
      ? { ...account, paymentDueDay: null }
      : { ...account, paymentDueDaysAfterCutoff: null };
  });

export type AccountInput = z.output<typeof accountSchema>;
