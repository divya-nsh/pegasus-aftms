import { execFile } from "node:child_process";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { devNull } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function assertMaxBackups(maxBackups: number): void {
  if (!Number.isInteger(maxBackups) || maxBackups < 1) {
    throw new Error("maxBackups must be a whole number of 1 or more");
  }
}

/** Splits a connection string into the database name, the password, and a URL without the password. */
function parseConnection(connectionString: string): {
  url: URL;
  database: string;
  password: string;
} {
  const url = new URL(connectionString);
  const database = decodeURIComponent(url.pathname.slice(1));
  const password = decodeURIComponent(url.password);
  url.password = ""; // keep the password out of the command line
  return { url, database, password };
}

/** Throws a clear error if pg_dump or pg_restore is not installed / not in PATH. */
export async function checkPgTools(): Promise<void> {
  for (const tool of ["pg_dump", "pg_restore"]) {
    try {
      await execFileAsync(tool, ["--version"]);
    } catch {
      throw new Error(
        `${tool} not found. Install the PostgreSQL client tools and make sure ${tool} is in your PATH.`,
      );
    }
  }
}

/**
 * Backs up ONE postgres database (the one in the connection string) to destDir.
 * Returns the path of the backup file. Throws if the backup fails.
 * Needs pg_dump and pg_restore installed on the machine.
 *
 * After a successful backup, old backups of this database beyond `maxBackups` (default 7) are deleted.
 *
 * Restore with restoreDatabase(), or: pg_restore --no-owner -d <target_db> <file>
 */
export async function backupDatabase(
  connectionString: string,
  destDir: string,
  maxBackups = 7,
): Promise<string> {
  assertMaxBackups(maxBackups); // fail fast, before starting a potentially long dump
  await checkPgTools();

  const { url, database, password } = parseConnection(connectionString);

  await mkdir(destDir, { recursive: true });

  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+/, "");
  const finalPath = path.join(destDir, `${stamp}_${database}.dump`);
  const tempPath = `${finalPath}.tmp`;

  try {
    await execFileAsync(
      "pg_dump",
      [
        "--format=custom",
        "--no-password",
        `--dbname=${url}`,
        `--file=${tempPath}`,
      ],
      {
        env: { ...process.env, PGPASSWORD: password },
      },
    );

    // Read the whole archive back and throw the output away: fails if the file is truncated or corrupt
    await execFileAsync("pg_restore", [`--file=${devNull}`, tempPath]);

    await rename(tempPath, finalPath); // file only gets its real name once dump + check succeeded
  } catch (err) {
    await rm(tempPath, { force: true });
    const e = err as { stderr?: string; message: string };
    throw new Error(`Backup failed: ${e.stderr?.trim() || e.message}`);
  }

  await pruneBackups(destDir, database, maxBackups); // only reached if the new backup succeeded
  return finalPath;
}

/**
 * Deletes the oldest backups of `database` in destDir, keeping only the newest `maxBackups` (default 7).
 * Only touches files made by backupDatabase() for this database. Returns the paths it deleted.
 *
 * backupDatabase() already calls this for you; use it directly only for manual cleanup.
 */
export async function pruneBackups(
  destDir: string,
  database: string,
  maxBackups = 7,
): Promise<string[]> {
  assertMaxBackups(maxBackups);

  const escapedName = database.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ownBackup = new RegExp(`^\\d{8}T\\d{6}Z_${escapedName}\\.dump$`);
  const backups = (await readdir(destDir))
    .filter((f) => ownBackup.test(f))
    .sort(); // timestamp sorts oldest first

  const deleted: string[] = [];
  for (const old of backups.slice(
    0,
    Math.max(0, backups.length - maxBackups),
  )) {
    const full = path.join(destDir, old);
    await rm(full, { force: true });
    deleted.push(full);
  }
  return deleted;
}

/**
 * Restores a backup file made by backupDatabase() into the database named in the connection string.
 *
 * - The target database must already exist, and should be EMPTY (create it first, e.g. `createdb mydb`).
 *   If it already contains the same tables, the restore fails and nothing is changed.
 * - All-or-nothing: it runs in a single transaction, so any error leaves the database exactly as it was.
 * - Object owners from the backup are ignored, so it works with a different database user.
 */
// export async function restoreDatabase(
//   connectionString: string,
//   backupFile: string,
// ): Promise<void> {
//   await checkPgTools();

//   const { url, password } = parseConnection(connectionString);

//   try {
//     await execFileAsync(
//       "pg_restore",
//       [
//         "--no-owner",
//         "--no-password",
//         "--single-transaction",
//         "--exit-on-error",
//         `--dbname=${url}`,
//         backupFile,
//       ],
//       { env: { ...process.env, PGPASSWORD: password } },
//     );
//   } catch (err) {
//     const e = err as { stderr?: string; message: string };
//     throw new Error(`Restore failed: ${e.stderr?.trim() || e.message}`);
//   }
// }
