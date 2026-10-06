import configStore from "#/config/config-store.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "./relations.js";

let pool: Pool | null = null;

export function getDB() {
  const connectionString = configStore.config.databaseUrl;
  if (!connectionString) {
    throw new Error("Database connection string not found");
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 1000 * 60 * 10, // 10 minutes
      min: 1,
    });
  }
  return drizzle({ client: pool, relations });
}
