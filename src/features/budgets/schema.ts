import { z } from "zod";
import { allocationShape, checkbox, requiredId, requiredText, withAllocationRules } from "@/lib/validation";

export const budgetSchema = withAllocationRules(
  z.object({
    name: requiredText,
    ...allocationShape,
    spendingAccountId: requiredId,
    isFuel: checkbox,
    isActive: checkbox,
  }),
);

export type BudgetInput = z.output<typeof budgetSchema>;
