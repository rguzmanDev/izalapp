import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { financialAccounts, fixedExpenses } from "@/db/schema";
import { isUuid } from "@/lib/validation";
import type { FixedExpenseInput } from "./schema";

const ownedBy = (userId: string, id: string) =>
  and(eq(fixedExpenses.userId, userId), eq(fixedExpenses.id, id));

export function listFixedExpenses(userId: string) {
  return db
    .select({ expense: fixedExpenses, account: financialAccounts })
    .from(fixedExpenses)
    .innerJoin(financialAccounts, eq(fixedExpenses.paymentAccountId, financialAccounts.id))
    .where(eq(fixedExpenses.userId, userId))
    .orderBy(asc(fixedExpenses.dueDay), asc(fixedExpenses.name));
}

export async function getFixedExpense(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [expense] = await db.select().from(fixedExpenses).where(ownedBy(userId, id)).limit(1);
  return expense ?? null;
}

export async function createFixedExpense(userId: string, input: FixedExpenseInput) {
  await db.insert(fixedExpenses).values({ ...input, userId });
}

export async function updateFixedExpense(userId: string, id: string, input: FixedExpenseInput) {
  await db.update(fixedExpenses).set(input).where(ownedBy(userId, id));
}

export async function deleteFixedExpense(userId: string, id: string) {
  await db.delete(fixedExpenses).where(ownedBy(userId, id));
}
