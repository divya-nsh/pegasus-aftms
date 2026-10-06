// Make sure to install the 'pg' package
import configStore from "#/config/config-store.js";
import { testConnectionAndEnsureDatabase } from "./ensure-db-exists.js";
import { getDB } from "./getDB.js";

const DB_CONNECTION_STRING = configStore.config.databaseUrl;

const db = getDB();

export const testDBConnection = async () => {
  const parsedUrl = new URL(DB_CONNECTION_STRING);

  // ALERT: DO NOT LOG PASSWORD TO CONSOLE
  // This help to Debug which database is being used and which user is connecting to the database
  console.log(`Testing database connection...`, {
    port: parsedUrl.port,
    hostname: parsedUrl.hostname,
    user: parsedUrl.username,
    database: parsedUrl.pathname.slice(1),
  });

  await testConnectionAndEnsureDatabase(DB_CONNECTION_STRING);

  // Check Again but with drizzle
  try {
    await db.execute("select 1");
    console.log("✔ Database connection is OK!!");
  } catch (error) {
    console.error("✘ Database connection failed:", error);
    process.exit(1);
  }
};

export default db;

export type DBTransaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];
