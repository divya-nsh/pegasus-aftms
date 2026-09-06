// Make sure to install the 'pg' package
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "./relations.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle({ client: pool, relations });

export const testConnection = async () => {
  try {
    await db.execute("select 1");
    console.log("Database connection is OK!!");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

// testConnection();
export default db;

export type DBTransaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];
