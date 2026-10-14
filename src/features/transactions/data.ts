import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { financialAccounts, fuelLogs, periodItems, transactions } from "@/db/schema";
import { isUuid } from "@/lib/validation";
import type { TransactionInput } from "./schema";

type TransactionValues = TransactionInput & { periodId: string };

const ownedBy = (userId: string, id: string) =>
  and(eq(transactions.userId, userId), eq(transactions.id, id));

export function listTransactions(userId: string, periodId: string) {
  return db
    .select({
      transaction: transactions,
      account: financialAccounts,
      itemName: periodItems.name,
      fuelLogId: fuelLogs.id,
      station: fuelLogs.station,
    })
    .from(transactions)
    .innerJoin(financialAccounts, eq(transactions.accountId, financialAccounts.id))
    .leftJoin(periodItems, eq(transactions.itemId, periodItems.id))
    .leftJoin(fuelLogs, eq(fuelLogs.transactionId, transactions.id))
    .where(and(eq(transactions.userId, userId), eq(transactions.periodId, periodId)))
    .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt));
}

export async function getTransaction(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [transaction] = await db.select().from(transactions).where(ownedBy(userId, id)).limit(1);
  return transaction ?? null;
}

export async function createTransaction(userId: string, values: TransactionValues) {
  await db.insert(transactions).values({ ...values, userId });
}

export async function updateTransaction(userId: string, id: string, values: TransactionValues) {
  await db.update(transactions).set(values).where(ownedBy(userId, id));
}

export async function deleteTransaction(userId: string, id: string) {
  await db.delete(transactions).where(ownedBy(userId, id));
}
