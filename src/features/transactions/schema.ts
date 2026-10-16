import { z } from "zod";
import { optionalId, optionalText, positiveMoney, requiredId } from "@/lib/validation";

export const transactionSchema = z.object({
  amountCents: positiveMoney,
  itemId: optionalId,
  accountId: requiredId,
  /** Empty / omitted = charged directly to the bank/cash account. */
  creditCardId: optionalId,
  occurredOn: z.iso.date("Fecha inválida"),
  note: optionalText,
});

export type TransactionInput = z.output<typeof transactionSchema>;
