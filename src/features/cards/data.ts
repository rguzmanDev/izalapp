import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions, transfers, type FinancialAccount } from "@/db/schema";
import { listAccounts } from "@/features/accounts/data";
import { lastCardCycle, paymentDueOf, type CardCycle } from "./cycle";

export type CardStatement = {
  card: FinancialAccount;
  cycle: CardCycle;
  /** Charged between the previous cutoff and the last one: what must be paid by the due date. */
  statementCents: number;
  /** Paid (transfers into the card) since the last cutoff. */
  paidCents: number;
  /** Charged since the last cutoff; goes into the next statement. */
  currentCents: number;
};

async function getCardStatement(
  userId: string,
  card: FinancialAccount,
  cycle: CardCycle,
): Promise<CardStatement> {
  const charged = (condition: ReturnType<typeof sql>) =>
    sql<number>`coalesce(sum(${transactions.amountCents}) filter (where ${condition}), 0)::int`;

  const [[charges], [payments]] = await Promise.all([
    db
      .select({
        statementCents: charged(sql`${transactions.occurredOn} <= ${cycle.cutoff}`),
        currentCents: charged(sql`${transactions.occurredOn} > ${cycle.cutoff}`),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.accountId, card.id),
          gt(transactions.occurredOn, cycle.previousCutoff),
        ),
      ),
    db
      .select({ paidCents: sql<number>`coalesce(sum(${transfers.amountCents}), 0)::int` })
      .from(transfers)
      .where(
        and(
          eq(transfers.userId, userId),
          eq(transfers.toAccountId, card.id),
          gt(transfers.occurredOn, cycle.cutoff),
        ),
      ),
  ]);

  return { card, cycle, ...charges, ...payments };
}

export async function listCardStatements(userId: string, today: string) {
  const statements = (await listAccounts(userId)).flatMap((card) => {
    const due = paymentDueOf(card);
    if (card.type !== "credit" || card.statementDay === null || due === null) return [];
    return [getCardStatement(userId, card, lastCardCycle(card.statementDay, due, today))];
  });
  return Promise.all(statements);
}
