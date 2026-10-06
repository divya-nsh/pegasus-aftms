// import "dotenv/config";
// import express from "express";
import fs from "node:fs";
// import path from "node:path";
// import { prettifyError, z } from "zod";
// import pg from "pg";
// import { getAppDirname } from "./lib/utils.js";
// import { exec, execFileSync } from "node:child_process";
//import os from "node:os";
// import runMigrations from "./db/migrate.js";

// import { fstat } from "fs";

// /**
//  *
//  * This is the entrypoint for the setup process.
//  * It will be used While creating setup.exe for windows to setup server easily on host machine
//  */

// const PROGRAM_DATA_DIR = path.join(
//   process.env.ProgramData || os.homedir(),
//   "AFTMS-Server",
// );

// const IS_SETUP_COMPLETE = process.env.IS_SETUP_COMPLETE === "true";

// console.log("App Directory Path:", getAppDirname());
// console.log("Program Data Directory Path:", PROGRAM_DATA_DIR);

// if (!IS_SETUP_COMPLETE) {
//   const app = express();

//   const open = (url: string) => {
//     exec(`start "" "${url}"`);
//   };

//   function restartServiceSync() {
//     if (!fs.existsSync("./restart-service.cmd")) {
//       throw new Error(
//         "Restart service command not found. Please Manually Restart the Service for changes to reflect",
//       );
//     }
//     execFileSync("./restart-service.cmd");
//   }

//   async function checkDatabaseConnection({
//     host,
//     port,
//     database,
//     username,
//     password,
//   }: z.infer<typeof schema>) {
//     const client = new pg.Client({
//       host,
//       port,
//       database,
//       user: username,
//       password,
//     });

//     try {
//       await client.connect();

//       return {
//         success: true,
//         message: "Database connection successful.",
//       };
//     } catch (error) {
//       console.error(error);

//       if (error instanceof AggregateError) {
//         const firstError = error.errors[0];

//         return {
//           success: false,
//           message: firstError?.message ?? "Unable to connect to the database.",
//         };
//       }

//       if (error instanceof Error) {
//         return {
//           success: false,
//           message: error.message,
//         };
//       }

//       return {
//         success: false,
//         message: "Unable to connect to the database.",
//       };
//     } finally {
//       await client.end().catch(() => {});
//     }
//   }

//   // app.use(express.static(path.join(getAppDirname(), "public")));

//   app.get("/", async (req, res) => {
//     const htmlContent = fs
//       .readFileSync(path.join(getAppDirname(), "public", "index.html"), "utf8")
//       .replace("{{APP_DATA_DIR}}", PROGRAM_DATA_DIR);
//     res.setHeader("Content-Type", "text/html");
//     res.sendStatus(200).send(htmlContent);
//   });

//   app.use(express.json());
//   app.use(express.urlencoded({ extended: true }));

//   const schema = z.object({
//     host: z.string(),
//     port: z.number(),
//     database: z.string(),
//     username: z.string(),
//     password: z.string(),
//   });

//   // Default port for setup server is 7001
//   const PORT = Number(process.env.PORT) ?? 7001;

//   app.post("/api/intializeConfig", async (req, res) => {
//     const { success, data, error } = schema.safeParse(req.body);
//     if (!success) {
//       return res.status(400).json({ error: prettifyError(error) });
//     }
//     const dbError = await checkDatabaseConnection(data);
//     if (dbError.success === false) {
//       return res.status(400).json({ error: dbError.message });
//     }

//     await runMigrations().catch((error) => {
//       console.error(error);
//       return res.status(500).json({
//         message: `Error Running Migrations. Check logs for more details: ${"message" in error ? error.message : "Unknown error"}`,
//       });
//     });

//     const { host, port, database, username, password } = data;
//     // For now using .env for all configuration, later will figure out a better way to store configuration
//     fs.writeFileSync(
//       "./.env",
//       `
// DATABASE_URL='postgresql://${username}:${password}@${host}:${port}/${database}'
// PORT=${PORT}
// SESSION_SECRET=${crypto.randomUUID()}
// DATA_DIR=${PROGRAM_DATA_DIR}
// IS_SETUP_COMPLETE=true
// SETUP_COMPLETE_AT=${new Date().toISOString()}
// `.trim(),
//     );

//     res.status(200).json({ message: "Configuration saved successfully." });
//   });

//   app.post("/api/restart-service", async (req, res) => {
//     try {
//       restartServiceSync();
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({
//         error: `Config File is Generated Successfully but Failed to Restart Service: ${error instanceof Error ? error.message : "Unknown error"}`,
//       });
//     }
//     res.status(200).json({ message: "Service restarted successfully." });
//   });

//   app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//     open(`http://localhost:${PORT}`);
//   });
// } else {
//   // Make sure to set NODE_ENV to production for production mode
//   process.env.NODE_ENV = "production";
//   await import("./index.js");
// }

// if (!fs.existsSync("./.env")) {
//   fs.writeFileSync(
//     "./.env",
//     `
// # Application Configuration File
// # Any changes to Reflects Required Service to restart

// # URL FORMAT: postgresql://<username>:<password>@<host>:<port>/<database>
// DATABASE_URL='postgresql://postgres:123@localhost:5432/AFTMS'

// # PORT FOR THE SERVER
// PORT=6001

// # NODE_ENV FOR THE SERVER Keep it to production
// NODE_ENV=production

// # Used to encrypt the session cookies
// SESSION_SECRET=1e20ff4d-e0e1-4076-9ba5-bad63b191112
// `.trim(),
//   );
// }

// process.env.NODE_ENV = "production";

// import("./index.js");
