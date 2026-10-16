import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cardPayments, financialAccounts } from "@/db/schema";
import { isUuid } from "@/lib/validation";

export type CardPaymentInput = {
  cardId: string;
  amountCents: number;
  occurredOn: string;
  note: string | null;
};

const ownedBy = (userId: string, id: string) =>
  and(eq(cardPayments.userId, userId), eq(cardPayments.id, id));

export function listCardPayments(userId: string, cardId: string) {
  return db
    .select({ payment: cardPayments, card: financialAccounts })
    .from(cardPayments)
    .innerJoin(financialAccounts, eq(cardPayments.cardId, financialAccounts.id))
    .where(and(eq(cardPayments.userId, userId), eq(cardPayments.cardId, cardId)))
    .orderBy(desc(cardPayments.occurredOn), desc(cardPayments.createdAt));
}

export async function getCardPayment(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db.select().from(cardPayments).where(ownedBy(userId, id)).limit(1);
  return row ?? null;
}

export async function createCardPayment(userId: string, values: CardPaymentInput) {
  await db.insert(cardPayments).values({ ...values, userId });
}

export async function deleteCardPayment(userId: string, id: string) {
  await db.delete(cardPayments).where(ownedBy(userId, id));
}
