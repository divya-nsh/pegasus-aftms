import db from "#/db/db.js";
import { aircraftTable } from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const optionalText = z.string().optional();

const createSchema = z.object({
  name: z.string().min(1),
  tailNumber: z.string().min(1),
  serialNumber: optionalText,
  aircraftType: optionalText,
  inductionDate: optionalText,
  remarks: optionalText,
  status: optionalText,
});

const updateSchema = createSchema.extend({
  toEditId: z.number(),
});

const deleteSchema = z.object({
  toDeleteId: z.number(),
});

const aircraftRouter = router({
  getAll: protectedProcedure.query(async () => {
    const aircraft = await db.select().from(aircraftTable).orderBy(desc(aircraftTable.id));

    return {
      items: aircraft,
      totalCount: aircraft.length,
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [aircraft] = await db
        .select()
        .from(aircraftTable)
        .where(eq(aircraftTable.id, input.id));

      if (!aircraft) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aircraft not found",
        });
      }

      return aircraft;
    }),

  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ input }) => {
      const aircraft = await db
        .insert(aircraftTable)
        .values(input)
        .returning({ id: aircraftTable.id });
      return aircraft;
    }),

  update: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ input }) => {
      const { toEditId, ...data } = input;
      const aircraft = await db
        .update(aircraftTable)
        .set(data)
        .where(eq(aircraftTable.id, toEditId))
        .returning({ id: aircraftTable.id });

      if (aircraft.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aircraft not found",
        });
      }
    }),

  delete: protectedProcedure
    .input(deleteSchema)
    .mutation(async ({ input }) => {
      const aircraft = await db
        .delete(aircraftTable)
        .where(eq(aircraftTable.id, input.toDeleteId))
        .returning({ id: aircraftTable.id });

      if (aircraft.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aircraft not found",
        });
      }

      return aircraft;
    }),
});

export default aircraftRouter;
