import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

// Reuse the connection across hot reloads in development.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };
const sql = globalForDb.sql ?? postgres(databaseUrl);
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema, casing: "snake_case" });
