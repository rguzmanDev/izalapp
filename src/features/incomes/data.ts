import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { financialAccounts, incomes } from "@/db/schema";
import { isUuid } from "@/lib/validation";
import type { IncomeInput } from "./schema";

const ownedBy = (userId: string, id: string) => and(eq(incomes.userId, userId), eq(incomes.id, id));

export function listIncomes(userId: string) {
  return db
    .select({ income: incomes, account: financialAccounts })
    .from(incomes)
    .innerJoin(financialAccounts, eq(incomes.depositAccountId, financialAccounts.id))
    .where(eq(incomes.userId, userId))
    .orderBy(asc(incomes.name));
}

export async function getIncome(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [income] = await db.select().from(incomes).where(ownedBy(userId, id)).limit(1);
  return income ?? null;
}

export async function createIncome(userId: string, input: IncomeInput) {
  await db.insert(incomes).values({ ...input, userId });
}

export async function updateIncome(userId: string, id: string, input: IncomeInput) {
  await db.update(incomes).set(input).where(ownedBy(userId, id));
}

export async function deleteIncome(userId: string, id: string) {
  await db.delete(incomes).where(ownedBy(userId, id));
}
