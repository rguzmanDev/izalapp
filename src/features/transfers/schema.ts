import { z } from "zod";
import { optionalText, positiveMoney, requiredId } from "@/lib/validation";

export const transferSchema = z
  .object({
    amountCents: positiveMoney,
    fromAccountId: requiredId,
    toAccountId: requiredId,
    occurredOn: z.iso.date("Fecha inválida"),
    note: optionalText,
  })
  .refine((value) => value.fromAccountId !== value.toAccountId, {
    path: ["toAccountId"],
    message: "Debe ser distinta a la de origen",
  });

export type TransferInput = z.output<typeof transferSchema>;
