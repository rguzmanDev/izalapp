import { z } from "zod";
import {
  emptyToUndefined,
  money,
  optionalDayOfMonth,
  optionalId,
  optionalText,
  requiredText,
} from "@/lib/validation";
import { ACCOUNT_TYPES, MAX_DAYS_AFTER_CUTOFF, PAYMENT_DUE_MODES } from "./constants";

/** Opening cash position; empty means zero. Credit forms send debt as a positive amount. */
const openingBalanceCents = z.preprocess(emptyToUndefined, money.optional()).transform((value) => value ?? 0);

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
    openingBalanceCents,
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
    // Credit form enters initial debt as a positive amount; store as negative cash position.
    const withDebt = {
      ...account,
      openingBalanceCents: account.openingBalanceCents > 0 ? -account.openingBalanceCents : 0,
    };
    return paymentDueMode === "daysAfterCutoff"
      ? { ...withDebt, paymentDueDay: null }
      : { ...withDebt, paymentDueDaysAfterCutoff: null };
  });

export type AccountInput = z.output<typeof accountSchema>;
