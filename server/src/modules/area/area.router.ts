import db from "#/db/db.js";
import { areaTable } from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
});

const updateSchema = createSchema.extend({
  toEditId: z.number(),
});

const deleteSchema = z.object({
  toDeleteId: z.number(),
});

const areaMasterRouter = router({
  getAll: protectedProcedure.query(async () => {
    const areas = await db.select().from(areaTable);

    return {
      items: areas,
      totalCount: areas.length,
    };
  }),
  create: protectedProcedure.input(createSchema).mutation(async ({ input }) => {
    const { name, code, address, description } = input;
    const area = await db
      .insert(areaTable)
      .values({
        name,
        code,
        address,
        description,
      })
      .returning({ id: areaTable.id });
    return area;
  }),

  update: protectedProcedure.input(updateSchema).mutation(async ({ input }) => {
    const { toEditId, name, code, address, description } = input;
    const area = await db
      .update(areaTable)
      .set({ name, code, address, description })
      .where(eq(areaTable.id, toEditId))
      .returning({ id: areaTable.id });
    return area;
  }),
  delete: protectedProcedure.input(deleteSchema).mutation(async ({ input }) => {
    const { toDeleteId } = input;
    const area = await db
      .delete(areaTable)
      .where(eq(areaTable.id, toDeleteId))
      .returning({ id: areaTable.id });
    return area;
  }),
});

export default areaMasterRouter;
