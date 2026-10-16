import { boolean, date, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { owner, timestamps } from "./columns";
import { financialAccounts } from "./finance";
import { periods } from "./periods";

/** Money moved between the user's own bank/cash accounts. Not spending. Credit cards are not transfer targets. */
export const transfers = pgTable(
  "transfers",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    periodId: uuid()
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    fromAccountId: uuid()
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "restrict" }),
    toAccountId: uuid()
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "restrict" }),
    amountCents: integer().notNull(),
    occurredOn: date().notNull(),
    note: text(),
    /** Recorded when the period was closed; removed if the period is reopened. */
    isSurplus: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [index().on(table.periodId)],
);

export type Transfer = typeof transfers.$inferSelect;
