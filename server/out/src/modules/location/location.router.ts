import db from "#/db/db.js";
import { locationTable } from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  address: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
});

const updateSchema = createSchema.extend({
  toEditId: z.number(),
});

const deleteSchema = z.object({
  toDeleteId: z.number(),
});

const locaitonRouter = router({
  getAll: protectedProcedure.query(async () => {
    const locations = await db.select().from(locationTable);

    return {
      items: locations,
      totalCount: locations.length,
    };
  }),

  isCodeExists: protectedProcedure
    .input(z.object({ code: z.string(), excludeId: z.number().optional() }))
    .query(async ({ input }) => {
      const [location] = await db
        .select({ id: locationTable.id })
        .from(locationTable)
        .where(
          and(
            sql`lower(${locationTable.code}) = ${input.code.toLowerCase()}`,
            input.excludeId ? ne(locationTable.id, input.excludeId) : undefined,
          ),
        )
        .limit(1);

      return location?.id ?? false;
    }),

  create: protectedProcedure.input(createSchema).mutation(async ({ input }) => {
    const { name, code, address, phone, description } = input;
    return db.transaction(async (tx) => {
      const res = await tx
        .insert(locationTable)
        .values({
          name,
          code,
          address,
          phone,
          description,
        })
        .returning({ id: locationTable.id });

      return res[0]!.id;
    });
  }),

  update: protectedProcedure.input(updateSchema).mutation(async ({ input }) => {
    const { toEditId, name, code, address, phone, description } = input;
    const location = await db
      .update(locationTable)
      .set({ name, code, address, phone, description })
      .where(eq(locationTable.id, toEditId))
      .returning({ id: locationTable.id });
    return location;
  }),

  delete: protectedProcedure.input(deleteSchema).mutation(async ({ input }) => {
    const { toDeleteId } = input;
    const location = await db
      .delete(locationTable)
      .where(eq(locationTable.id, toDeleteId))
      .returning({ id: locationTable.id });
    return location;
  }),
});

export default locaitonRouter;
