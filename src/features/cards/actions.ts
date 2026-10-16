"use server";

import { redirect } from "next/navigation";
import { getAccount } from "@/features/accounts/data";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { optionalText, positiveMoney, requiredId } from "@/lib/validation";
import { z } from "zod";
import { createCardPayment, deleteCardPayment, getCardPayment } from "./payments-data";

const cardPaymentSchema = z.object({
  cardId: requiredId,
  amountCents: positiveMoney,
  occurredOn: z.iso.date("Fecha inválida"),
  note: optionalText,
});

export async function saveCardPayment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(cardPaymentSchema, formData);
  if (!parsed.success) return parsed.state;

  const card = await getAccount(user.id, parsed.data.cardId);
  if (!card || card.type !== "credit") {
    return { fieldErrors: { cardId: ["Tarjeta inválida"] } };
  }

  await createCardPayment(user.id, parsed.data);
  redirect("/");
}

export async function removeCardPayment(id: string): Promise<FormState> {
  const user = await requireUser();
  const payment = await getCardPayment(user.id, id);
  if (payment) await deleteCardPayment(user.id, id);
  redirect("/");
}
