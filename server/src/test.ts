import { AsyncLocalStorage } from "node:async_hooks";
import db from "./db/db.js";
import { aircraftTable, runWithCtx } from "./db/schema.js";
import { eq } from "drizzle-orm";

const ctx = new AsyncLocalStorage<{ userId: number | null }>();

const logContext = () => {
  const store = ctx.getStore();
  console.log("store", store);
};

await runWithCtx(1, async () => {
  return db
    .update(aircraftTable)
    .set({ name: "SkyHawk 320" })
    .where(eq(aircraftTable.id, 1));
});

process.exit(0);
