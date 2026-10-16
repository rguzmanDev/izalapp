import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { financialAccounts, periodItems, transfers } from "@/db/schema";
import { listAccounts } from "@/features/accounts/data";
import { isUuid } from "@/lib/validation";
import { buildTransferPlan, fundingAccountId } from "./plan";
import type { TransferInput } from "./schema";

type TransferValues = TransferInput & { periodId: string };

const fromAccount = alias(financialAccounts, "from_account");
const toAccount = alias(financialAccounts, "to_account");

const ownedBy = (userId: string, id: string) =>
  and(eq(transfers.userId, userId), eq(transfers.id, id));

const inPeriod = (userId: string, periodId: string) =>
  and(eq(transfers.userId, userId), eq(transfers.periodId, periodId));

export function listTransfers(userId: string, periodId: string) {
  return db
    .select({ transfer: transfers, from: fromAccount, to: toAccount })
    .from(transfers)
    .innerJoin(fromAccount, eq(transfers.fromAccountId, fromAccount.id))
    .innerJoin(toAccount, eq(transfers.toAccountId, toAccount.id))
    .where(inPeriod(userId, periodId))
    .orderBy(desc(transfers.occurredOn), desc(transfers.createdAt));
}

export async function getTransfer(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [transfer] = await db.select().from(transfers).where(ownedBy(userId, id)).limit(1);
  return transfer ?? null;
}

export async function createTransfer(userId: string, values: TransferValues) {
  await db.insert(transfers).values({ ...values, userId });
}

export async function updateTransfer(userId: string, id: string, values: TransferValues) {
  await db.update(transfers).set(values).where(ownedBy(userId, id));
}

export async function deleteTransfer(userId: string, id: string) {
  await db.delete(transfers).where(ownedBy(userId, id));
}

/** The period's transfer plan along with the accounts it references. */
export async function getTransferPlan(userId: string, periodId: string) {
  const [items, accounts, done] = await Promise.all([
    db
      .select()
      .from(periodItems)
      .where(and(eq(periodItems.userId, userId), eq(periodItems.periodId, periodId))),
    listAccounts(userId),
    db
      .select()
      .from(transfers)
      .where(and(inPeriod(userId, periodId), eq(transfers.isSurplus, false))),
  ]);
  return { steps: buildTransferPlan({ items, accounts, transfers: done }), accounts };
}

/**
 * When the payment account is fully funded for what is still pending, those fixed
 * expenses and budgets (or cards paid from that account) become "apartado".
 */
export async function setAsideIfAccountFullyFunded(
  userId: string,
  periodId: string,
  toAccountId: string,
) {
  const { steps, accounts } = await getTransferPlan(userId, periodId);
  const forAccount = steps.filter((step) => step.toAccountId === toAccountId);
  if (forAccount.length === 0 || forAccount.some((step) => step.doneCents < step.amountCents)) {
    return;
  }

  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const items = await db
    .select()
    .from(periodItems)
    .where(
      and(
        eq(periodItems.userId, userId),
        eq(periodItems.periodId, periodId),
        eq(periodItems.paymentStatus, "pending"),
        inArray(periodItems.kind, ["fixed_expense", "budget"]),
      ),
    );

  const ids = items
    .filter(
      (item) => fundingAccountId(accountsById.get(item.accountId), item.accountId) === toAccountId,
    )
    .map((item) => item.id);
  if (ids.length === 0) return;

  await db
    .update(periodItems)
    .set({ paymentStatus: "set_aside" })
    .where(and(eq(periodItems.userId, userId), inArray(periodItems.id, ids)));
}
