import { ConfigStore } from "#/lib/config-store.js";
import { z } from "zod";
import { IS_PACKAGED } from "./constants.js";
import crypto from "node:crypto";
import path from "node:path";
import { getAppDirname } from "#/dirname.js";

const appConfigSchema = z.object({
  port: z.number().default(6001),
  databaseUrl: z.url(),
  sessionSecret: z.string().default("bad63b1911121e20ff4d"),
  isSetUpDone: z.boolean().optional(),
});

const configStore = new ConfigStore({
  file: IS_PACKAGED
    ? path.join(getAppDirname(false), "config.jsonc")
    : path.join(getAppDirname(false), ".config.jsonc"),
  schema: appConfigSchema,
  version: 1,
  description: `
Note: Changes to this file require a service restart.
Guide:
 - Don't change version number
 - Database URL format: "postgresql://<username>:<password>@<host>:<port>/<database>"

  `.trim(),
  initial: {
    databaseUrl: "postgresql://postgres:<your_password>@localhost:5432/AFTMS",
    port: IS_PACKAGED ? 7001 : 6001,
    sessionSecret: crypto.randomBytes(16).toString("hex"),
  },
});

configStore.save();

export default configStore;
