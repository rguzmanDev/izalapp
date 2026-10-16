import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { ACCOUNT_TYPES } from "../../features/accounts/constants";
import { SPLITS } from "../../lib/allocation";
import { owner, timestamps } from "./columns";

export const accountType = pgEnum("account_type", ACCOUNT_TYPES);
export const split = pgEnum("split", SPLITS);

/** Monthly amount in cents and how it is distributed between both halves of the month. */
const allocation = () => ({
  monthlyAmountCents: integer().notNull(),
  split: split().notNull().default("even"),
  customFirstHalfCents: integer(),
});

/** Bank accounts and credit cards. */
export const financialAccounts = pgTable(
  "financial_accounts",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    name: text().notNull(),
    bank: text(),
    /** Last 4 digits of the card or account number, to tell similar accounts apart. */
    lastFour: text(),
    type: accountType().notNull(),
    statementDay: smallint(),
    /** Credit cards set one of these: a fixed day of the month or a number of days after the cutoff. */
    paymentDueDay: smallint(),
    paymentDueDaysAfterCutoff: smallint(),
    paymentAccountId: uuid().references((): AnyPgColumn => financialAccounts.id, {
      onDelete: "set null",
    }),
    /**
     * Planned cash position before movements in the app.
     * Banks/savings: money on hand. Credit: typically 0 or negative if you start with debt.
     */
    openingBalanceCents: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

export const incomes = pgTable(
  "incomes",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    name: text().notNull(),
    ...allocation(),
    depositAccountId: uuid()
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "restrict" }),
    isActive: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

export const fixedExpenses = pgTable(
  "fixed_expenses",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    name: text().notNull(),
    ...allocation(),
    dueDay: smallint(),
    paymentAccountId: uuid()
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "restrict" }),
    isActive: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

/** Spending caps for variable expenses such as gas or dates. */
export const budgets = pgTable(
  "budgets",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    name: text().notNull(),
    ...allocation(),
    spendingAccountId: uuid()
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "restrict" }),
    /** Gas budgets record odometer and gallons for each expense. */
    isFuel: boolean().notNull().default(false),
    isActive: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type Income = typeof incomes.$inferSelect;
export type FixedExpense = typeof fixedExpenses.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
