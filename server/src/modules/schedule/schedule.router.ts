import db from "#/db/db.js";
import { SCHEDULE_NUMBER_PREFIX } from "#/config/constants.js";
import {
  aircraftTable,
  areaTable,
  missionAssignmentTable,
  missionScheduleTable,
  missionTable,
  personnelTable,
} from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import userService from "../user/user.service.js";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, exists, gte, lte, ne, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import roleService from "../role/role.service.js";

const optionalText = z.string().optional();
const optionalId = z.number().optional().nullable();

const missionStatusSchema = z.enum([
  "draft",
  "published",
  "in_progress",
  "completed",
  "cancelled",
]);

type MissionStatus = z.infer<typeof missionStatusSchema>;

const ALLOWED_STATUS_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  draft: ["published", "cancelled"],
  published: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

const headerSchema = z.object({
  scheduleNumber: optionalText,
  name: z.string().min(1),
  description: optionalText,
  startDateTime: optionalText,
  endDateTime: optionalText,
  aircraftId: optionalId,
  areaId: optionalId,
  instructorId: optionalId,
  pilotId: optionalId,
  remarks: optionalText,
});

const createSchema = headerSchema.extend({
  missionId: z.number(),
  traineeIds: z.array(z.number()).default([]),
});

const updateSchema = headerSchema.extend({
  toEditId: z.number(),
});

const lineRowSchema = z.object({
  personId: z.number(),
  attendanceStatus: z
    .enum(["pending", "present", "absent", "excused"])
    .default("pending"),
  score: z.number().int().min(0).max(100).optional(),
  result: z.enum(["pending", "passed", "failed"]).default("pending"),
  remarks: optionalText,
});

const toDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toScheduleValues = (input: z.infer<typeof headerSchema>) => ({
  scheduleNumber: input.scheduleNumber?.trim() || undefined,
  name: input.name,
  description: input.description,
  startDateTime: toDate(input.startDateTime),
  endDateTime: toDate(input.endDateTime),
  aircraftId: input.aircraftId,
  areaId: input.areaId,
  instructorId: input.instructorId,
  pilotId: input.pilotId,
  remarks: input.remarks,
});

const instructorTable = alias(personnelTable, "schedule_instructor");
const pilotTable = alias(personnelTable, "schedule_pilot");
const traineeTable = alias(personnelTable, "schedule_trainee");

async function getScheduleOrThrow(id: number) {
  const [row] = await db
    .select()
    .from(missionScheduleTable)
    .where(eq(missionScheduleTable.id, id));
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Mission schedule not found",
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
      message: "Mission not found",
    });
  }
  return row;
}

async function replaceTrainees(scheduleId: number, traineeIds: number[]) {
  await db
    .delete(missionAssignmentTable)
    .where(eq(missionAssignmentTable.scheduleId, scheduleId));

  const uniqueIds = [...new Set(traineeIds)];
  if (uniqueIds.length === 0) return;

  await db.insert(missionAssignmentTable).values(
    uniqueIds.map((personId) => ({
      scheduleId,
      personId,
    })),
  );
}

const scheduleRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        status: missionStatusSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const scope = roleService.canDo(ctx.user.role || "", "schedule", "view");
      if (!scope) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view schedules",
        });
      }

      const conditions: SQL[] = [];

      if (scope === "assigned" && ctx.user.personnelId != null) {
        conditions.push(ne(missionScheduleTable.status, "draft"));
        conditions.push(
          exists(
            db
              .select({ id: missionAssignmentTable.id })
              .from(missionAssignmentTable)
              .where(
                and(
                  eq(
                    missionAssignmentTable.scheduleId,
                    missionScheduleTable.id,
                  ),
                  eq(missionAssignmentTable.personId, ctx.user.personnelId),
                ),
              ),
          ),
        );
      }

      if (input.status) {
        conditions.push(eq(missionScheduleTable.status, input.status));
      }

      const items = await db
        .select({
          id: missionScheduleTable.id,
          scheduleNumber: missionScheduleTable.scheduleNumber,
          name: missionScheduleTable.name,
          status: missionScheduleTable.status,
          startDateTime: missionScheduleTable.startDateTime,
          endDateTime: missionScheduleTable.endDateTime,
          remarks: missionScheduleTable.remarks,
          createdAt: missionScheduleTable.createdAt,
          updatedAt: missionScheduleTable.updatedAt,
          missionId: missionScheduleTable.missionId,
          missionName: missionTable.name,
          durationMinutes: missionTable.durationMinutes,
          aircraftName: aircraftTable.name,
          aircraftTailNumber: aircraftTable.tailNumber,
          areaName: areaTable.name,
          instructorFirstName: instructorTable.firstName,
          instructorLastName: instructorTable.lastName,
          pilotFirstName: pilotTable.firstName,
          pilotLastName: pilotTable.lastName,
        })
        .from(missionScheduleTable)
        .leftJoin(
          missionTable,
          eq(missionScheduleTable.missionId, missionTable.id),
        )
        .leftJoin(
          aircraftTable,
          eq(missionScheduleTable.aircraftId, aircraftTable.id),
        )
        .leftJoin(areaTable, eq(missionScheduleTable.areaId, areaTable.id))
        .leftJoin(
          instructorTable,
          eq(missionScheduleTable.instructorId, instructorTable.id),
        )
        .leftJoin(pilotTable, eq(missionScheduleTable.pilotId, pilotTable.id))
        .where(and(...conditions))
        .orderBy(desc(missionScheduleTable.id));

      return {
        items: items,
        totalCount: items.length,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select({
          id: missionScheduleTable.id,
          missionId: missionScheduleTable.missionId,
          scheduleNumber: missionScheduleTable.scheduleNumber,
          name: missionScheduleTable.name,
          description: missionScheduleTable.description,
          status: missionScheduleTable.status,
          startDateTime: missionScheduleTable.startDateTime,
          endDateTime: missionScheduleTable.endDateTime,
          remarks: missionScheduleTable.remarks,
          aircraftId: missionScheduleTable.aircraftId,
          areaId: missionScheduleTable.areaId,
          instructorId: missionScheduleTable.instructorId,
          pilotId: missionScheduleTable.pilotId,
          createdAt: missionScheduleTable.createdAt,
          updatedAt: missionScheduleTable.updatedAt,
          missionName: missionTable.name,
          durationMinutes: missionTable.durationMinutes,
          aircraftName: aircraftTable.name,
          aircraftTailNumber: aircraftTable.tailNumber,
          areaName: areaTable.name,
          instructorFirstName: instructorTable.firstName,
          instructorLastName: instructorTable.lastName,
          pilotFirstName: pilotTable.firstName,
          pilotLastName: pilotTable.lastName,
        })
        .from(missionScheduleTable)
        .leftJoin(
          missionTable,
          eq(missionScheduleTable.missionId, missionTable.id),
        )
        .leftJoin(
          aircraftTable,
          eq(missionScheduleTable.aircraftId, aircraftTable.id),
        )
        .leftJoin(areaTable, eq(missionScheduleTable.areaId, areaTable.id))
        .leftJoin(
          instructorTable,
          eq(missionScheduleTable.instructorId, instructorTable.id),
        )
        .leftJoin(pilotTable, eq(missionScheduleTable.pilotId, pilotTable.id))
        .where(eq(missionScheduleTable.id, input.id));

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mission schedule not found",
        });
      }

      const assignments = await db
        .select({
          id: missionAssignmentTable.id,
          personId: missionAssignmentTable.personId,
          attendanceStatus: missionAssignmentTable.attendanceStatus,
          remarks: missionAssignmentTable.remarks,
          score: missionAssignmentTable.score,
          result: missionAssignmentTable.result,
          firstName: personnelTable.firstName,
          lastName: personnelTable.lastName,
          code: personnelTable.code,
          rank: personnelTable.rank,
          personnelType: personnelTable.personnelType,
          batchNo: personnelTable.batchNo,
        })
        .from(missionAssignmentTable)
        .leftJoin(
          personnelTable,
          eq(missionAssignmentTable.personId, personnelTable.id),
        )
        .where(eq(missionAssignmentTable.scheduleId, input.id));

      const { isTrainee, personnelId } = await getTraineeScope(ctx.user.id);
      if (isTrainee) {
        const isAssigned = assignments.some(
          (assignment) => assignment.personId === personnelId,
        );
        if (!isAssigned) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Mission schedule not found",
          });
        }
      }

      return {
        ...row,
        assignments,
      };
    }),

  create: protectedProcedure.input(createSchema).mutation(async ({ input }) => {
    const { traineeIds, missionId, ...data } = input;
    const mission = await getMissionOrThrow(missionId);

    const [created] = await db
      .insert(missionScheduleTable)
      .values({
        missionId,
        ...toScheduleValues(data),
        aircraftId: data.aircraftId ?? mission.aircraftId,
      })
      .returning({ id: missionScheduleTable.id });

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create mission schedule",
      });
    }

    const scheduleNumber =
      data.scheduleNumber?.trim() || `${SCHEDULE_NUMBER_PREFIX}${created.id}`;

    if (!data.scheduleNumber?.trim()) {
      await db
        .update(missionScheduleTable)
        .set({ scheduleNumber })
        .where(eq(missionScheduleTable.id, created.id));
    }

    await replaceTrainees(created.id, traineeIds);
    return { id: created.id, scheduleNumber };
  }),

  update: protectedProcedure.input(updateSchema).mutation(async ({ input }) => {
    const { toEditId, ...data } = input;
    await getScheduleOrThrow(toEditId);

    const [updated] = await db
      .update(missionScheduleTable)
      .set(toScheduleValues(data))
      .where(eq(missionScheduleTable.id, toEditId))
      .returning({ id: missionScheduleTable.id });

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mission schedule not found",
      });
    }

    return updated;
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

  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: missionStatusSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const schedule = await getScheduleOrThrow(input.id);
      const allowed = ALLOWED_STATUS_TRANSITIONS[schedule.status];

      if (!allowed.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot change status from ${schedule.status} to ${input.status}`,
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

  saveLine: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        trainees: z.array(lineRowSchema),
      }),
    )
    .mutation(async ({ input }) => {
      await getScheduleOrThrow(input.id);

      const existing = await db
        .select()
        .from(missionAssignmentTable)
        .where(eq(missionAssignmentTable.scheduleId, input.id));

      const incomingPersonIds = new Set(
        input.trainees.map((row) => row.personId),
      );

      for (const row of existing) {
        if (row.personId == null || !incomingPersonIds.has(row.personId)) {
          await db
            .delete(missionAssignmentTable)
            .where(eq(missionAssignmentTable.id, row.id));
        }
      }

      for (const row of input.trainees) {
        const found = existing.find((item) => item.personId === row.personId);
        const values = {
          attendanceStatus: row.attendanceStatus,
          score: row.score,
          result: row.result,
          remarks: row.remarks,
        };

        if (found) {
          await db
            .update(missionAssignmentTable)
            .set(values)
            .where(eq(missionAssignmentTable.id, found.id));
        } else {
          await db.insert(missionAssignmentTable).values({
            scheduleId: input.id,
            personId: row.personId,
            ...values,
          });
        }
      }

      return { id: input.id };
    }),
});

export default scheduleRouter;
