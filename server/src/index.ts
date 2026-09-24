import "dotenv/config";
import express from "express";
import session from "express-session";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { SESSION_COOKIE_NAME } from "./config/constants.js";
import db, { testConnection } from "./db/db.js";
import { ensureDefaultAdmin } from "./modules/user/seed-admin.js";
import morgan from "morgan";
import path from "node:path";
import {
  MEDIA_FOLDER_PATH,
  mediaService,
} from "./modules/media/media.service.js";
import { serveClient } from "./middleware/serveClient.js";
import { DrizzleSessionStore } from "./lib/drizzle-session-store.js";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const appDirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 6001;

const clientPath = resolveClientPath(appDirname);

app.use(
  session({
    store: new DrizzleSessionStore(db, 2),
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

app.listen(port, async () => {
  console.log(`Server is listening on port ${port}!`);
  console.log(`URL: http://localhost:${port}`);
  const indexHtml = path.join(clientPath, "index.html");
  if (fs.existsSync(indexHtml)) {
    console.log(`Serving client from ${clientPath}`);
  } else {
    console.error(`Client build not found at ${clientPath}`);
  }
  await testConnection();
  await ensureDefaultAdmin();
});

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
