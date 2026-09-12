import db from "#/db/db.js";
import { SCHEDULE_NUMBER_PREFIX } from "#/config/constants.js";
import {
  missionAssignmentTable,
  missionScheduleTable,
  missionTable,
} from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import userService from "../user/user.service.js";
import { TRPCError } from "@trpc/server";
import { eq, type SQL } from "drizzle-orm";
import { z } from "zod";
import roleService from "../role/role.service.js";
import {
  createSchema,
  missionStatusSchema,
  updateSchema,
} from "./schedule.schema.js";
import type { TMissionStatus } from "./schedule.schema.js";
import scheduleService from "./schedule.service.js";

async function getScheduleOrThrow(id: number) {
  const [row] = await db
    .select()
    .from(missionScheduleTable)
    .where(eq(missionScheduleTable.id, id));
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Event schedule not found",
    });
  }
  return row;
}

async function getTraineeScope(userId: number) {
  const user = await userService.getById(userId);
  const personnelId = user?.personnel[0]?.id ?? null;
  return {
    isTrainee: user?.role === "trainee",
    personnelId,
  };
}

async function getMissionOrThrow(id: number) {
  const [row] = await db
    .select()
    .from(missionTable)
    .where(eq(missionTable.id, id));
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Event not found",
    });
  }
  return row;
}

const scheduleRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.array(missionStatusSchema).optional(),
        // In UTC
        startDateTime: z.coerce.date().optional(),
        // In UTC
        endDateTime: z.coerce.date().optional(),
        personnelId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const scope = roleService.canDo(ctx.user.role || "", "schedule", "view");

      let loggedInPersonnelId: number | undefined;

      if (scope === "assigned" && ctx.user.personnelId != null) {
        loggedInPersonnelId = ctx.user.personnelId;
      }

      const personnelId = loggedInPersonnelId ?? input.personnelId;

      const items = await db.query.missionScheduleTable.findMany({
        with: {
          mission: true,
          area: true,
        },
        orderBy: {
          id: "desc",
        },
        where: {
          NOT:
            scope === "assigned"
              ? {
                  status: "draft",
                }
              : undefined,
          status: input.status
            ? {
                in: input.status,
              }
            : undefined,
          assignments: {
            personnelId,
          },
          startDateTime: {
            gte: input.startDateTime,
          },
          endDateTime: {
            lte: input.endDateTime,
          },
        },
        extras: {
          assignmentsCount: (schedule) =>
            db.$count(
              missionAssignmentTable,
              eq(missionAssignmentTable.scheduleId, schedule.id),
            ),
        },
      });

      return {
        items: items,
        totalCount: items.length,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const scope = roleService.canDo(ctx.user.role || "", "schedule", "view");

      let personnelId: number | undefined;

      if (scope === "assigned" && ctx.user.personnelId != null) {
        personnelId = ctx.user.personnelId;
      }

      const data = await db.query.missionScheduleTable.findFirst({
        with: {
          mission: true,
          area: true,
          assignments: {
            with: {
              personnel: true,
              aircraft: true,
            },
            where: {
              personnelId: personnelId,
            },
            orderBy: {
              lineNumber: "asc",
            },
          },
        },
        where: {
          id: input.id,
        },
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid Id, Schedule not found or deleted",
        });
      }

      return data;
    }),

  create: protectedProcedure.input(createSchema).mutation(async ({ input }) => {
    const { assignments, missionId, ...data } = input;

    const res = await db.transaction(async (tx) => {
      const values: typeof missionScheduleTable.$inferInsert = {
        scheduleNumber: data.scheduleNumber || crypto.randomUUID().slice(0, 8),
        missionId: missionId,
        name: data.name,
        description: data.description,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        // aircraftId: data.aircraftId,
        // instructorId: data.instructorId,
        // pilotId: data.pilotId,
        status: "draft",
        remarks: data.remarks,
        areaId: data.areaId,
      };

      const [created] = await tx
        .insert(missionScheduleTable)
        .values(values)
        .returning({ id: missionScheduleTable.id })!;

      if (!created) throw new Error("Something wrong"); // never gonna happen written to make typescript happy

      const scheduleNumber =
        data.scheduleNumber?.trim() || `${SCHEDULE_NUMBER_PREFIX}${created.id}`;

      if (!data.scheduleNumber?.trim()) {
        await tx
          .update(missionScheduleTable)
          .set({ scheduleNumber })
          .where(eq(missionScheduleTable.id, created.id));
      }
      let i = 0;
      for (const assignment of assignments) {
        await tx.insert(missionAssignmentTable).values({
          scheduleId: created.id,
          lineNumber: i++,
          ...assignment,
        });
      }

      return created;
    });

    return { id: res.id };
  }),

  update: protectedProcedure.input(updateSchema).mutation(async ({ input }) => {
    const { id, assignments, ...data } = input;
    await getScheduleOrThrow(id);

    await db.transaction(async (tx) => {
      const [updated] = await db
        .update(missionScheduleTable)
        .set({
          name: data.name,
          description: data.description,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime,
          // aircraftId: data.aircraftId,
          // instructorId: data.instructorId,
          // pilotId: data.pilotId,
          remarks: data.remarks,
          areaId: data.areaId,
        })
        .where(eq(missionScheduleTable.id, id))
        .returning({ id: missionScheduleTable.id });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event schedule not found",
        });
      }
      await db
        .delete(missionAssignmentTable)
        .where(eq(missionAssignmentTable.scheduleId, id));

      const personnelSet = new Set<number>();

      let i = 0;

      for (const assignment of assignments) {
        if (personnelSet.has(assignment.personnelId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Duplicate personnel in assignments list",
          });
        }

        personnelSet.add(assignment.personnelId);

        await db.insert(missionAssignmentTable).values({
          ...assignment,
          lineNumber: i++,
          scheduleId: id,
        });
      }
    });
  }),

  delete: protectedProcedure
    .input(z.object({ toDeleteId: z.number() }))
    .mutation(async ({ input }) => {
      await getScheduleOrThrow(input.toDeleteId);

      await db
        .delete(missionAssignmentTable)
        .where(eq(missionAssignmentTable.scheduleId, input.toDeleteId));

      const [deleted] = await db
        .delete(missionScheduleTable)
        .where(eq(missionScheduleTable.id, input.toDeleteId))
        .returning({ id: missionScheduleTable.id });

      return deleted;
    }),

  checkConflictingSchedule: protectedProcedure
    .input(
      z.object({
        personnelId: z.number(),
        startDateTime: z.coerce.date(),
        endDateTime: z.coerce.date(),
      }),
    )
    .query(async ({ input }) => {
      const { personnelId, startDateTime, endDateTime } = input;

      return scheduleService.chechConflictingSchedule(
        personnelId,
        startDateTime,
        endDateTime,
      );
    }),

  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: missionStatusSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const [schedule] = await db
        .select({
          status: missionScheduleTable.status,
        })
        .from(missionScheduleTable)
        .where(eq(missionScheduleTable.id, input.id))
        .limit(1);

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid Id, Schedule not found or deleted",
        });
      }

      if (schedule.status === input.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Status is already set to the same value",
        });
      }
      if (!isStatusChangeAllowed(schedule.status, input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Status change from ${schedule.status} to ${input.status} is not allowed`,
        });
      }

      const [updated] = await db
        .update(missionScheduleTable)
        .set({ status: input.status })
        .where(eq(missionScheduleTable.id, input.id))
        .returning({
          id: missionScheduleTable.id,
          status: missionScheduleTable.status,
        });

      return updated;
    }),

  getDasbhoardStats: protectedProcedure
    .input(
      z.object({
        personnelId: z.number().optional(),
        today: z.coerce.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return scheduleService.getPilotDashboardStats(
        input.personnelId || ctx.user.personnelId || 0,
        input.today.toISOString(),
      );
    }),
});

export default scheduleRouter;

const ALLOWED_STATUS_TRANSITIONS: Record<TMissionStatus, string[]> = {
  draft: ["published", "cancelled"],
  published: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
  in_progress: [],
};

function isStatusChangeAllowed(from: TMissionStatus, to: TMissionStatus) {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
