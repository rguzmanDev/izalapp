import { z } from "zod";
import {
  allocationShape,
  checkbox,
  optionalDayOfMonth,
  requiredId,
  requiredText,
  withAllocationRules,
} from "@/lib/validation";
import { DUE_MODES } from "./constants";

export const fixedExpenseSchema = withAllocationRules(
  z.object({
    name: requiredText,
    ...allocationShape,
    dueMode: z.enum(DUE_MODES).optional(),
    dueDay: optionalDayOfMonth,
    paymentAccountId: requiredId,
    isActive: checkbox,
  }),
)
  .superRefine((expense, ctx) => {
    if (expense.dueMode === "dueDate" && expense.dueDay === null) {
      ctx.addIssue({ code: "custom", path: ["dueDay"], message: "Indica el día en que vence" });
    }
  })
  .transform(({ dueMode, ...expense }) => ({
    ...expense,
    dueDay: dueMode === "onPayday" ? null : expense.dueDay,
  }));

export type FixedExpenseInput = z.output<typeof fixedExpenseSchema>;
