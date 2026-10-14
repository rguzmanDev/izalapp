import { text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const owner = () =>
  text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });
