import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  migrations: {
    schema: "public",
  },
  out: "./migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
