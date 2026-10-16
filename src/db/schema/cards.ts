import { date, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { owner, timestamps } from "./columns";
import { financialAccounts } from "./finance";

/**
 * Informative payment against a credit card statement.
 * Does not move bank money — purchases already debit the funding account.
 */
export const cardPayments = pgTable(
  "card_payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    cardId: uuid()
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "cascade" }),
    amountCents: integer().notNull(),
    occurredOn: date().notNull(),
    note: text(),
    ...timestamps,
  },
  (table) => [index().on(table.cardId), index().on(table.userId)],
);

export type CardPayment = typeof cardPayments.$inferSelect;
