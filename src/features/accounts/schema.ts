import { z } from "zod";
import { optionalDayOfMonth, optionalId, optionalText, requiredText } from "@/lib/validation";
import { ACCOUNT_TYPES } from "./constants";

export const accountSchema = z
  .object({
    name: requiredText,
    bank: optionalText,
    type: z.enum(ACCOUNT_TYPES, "Selecciona un tipo"),
    statementDay: optionalDayOfMonth,
    paymentDueDay: optionalDayOfMonth,
    paymentAccountId: optionalId,
  })
  .superRefine((account, ctx) => {
    if (account.type !== "credit") return;
    if (account.statementDay === null) {
      ctx.addIssue({ code: "custom", path: ["statementDay"], message: "Requerido para tarjetas" });
    }
    if (account.paymentDueDay === null) {
      ctx.addIssue({ code: "custom", path: ["paymentDueDay"], message: "Requerido para tarjetas" });
    }
  })
  .transform((account) =>
    account.type === "credit"
      ? account
      : { ...account, statementDay: null, paymentDueDay: null, paymentAccountId: null },
  );

export type AccountInput = z.output<typeof accountSchema>;
