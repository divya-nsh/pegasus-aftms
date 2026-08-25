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
import { mediaTable } from "./db/schema.js";
import path from "path";
import { eq } from "drizzle-orm";
import { MEDIA_FOLDER_PATH, mediaService } from "./modules/media/media.service.js";
  
const app = express();
const port = 6001;

app.use(
  session({
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET ?? "dev-in-memory-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);
app.use(morgan("dev"));

app.get("/api", async (req, res) => res.send("Hello World!"));

app.get("/api/uploads/:mediaId", async (req, res) => {
  const mediaId = req.params.mediaId;
  const media = await mediaService.getById(parseInt(mediaId));
  if (!media) {
    return res.status(404).send("Media not found");
  }
  res.sendFile(path.join(MEDIA_FOLDER_PATH, media.path));
})

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