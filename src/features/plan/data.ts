import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgets, fixedExpenses, incomes } from "@/db/schema";
import { buildMonthlyPlan } from "./build-plan";

/** Active incomes, fixed expenses and budgets: the templates every period is built from. */
export async function getActiveTemplates(userId: string) {
  const [incomeRows, fixedExpenseRows, budgetRows] = await Promise.all([
    db
      .select()
      .from(incomes)
      .where(and(eq(incomes.userId, userId), eq(incomes.isActive, true)))
      .orderBy(asc(incomes.name)),
    db
      .select()
      .from(fixedExpenses)
      .where(and(eq(fixedExpenses.userId, userId), eq(fixedExpenses.isActive, true)))
      .orderBy(asc(fixedExpenses.dueDay), asc(fixedExpenses.name)),
    db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.isActive, true)))
      .orderBy(asc(budgets.name)),
  ]);

  return { incomes: incomeRows, fixedExpenses: fixedExpenseRows, budgets: budgetRows };
}

export async function getMonthlyPlan(userId: string) {
  return buildMonthlyPlan(await getActiveTemplates(userId));
}
