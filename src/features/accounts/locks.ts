import "server-only";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardPayments, periodItems, transactions, transfers } from "@/db/schema";

/** True if the account already appears in the ledger (saldo inicial must stay put). */
export async function accountHasLedgerActivity(userId: string, accountId: string) {
  const [[tx], [xfer], [item]] = await Promise.all([
    db
      .select({ n: sql<number>`1` })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.accountId, accountId)))
      .limit(1),
    db
      .select({ n: sql<number>`1` })
      .from(transfers)
      .where(
        and(
          eq(transfers.userId, userId),
          or(eq(transfers.fromAccountId, accountId), eq(transfers.toAccountId, accountId)),
        ),
      )
      .limit(1),
    db
      .select({ n: sql<number>`1` })
      .from(periodItems)
      .where(and(eq(periodItems.userId, userId), eq(periodItems.accountId, accountId)))
      .limit(1),
  ]);
  return Boolean(tx || xfer || item);
}

/** True if the card already has tagged purchases or informative payments. */
export async function cardHasStatementActivity(userId: string, cardId: string) {
  const [[charge], [payment]] = await Promise.all([
    db
      .select({ n: sql<number>`1` })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.creditCardId, cardId)))
      .limit(1),
    db
      .select({ n: sql<number>`1` })
      .from(cardPayments)
      .where(and(eq(cardPayments.userId, userId), eq(cardPayments.cardId, cardId)))
      .limit(1),
  ]);
  return Boolean(charge || payment);
}
