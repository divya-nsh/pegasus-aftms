import path from "path";
import express from "express";
import configStore from "./config/config-store.js";
import { getAppDirname } from "./dirname.js";
import fs from "fs";
import morgan from "morgan";
import { logger } from "./lib/logger.js";
import { prettifyError, z } from "zod";
import pg from "pg";
import { runMigrations } from "./db/migrate.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { testConnectionAndEnsureDatabase } from "./db/ensure-db-exists.js";

const RUN_AUTO_MIGRATION = true;
const SKIP_MIGRATION_IF_DATABASE_NOT_EMPTY = true;
const SETUP_HTML_PATH = path.join(getAppDirname(), "public", "setup.html");

async function checkIfDatabaseIsEmpty(client: pg.Client): Promise<boolean> {
  const result = await client.query(`
    SELECT NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ) AS "isEmpty";
  `);

  return result.rows[0].isEmpty;
}

export async function runSetupServer() {
  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  const PROGRAM_DATA_DIR = path.join(process.env.PROGRAMDATA ?? "", "AFTMS");
  const RESTART_EXIT_CODE = 75; // non-zero so WinSW's <onfailure action="restart"> kicks in
  const LOCAL = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

  const FRIENDLY_ERRORS: Record<string, string> = {
    ECONNREFUSED:
      "Cannot reach the server. Check host/port and that PostgreSQL is running.",
    ENOTFOUND: "Host not found.",
    ETIMEDOUT: "Connection timed out. Check host/port and firewall settings.",
    "28P01": "Wrong username or password.",
    "28000": "Server rejected this connection (check pg_hba.conf or SSL).",
    "3D000": "Database does not exist.",
    "42501":
      "Permission denied. The database user needs CREATE rights on the database and the public schema.",
  };

  // ---------------------------------------------------------------------------
  // Validation schema
  // ---------------------------------------------------------------------------
  const schema = z.object({
    host: z.string().trim().min(1),
    port: z.coerce.number().int().min(1).max(65535),
    database: z.string().trim().min(1),
    username: z.string().trim().min(1),
    password: z.string(),
    ssl: z.boolean().optional(), // optional checkbox for managed Postgres (RDS, Azure, ...)
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // Works for AggregateError (localhost IPv4/IPv6 attempts), pg DatabaseError and plain errors
  function toFriendlyMessage(error: unknown): string {
    if (error instanceof AggregateError && error.errors.length > 0) {
      return toFriendlyMessage(error.errors[0]);
    }
    const e = error as { code?: string; message?: string } | undefined;
    return (
      (e?.code && FRIENDLY_ERRORS[e.code]) ||
      e?.message ||
      "Unable to connect to the database."
    );
  }

  function buildDatabaseUrl(d: z.infer<typeof schema>) {
    const url =
      `postgresql://${encodeURIComponent(d.username)}:${encodeURIComponent(d.password)}` +
      `@${d.host}:${d.port}/${encodeURIComponent(d.database)}`;
    return d.ssl ? `${url}?sslmode=no-verify` : url;
  }

  // ---------------------------------------------------------------------------
  // Server
  // ---------------------------------------------------------------------------
  logger.info("App not configured. Starting setup server...");
  const app = express();
  let busy = false; // blocks double-click / parallel setup runs

  app.use(morgan("dev"));

  // Guard first, so we never parse bodies from remote callers
  app.use((req, res, next) => {
    if (configStore.config.isSetUpDone) return res.status(404).end(); // dead after setup
    if (!LOCAL.includes(req.socket.remoteAddress ?? "")) {
      return res
        .status(403)
        .json({ error: "Setup can only be run on the server machine" });
    }
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (_req, res) => {
    const htmlContent = fs
      .readFileSync(SETUP_HTML_PATH, "utf8")
      .replace("{{APP_DATA_DIR}}", PROGRAM_DATA_DIR);
    res.setHeader("Content-Type", "text/html").status(200).send(htmlContent);
  });

  // Only what the wizard needs. Never return the full config (JWT secret, DB password...)
  app.get("/api/config", (_req, res) => {
    res.json({ port: configStore.config.port, appDataDir: PROGRAM_DATA_DIR });
  });

  app.post("/api/complete", async (req, res) => {
    if (busy) {
      return res.status(409).json({ error: "Setup already in progress." });
    }
    busy = true;

    let client: pg.Client | null = null;

    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: prettifyError(parsed.error) });
      }

      const databaseUrl = buildDatabaseUrl(parsed.data);

      // 1. Connection test + create database if missing
      try {
        await testConnectionAndEnsureDatabase(databaseUrl);
      } catch (error) {
        logger.error({ msg: "DATABASE CONNECTION FAILED", error });
        return res.status(400).json({ error: toFriendlyMessage(error) });
      }

      // 2. Dedicated connection for migrations
      client = new pg.Client({ connectionString: databaseUrl });
      try {
        await client.connect();
      } catch (error) {
        logger.error({ msg: "DATABASE CONNECTION FAILED", error });
        return res.status(400).json({ error: toFriendlyMessage(error) });
      }

      // 3. Migrations (failure must NOT mark setup as done)
      if (RUN_AUTO_MIGRATION) {
        const isDatabaseEmpty = await checkIfDatabaseIsEmpty(client);
        if (SKIP_MIGRATION_IF_DATABASE_NOT_EMPTY && !isDatabaseEmpty) {
          logger.info("Database is not empty. Skipping migrations.");
          // return res.status(200).json({
          //   message: "Database is not empty. Migration skipped.",
          // });
        } else {
          try {
            await runMigrations(drizzle({ client }) as any);
          } catch (error) {
            const pgError = (error as any)?.cause ?? error;
            logger.error({ msg: "DATABASE MIGRATION FAILED", error: pgError });
            return res.status(500).json({
              error: `Database migration failed: ${toFriendlyMessage(pgError)}`,
            });
          }
        }
      }

      // 4. Save config only after everything succeeded
      try {
        configStore.update({ databaseUrl, isSetUpDone: true });
      } catch (error) {
        logger.error({ msg: "FAILED TO SAVE CONFIG", error });
        return res.status(500).json({
          error: "Could not save settings file. Check folder permissions.",
        });
      }

      // 5. Respond, then exit so WinSW restarts the service with the new config
      res.on("finish", () => {
        logger.info(
          `Setup complete. Exiting with code ${RESTART_EXIT_CODE} so the service restarts...`,
        );
        setTimeout(() => process.exit(RESTART_EXIT_CODE), 300);
      });
      return res.status(200).json({
        message: "Configuration saved successfully.",
        restarting: true,
      });
    } finally {
      await client?.end().catch(() => {});
      busy = false;
    }
  });

  const port = configStore.config.port;
  app
    .listen(port, () => {
      logger.info(`Setup server is running on port ${port}`);
    })
    .on("error", (error: NodeJS.ErrnoException) => {
      logger.error({
        msg:
          error.code === "EADDRINUSE"
            ? `Port ${port} is already in use. Change the port in settings.json.`
            : "Setup server failed to start",
        error,
      });
      process.exit(1);
    });
}
