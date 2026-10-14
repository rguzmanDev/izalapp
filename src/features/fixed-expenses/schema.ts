import { z } from "zod";
import {
  allocationShape,
  checkbox,
  optionalDayOfMonth,
  requiredId,
  requiredText,
  withAllocationRules,
} from "@/lib/validation";

export const fixedExpenseSchema = withAllocationRules(
  z.object({
    name: requiredText,
    ...allocationShape,
    dueDay: optionalDayOfMonth,
    paymentAccountId: requiredId,
    isActive: checkbox,
  }),
);

export type FixedExpenseInput = z.output<typeof fixedExpenseSchema>;
