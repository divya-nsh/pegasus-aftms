import db from "#/db/db.js";
import { aircraftTable, missionScheduleTable, missionTable } from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const optionalText = z.string().optional();
const optionalId = z.number().optional();

const createSchema = z.object({
  name: z.string().min(1),
  description: optionalText,
  aircraftId: optionalId,
  durationMinutes: z.number().int().min(1),
});

const updateSchema = createSchema.extend({
  toEditId: z.number(),
});

const missionRouter = router({
  getAll: protectedProcedure.query(async () => {
    const items = await db
      .select({
        id: missionTable.id,
        name: missionTable.name,
        description: missionTable.description,
        aircraftId: missionTable.aircraftId,
        durationMinutes: missionTable.durationMinutes,
        createdAt: missionTable.createdAt,
        updatedAt: missionTable.updatedAt,
        aircraftName: aircraftTable.name,
        aircraftTailNumber: aircraftTable.tailNumber,
      })
      .from(missionTable)
      .leftJoin(aircraftTable, eq(missionTable.aircraftId, aircraftTable.id))
      .orderBy(desc(missionTable.id));

    return {
      items,
      totalCount: items.length,
    };
  }),

  create: protectedProcedure.input(createSchema).mutation(async ({ input }) => {
    const [created] = await db
      .insert(missionTable)
      .values({
        name: input.name,
        description: input.description,
        aircraftId: input.aircraftId,
        durationMinutes: input.durationMinutes,
      })
      .returning({ id: missionTable.id });

    return created;
  }),

  update: protectedProcedure.input(updateSchema).mutation(async ({ input }) => {
    const { toEditId, ...data } = input;
    const [updated] = await db
      .update(missionTable)
      .set(data)
      .where(eq(missionTable.id, toEditId))
      .returning({ id: missionTable.id });

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mission not found",
      });
    }

    return updated;
  }),

  delete: protectedProcedure
    .input(z.object({ toDeleteId: z.number() }))
    .mutation(async ({ input }) => {
      const [inUse] = await db
        .select({ id: missionScheduleTable.id })
        .from(missionScheduleTable)
        .where(eq(missionScheduleTable.missionId, input.toDeleteId))
        .limit(1);

      if (inUse) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a mission that has schedules",
        });
      }

      const [deleted] = await db
        .delete(missionTable)
        .where(eq(missionTable.id, input.toDeleteId))
        .returning({ id: missionTable.id });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mission not found",
        });
      }

      return deleted;
    }),
});

export default missionRouter;
