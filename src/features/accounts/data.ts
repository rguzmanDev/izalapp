import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { financialAccounts } from "@/db/schema";
import { isUuid } from "@/lib/validation";
import type { AccountInput } from "./schema";

const ownedBy = (userId: string, id: string) =>
  and(eq(financialAccounts.userId, userId), eq(financialAccounts.id, id));

export function listAccounts(userId: string) {
  return db
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.userId, userId))
    .orderBy(asc(financialAccounts.name));
}

export async function getAccount(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [account] = await db.select().from(financialAccounts).where(ownedBy(userId, id)).limit(1);
  return account ?? null;
}

export async function isOwnedAccount(userId: string, id: string) {
  return (await getAccount(userId, id)) !== null;
}

export async function createAccount(userId: string, input: AccountInput) {
  await db.insert(financialAccounts).values({ ...input, userId });
}

export async function updateAccount(userId: string, id: string, input: AccountInput) {
  await db.update(financialAccounts).set(input).where(ownedBy(userId, id));
}

export async function deleteAccount(userId: string, id: string) {
  await db.delete(financialAccounts).where(ownedBy(userId, id));
}
