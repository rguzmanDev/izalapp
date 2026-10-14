import { boolean, index, integer, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { owner, timestamps } from "./columns";
import { transactions } from "./periods";

/** Gas refill details. Amount, date, account and budget live in the linked transaction. */
export const fuelLogs = pgTable(
  "fuel_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    transactionId: uuid()
      .notNull()
      .unique()
      .references(() => transactions.id, { onDelete: "cascade" }),
    odometer: integer().notNull(),
    gallons: numeric({ precision: 7, scale: 3, mode: "number" }).notNull(),
    pricePerGallon: numeric({ precision: 6, scale: 3, mode: "number" }).notNull(),
    station: text(),
    isFullTank: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

export type FuelLog = typeof fuelLogs.$inferSelect;
