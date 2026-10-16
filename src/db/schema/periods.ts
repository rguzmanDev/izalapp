import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  PAYMENT_STATUSES,
  PERIOD_ITEM_KINDS,
  PERIOD_STATUSES,
} from "../../features/periods/constants";
import { owner, timestamps } from "./columns";
import { financialAccounts } from "./finance";

export const periodStatus = pgEnum("period_status", PERIOD_STATUSES);
export const periodItemKind = pgEnum("period_item_kind", PERIOD_ITEM_KINDS);
export const paymentStatus = pgEnum("payment_status", PAYMENT_STATUSES);

/** A half of a month ("quincena"): days 1–15 or 16–end of month. */
export const periods = pgTable(
  "periods",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    year: smallint().notNull(),
    month: smallint().notNull(),
    half: smallint().notNull(),
    status: periodStatus().notNull().default("open"),
    ...timestamps,
  },
  (table) => [unique().on(table.userId, table.year, table.month, table.half)],
);

/**
 * Snapshot of an income, fixed expense or budget for one period.
 * Copied when the period opens, so later template edits don't rewrite history.
 */
export const periodItems = pgTable(
  "period_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    periodId: uuid()
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    kind: periodItemKind().notNull(),
    sourceId: uuid(),
    name: text().notNull(),
    plannedCents: integer().notNull(),
    accountId: uuid()
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "restrict" }),
    dueDay: smallint(),
    isFuel: boolean().notNull().default(false),
    paymentStatus: paymentStatus().notNull().default("pending"),
    ...timestamps,
  },
  (table) => [index().on(table.periodId)],
);

/** Real money spent. Linked to a budget or fixed expense item, or unbudgeted when itemId is null. */
export const transactions = pgTable(
  "transactions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    periodId: uuid()
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    itemId: uuid().references(() => periodItems.id, { onDelete: "set null" }),
    /** Bank/cash account that loses the money. Never a credit card. */
    accountId: uuid()
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "restrict" }),
    /** Optional credit card tag: purchase counts toward that card's statement. */
    creditCardId: uuid().references(() => financialAccounts.id, { onDelete: "set null" }),
    amountCents: integer().notNull(),
    occurredOn: date().notNull(),
    note: text(),
    ...timestamps,
  },
  (table) => [index().on(table.periodId), index().on(table.itemId)],
);

export type Period = typeof periods.$inferSelect;
export type PeriodItem = typeof periodItems.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
