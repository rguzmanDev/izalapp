import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgets, financialAccounts } from "@/db/schema";
import { isUuid } from "@/lib/validation";
import type { BudgetInput } from "./schema";

const ownedBy = (userId: string, id: string) => and(eq(budgets.userId, userId), eq(budgets.id, id));

export function listBudgets(userId: string) {
  return db
    .select({ budget: budgets, account: financialAccounts })
    .from(budgets)
    .innerJoin(financialAccounts, eq(budgets.spendingAccountId, financialAccounts.id))
    .where(eq(budgets.userId, userId))
    .orderBy(asc(budgets.name));
}

export async function getBudget(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [budget] = await db.select().from(budgets).where(ownedBy(userId, id)).limit(1);
  return budget ?? null;
}

export async function createBudget(userId: string, input: BudgetInput) {
  await db.insert(budgets).values({ ...input, userId });
}

export async function updateBudget(userId: string, id: string, input: BudgetInput) {
  await db.update(budgets).set(input).where(ownedBy(userId, id));
}

export async function deleteBudget(userId: string, id: string) {
  await db.delete(budgets).where(ownedBy(userId, id));
}
