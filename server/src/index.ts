import "dotenv/config";
import express from "express";
import session from "express-session";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { IS_PACKAGED, SESSION_COOKIE_NAME } from "./config/constants.js";
import db, { testDBConnection } from "./db/db.js";
import morgan from "morgan";
import path from "node:path";
import {
  MEDIA_FOLDER_PATH,
  mediaService,
} from "./modules/media/media.service.js";
import { serveClient } from "./middleware/serveClient.js";
import drizzleSessionStore from "./lib/drizzle-session-store.js";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { IS_DEVELOPMENT } from "./lib/env.js";
import { populateData } from "./populate.js";
import runMigrations from "./db/migrate.js";
import configStore from "./config/config-store.js";
import { getAppDirname } from "./dirname.js";
import { logger } from "./lib/logger.js";
import { runSetupServer } from "./setup.js";
import { isPortAvailable } from "./lib/utils.js";

if (process.argv.includes("--list-files")) {
  const modulePath = fileURLToPath(import.meta.url);
  const moduleDir = path.dirname(modulePath);

  console.log({
    modulePath,
    moduleDir,
  });
  console.log("Snapshot Path:", getAppDirname());
  console.log("App Dirname Actuall", getAppDirname(false));
  console.log("Assets files:", fs.readdirSync(getAppDirname()));
  console.log(
    "node_modules:",
    fs.readdirSync(path.join(getAppDirname(), "node_modules")),
  );
}

const appDirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const clientPath = resolveClientPath(appDirname);

app.use(
  session({
    store: drizzleSessionStore,
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET ?? "random-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);

app.use("/", serveClient(clientPath));
app.use(morgan("dev"));

app.get("/api", async (req, res) => res.send("Hello World!"));

let mediaIdToPathCache = new Map<string, string>();

app.get("/api/uploads/:mediaId", async (req, res) => {
  const mediaId = req.params.mediaId;
  if (!mediaIdToPathCache.has(mediaId)) {
    const media = await mediaService.getById(parseInt(mediaId));
    if (!media) {
      return res.status(404).send("Media not found");
    }
    mediaIdToPathCache.set(mediaId, media.path);
  }
  const filePath = mediaIdToPathCache.get(mediaId)!;
  res.sendFile(path.join(MEDIA_FOLDER_PATH, filePath!));
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createContext,
    onError: ({ error, ctx, path, input }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error("Server Error Occured in API");
        console.dir(
          {
            reqUrl: path,
            error,
            reqBody: input,
            userId: ctx?.user?.id,
          },
          { depth: 10 },
        );
      }
    },
  }),
);

console.log("System Info:", {
  NODE_ENV: process.env.NODE_ENV,
  UPLOADS_DIR: MEDIA_FOLDER_PATH,
  NODE_VERSION: process.version,
});

// !!!!!!!!!!!!!!!!!!! Run Migration in Production only temporary comment out
async function bootstrap() {
  await testDBConnection();
  if (!IS_DEVELOPMENT || IS_PACKAGED) {
    // await runMigrations(db);
  } else {
    console.log(
      "WARNING: Migrations will not be run automatically in development mode",
    );
  }

  // All jobs Depends on Database connection should go here after DB connection is established
  await populateData();
  await mediaService.startCleanupJob();
  await drizzleSessionStore.startCleanupJob();

  // Check port is available
  const port = configStore.config.port;
  if (!(await isPortAvailable(port))) {
    logger.error(`Port ${port} is already in use`);
    process.exit(1);
  }

  app.listen(configStore.config.port, () => {
    logger.info(`✔ Server Started at port ${configStore.config.port}!`);
    console.log(`> Site URL: http://localhost:${configStore.config.port}`);
    const indexHtml = path.join(clientPath, "index.html");
    if (!fs.existsSync(indexHtml) && !IS_DEVELOPMENT) {
      console.error(`✘ Client build not found at ${clientPath}`);
    }
  });
}

bootstrap();
if (configStore.config.isSetUpDone) {
  await bootstrap();
} else {
  await runSetupServer();
}

function resolveClientPath(entryDir: string) {
  const besideEntry = path.join(entryDir, "client-dist");
  const packageRoot = path.join(entryDir, "..", "client-dist");

  // `node dist/index.js` serves a client build copied next to the entry.
  // The executable mounts `pkg.assets` at the snapshot package root, so
  // `client-dist/**/*` is `../client-dist` from `dist/index.js`.
  if (fs.existsSync(path.join(besideEntry, "index.html"))) {
    return besideEntry;
  }

  return packageRoot;
}
