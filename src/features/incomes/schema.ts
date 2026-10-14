import { z } from "zod";
import { allocationShape, checkbox, requiredId, requiredText, withAllocationRules } from "@/lib/validation";

export const incomeSchema = withAllocationRules(
  z.object({
    name: requiredText,
    ...allocationShape,
    depositAccountId: requiredId,
    isActive: checkbox,
  }),
);

export type IncomeInput = z.output<typeof incomeSchema>;
