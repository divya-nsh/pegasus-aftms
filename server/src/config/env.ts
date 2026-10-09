import "dotenv/config";
import fs from "fs";
import { z } from "zod";
import crypto from "crypto";

const envSchema = z.object({
  DATA_DIR: z.string().default("./data"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().default("bad63b1911121e20ff4d"),
  IS_SET_UP_DONE: z.boolean().optional(),
});

if (!fs.existsSync(".env")) {
  fs.writeFileSync(
    ".env",
    `
PORT=6001

# Format: postgresql://<username>:<password>@<host>:<port>/<database>
DATABASE_URL=postgresql://postgres:123@localhost:5432/AFTMS

SESSION_SECRET=${crypto.randomBytes(16).toString("hex")}        

IS_SET_UP_DONE=false
`,
  );
}

const envConfig = envSchema.parse(process.env);

export default envConfig;
