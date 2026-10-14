import { z } from "zod";
import {
  money,
  optionalId,
  optionalMoney,
  positiveMoney,
  requiredId,
  requiredText,
} from "@/lib/validation";

export const periodItemSchema = z.object({
  plannedCents: money,
});

export const extraIncomeSchema = z.object({
  name: requiredText,
  plannedCents: positiveMoney,
  accountId: requiredId,
});

export type ExtraIncomeInput = z.infer<typeof extraIncomeSchema>;

/** Moving the surplus is optional: leaving the amount empty just closes the period. */
export const closePeriodSchema = z
  .object({
    surplusCents: optionalMoney,
    fromAccountId: optionalId,
    toAccountId: optionalId,
  })
  .superRefine((value, ctx) => {
    if (!value.surplusCents) return;
    if (!value.fromAccountId) {
      ctx.addIssue({ code: "custom", path: ["fromAccountId"], message: "Selecciona una opción" });
    }
    if (!value.toAccountId) {
      ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Selecciona una opción" });
    } else if (value.toAccountId === value.fromAccountId) {
      ctx.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Debe ser distinta a la de origen",
      });
    }
  });
