// Make sure to install the 'pg' package
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "./relations.js";

const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 1000 * 60 * 10, // 10 minutes
  min: 1,
});
const db = drizzle({ client: pool, relations });

export const testConnection = async () => {
  const parsedUrl = new URL(process.env.DATABASE_URL!);
  // ALERT: DO NOT LOG PASSWORD TO CONSOLE
  // This help to Debug which database is being used and which user is connecting to the database
  console.log(`Testing database connection...`, {
    port: parsedUrl.port,
    hostname: parsedUrl.hostname,
    user: parsedUrl.username,
    database: parsedUrl.pathname.slice(1),
  });
  try {
    await db.execute("select 1");
    console.log("✔ Database connection is OK!!");
    await db.execute(migrationQuery);
  } catch (error) {
    console.error("✘ Database connection failed:", error);
    process.exit(1);
  }
};

// testConnection();
export default db;

export type DBTransaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];

const migrationQuery = `

`;
