import { migrate } from "drizzle-orm/node-postgres/migrator";
import db from "./db.js";
import path from "node:path";
import { getAppDirname } from "#/dirname.js";
import { logger } from "#/lib/logger.js";
import fs from "node:fs";

const migrationsFolder = path.join(getAppDirname(), "migrations");

export async function runMigrations(dbInstance: typeof db) {
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(
      "Something went wrong. Migrations folder 'migrations' not found",
    );
  }
  await dbInstance.execute("SELECT pg_advisory_lock(727274)");
  logger.info("Checking for pending migrations...");
  try {
    await migrate(dbInstance, { migrationsFolder });

    logger.info("Migrations run successfully");

    // const migrated = after.rows.length > before.rows.length;
    // if (migrated) {
    //   logger.info(
    //     `Applied ${after.rows.length - before.rows.length} migrations`,
    //   );
    // } else {
    //   logger.info("No new migrations to run");
    // }
  } catch (error) {
    logger.error("Error Migrating Database");
    throw error;
  } finally {
    await dbInstance.execute("SELECT pg_advisory_unlock(727274)");
  }
}

export default runMigrations;
