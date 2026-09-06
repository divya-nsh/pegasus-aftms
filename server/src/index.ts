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
import path from "path";
import {
  MEDIA_FOLDER_PATH,
  mediaService,
} from "./modules/media/media.service.js";
import { serveClient } from "./middleware/serveClient.js";
import { DrizzleSessionStore } from "./lib/drizzle-session-store.js";
import { personnelTypeOptions } from "@repo/shared";

const app = express();
const port = 6001;

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

app.use(serveClient(path.join(process.cwd(), "client-dist")));
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
  }),
);

app.listen(port, async () => {
  console.log(`Server is listening on port ${port}!`);
  await testConnection();
  await ensureDefaultAdmin();
});
