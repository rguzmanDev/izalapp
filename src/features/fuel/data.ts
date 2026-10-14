import "server-only";
import { and, asc, eq, gt, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { fuelLogs, transactions } from "@/db/schema";
import { isUuid } from "@/lib/validation";
import type { FuelLogInput } from "./schema";

const selection = { log: fuelLogs, transaction: transactions };

/** Refills sorted by odometer, lowest first (the order the stats need). */
export function listFuelLogs(userId: string) {
  return db
    .select(selection)
    .from(fuelLogs)
    .innerJoin(transactions, eq(fuelLogs.transactionId, transactions.id))
    .where(eq(fuelLogs.userId, userId))
    .orderBy(asc(fuelLogs.odometer));
}

export type FuelLogRow = Awaited<ReturnType<typeof listFuelLogs>>[number];

export async function getFuelLog(userId: string, id: string): Promise<FuelLogRow | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select(selection)
    .from(fuelLogs)
    .innerJoin(transactions, eq(fuelLogs.transactionId, transactions.id))
    .where(and(eq(fuelLogs.userId, userId), eq(fuelLogs.id, id)))
    .limit(1);
  return row ?? null;
}

export async function findFuelLogIdByTransaction(userId: string, transactionId: string) {
  const [row] = await db
    .select({ id: fuelLogs.id })
    .from(fuelLogs)
    .where(and(eq(fuelLogs.userId, userId), eq(fuelLogs.transactionId, transactionId)))
    .limit(1);
  return row?.id ?? null;
}

/** Odometer readings of the refills right before and after `occurredOn`, so a new one fits between them. */
export async function findOdometerBounds(userId: string, occurredOn: string, excludeId: string | null) {
  const others = and(
    eq(fuelLogs.userId, userId),
    excludeId ? ne(fuelLogs.id, excludeId) : undefined,
  );
  const [bounds] = await db
    .select({
      previous: sql<number | null>`max(${fuelLogs.odometer}) filter (where ${lte(transactions.occurredOn, occurredOn)})`,
      next: sql<number | null>`min(${fuelLogs.odometer}) filter (where ${gt(transactions.occurredOn, occurredOn)})`,
    })
    .from(fuelLogs)
    .innerJoin(transactions, eq(fuelLogs.transactionId, transactions.id))
    .where(others);
  return bounds;
}

type ExpenseValues = Pick<FuelLogInput, "itemId" | "accountId" | "amountCents" | "occurredOn"> & {
  periodId: string;
};
type FuelDetails = Pick<FuelLogInput, "odometer" | "gallons" | "pricePerGallon" | "station" | "isFullTank">;

function splitInput(input: FuelLogInput, periodId: string): [ExpenseValues, FuelDetails] {
  const { itemId, accountId, amountCents, occurredOn, ...details } = input;
  return [{ itemId, accountId, amountCents, occurredOn, periodId }, details];
}

/** Records the refill as an expense (so it counts against the budget) plus its fuel details. */
export async function createFuelLog(userId: string, input: FuelLogInput, periodId: string) {
  const [expense, details] = splitInput(input, periodId);
  await db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(transactions)
      .values({ ...expense, userId })
      .returning({ id: transactions.id });
    await tx.insert(fuelLogs).values({ ...details, userId, transactionId: transaction.id });
  });
}

export async function updateFuelLog(
  userId: string,
  row: FuelLogRow,
  input: FuelLogInput,
  periodId: string,
) {
  const [expense, details] = splitInput(input, periodId);
  await db.transaction(async (tx) => {
    await tx
      .update(transactions)
      .set(expense)
      .where(and(eq(transactions.userId, userId), eq(transactions.id, row.transaction.id)));
    await tx
      .update(fuelLogs)
      .set(details)
      .where(and(eq(fuelLogs.userId, userId), eq(fuelLogs.id, row.log.id)));
  });
}

/** Deleting the expense removes the fuel details with it. */
export async function deleteFuelLog(userId: string, row: FuelLogRow) {
  await db
    .delete(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.id, row.transaction.id)));
}
