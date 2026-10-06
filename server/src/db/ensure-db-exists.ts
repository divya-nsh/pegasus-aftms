import { logger } from "#/lib/logger.js";
import { Client } from "pg";

export async function testConnectionAndEnsureDatabase(
  connectionString: string,
): Promise<void> {
  try {
    const client = new Client({ connectionString });
    await client.connect();
    await client.end();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "3D000") {
      logger.info("Database does not exist, creating...");
      const url = new URL(connectionString);
      const databaseName = decodeURIComponent(url.pathname.slice(1));
      url.pathname = "/template1";
      const client = new Client({ connectionString: url.toString() });
      await client.connect();
      await client.query(
        `CREATE DATABASE "${databaseName.replaceAll('"', '""')}"`,
      );
      logger.info(`New database "${databaseName}" created`);
      await client.end();
    } else {
      logger.error("Database connection failed");
      throw error;
    }
  }

  // const url = new URL(connectionString);
  // const databaseName = decodeURIComponent(url.pathname.slice(1));

  // if (!databaseName) {
  //   throw new Error("Database name is missing from connection string");
  // }

  // url.pathname = "/postgres";
  // const client = new Client({ connectionString: url.toString() });

  // await client.connect(); // throws if the connection string is bad
  // logger.info("Database connection is OK");

  // try {
  //   await client.query(
  //     `CREATE DATABASE "${databaseName.replaceAll('"', '""')}"`,
  //   );

  //   logger.info(`Database "${databaseName}" created`);
  // } catch (error: any) {
  //   if (error.code === "42P04") {
  //     console.log(`Database "${databaseName}" exists`);
  //   } else {
  //     throw error;
  //   }
  // } finally {
  //   await client.end();
  // }
}
