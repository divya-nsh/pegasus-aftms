import db, { type DBTransaction } from "#/db/db.js";
import { SCHEDULE_NUMBER_PREFIX } from "#/config/constants.js";
import {
  missionScheduleParticipantGradingTable,
  missionScheduleParticipantTable,
  missionScheduleTable,
} from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import roleService from "../role/role.service.js";
import {
  createSchema,
  missionStatusSchema,
  updateAssignmentGradesSchema,
  updateAssignmentSchema,
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

const reinsertLineItems = async (
  tx: DBTransaction,
  missionScheduleId: number,
  payload: z.infer<typeof createSchema>["assignments"],
) => {
  const personnelSet = new Set<number>();

  // Delete all line Items for the schedule
  await tx
    .delete(missionScheduleParticipantTable)
    .where(
      eq(missionScheduleParticipantTable.missionScheduleId, missionScheduleId),
    );

  let i = 0;

  for (const assignment of payload) {
    if (personnelSet.has(assignment.personnelId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Duplicate personnel in assignments list",
      });
    }
    personnelSet.add(assignment.personnelId);

    const values: typeof missionScheduleParticipantTable.$inferInsert = {
      missionScheduleId,
      order: i++,
      personnelId: assignment.personnelId,
      aircraftId: assignment.aircraftId,
      attendanceStatus: assignment.attendanceStatus,
      aircraftTime: assignment.aircraftTime,
      takeoffTime: assignment.takeoffTime,
      landingTime: assignment.landingTime,
      briefingTime: assignment.briefingTime,
      remarks: assignment.remarks,
      obtainedGradeId: assignment.obtainedGradeId,
      obtainedScorePercentage: assignment.obtainedScorePercentage
        ? assignment.obtainedScorePercentage.toString()
        : null,
      obtainedScoreValue: assignment.obtainedScoreValue
        ? assignment.obtainedScoreValue.toString()
        : null,
    };

    const [inserted] = await tx
      .insert(missionScheduleParticipantTable)
      .values(values)
      .returning({ id: missionScheduleParticipantTable.id });

    const gradeSet = new Set<number>();
    for (const grade of assignment.grades) {
      if (gradeSet.has(grade.gradingTemplateAttributeId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicate grading template attribute in grades list",
        });
      }
      gradeSet.add(grade.gradingTemplateAttributeId);
    }

    if (assignment.grades.length > 0) {
      const gradeValues: (typeof missionScheduleParticipantGradingTable.$inferInsert)[] =
        assignment.grades.map((grade) => ({
          missionScheduleParticipantId: inserted!.id,
          gradingTemplateAttributeId: grade.gradingTemplateAttributeId,
          gradingScaleOptionId: grade.gradingScaleOptionId,
          obtainedScoreValue: grade.obtainedScoreValue?.toString() ?? null,
          status: grade.status,
          weightAtGrading: 100,
        }));
      await tx
        .insert(missionScheduleParticipantGradingTable)
        .values(gradeValues);
    }
  }
};

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
        includeParticipants: z.boolean().optional(),
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
          startDateTime: input.startDateTime
            ? {
                gte: input.startDateTime,
              }
            : undefined,
          endDateTime: input.endDateTime
            ? {
                lte: input.endDateTime,
              }
            : undefined,
        },
        extras: {
          assignmentsCount: (schedule) =>
            db.$count(
              missionScheduleParticipantTable,
              eq(
                missionScheduleParticipantTable.missionScheduleId,
                schedule.id,
              ),
            ),
        },
      });

      if (!input.includeParticipants || items.length === 0) {
        return {
          items: items.map((item) => ({
            ...item,
            assignments: [],
          })),
          totalCount: items.length,
        };
      }

      const participants =
        await db.query.missionScheduleParticipantTable.findMany({
          with: {
            personnel: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                code: true,
                personnelType: true,
              },
            },
          },
          where: {
            missionScheduleId: {
              in: items.map((item) => item.id),
            },
          },
          orderBy: {
            order: "asc",
          },
        });

      const assignmentsBySchedule = new Map<number, typeof participants>();
      for (const participant of participants) {
        const current = assignmentsBySchedule.get(
          participant.missionScheduleId,
        );
        if (current) {
          current.push(participant);
        } else {
          assignmentsBySchedule.set(participant.missionScheduleId, [
            participant,
          ]);
        }
      }

      return {
        items: items.map((item) => ({
          ...item,
          assignments: assignmentsBySchedule.get(item.id) ?? [],
        })),
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
              obtainedGrade: true,
              participantGradings: {
                with: {
                  gradingScaleOption: true,
                  gradingTemplateAttribute: {
                    with: {
                      gradingAttribute: true,
                    },
                  },
                },
              },
            },
            where: {
              personnelId: personnelId,
            },
            orderBy: {
              order: "asc",
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
    const { assignments, ...data } = input;

    const res = await db.transaction(async (tx) => {
      const values: typeof missionScheduleTable.$inferInsert = {
        scheduleNumber: data.scheduleNumber || crypto.randomUUID().slice(0, 8),
        missionId: data.missionId,
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
      await reinsertLineItems(tx, created.id, assignments);
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
        .delete(missionScheduleParticipantTable)
        .where(eq(missionScheduleParticipantTable.missionScheduleId, id));

      await reinsertLineItems(tx, id, assignments);
    });
  }),

  updateAssignmentGrades: protectedProcedure
    .input(updateAssignmentGradesSchema)
    .mutation(async ({ input }) => {
      await db.transaction(async (tx) => {
        await reinsertLineItems(tx, input.scheduleId, input.assignments);
      });
    }),

  updateAssignment: protectedProcedure
    .input(updateAssignmentSchema)
    .mutation(async ({ input }) => {
      const [participant] = await db
        .select()
        .from(missionScheduleParticipantTable)
        .where(
          and(
            eq(missionScheduleParticipantTable.id, input.assignmentId),
            eq(
              missionScheduleParticipantTable.missionScheduleId,
              input.scheduleId,
            ),
          ),
        );

      if (!participant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personnel assignment not found on this schedule",
        });
      }

      const gradeSet = new Set<number>();
      for (const grade of input.grades) {
        if (gradeSet.has(grade.gradingTemplateAttributeId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Duplicate grading template attribute in grades list",
          });
        }
        gradeSet.add(grade.gradingTemplateAttributeId);
      }

      const hasAircraft = input.aircraftId != null;
      const scoredStatus = deriveScoredStatus(input.grades);

      await db.transaction(async (tx) => {
        await tx
          .update(missionScheduleParticipantTable)
          .set({
            aircraftId: input.aircraftId,
            attendanceStatus: input.attendanceStatus,
            aircraftTime: hasAircraft ? (input.aircraftTime ?? null) : null,
            takeoffTime: hasAircraft ? (input.takeoffTime ?? null) : null,
            landingTime: hasAircraft ? (input.landingTime ?? null) : null,
            briefingTime: input.briefingTime,
            remarks: input.remarks,
            obtainedGradeId: input.obtainedGradeId,
            obtainedScoreValue:
              input.obtainedScoreValue != null
                ? input.obtainedScoreValue.toString()
                : null,
            obtainedScorePercentage:
              input.obtainedScorePercentage != null
                ? input.obtainedScorePercentage.toString()
                : null,
            scoredStatus,
          })
          .where(eq(missionScheduleParticipantTable.id, input.assignmentId));

        await tx
          .delete(missionScheduleParticipantGradingTable)
          .where(
            eq(
              missionScheduleParticipantGradingTable.missionScheduleParticipantId,
              input.assignmentId,
            ),
          );

        if (input.grades.length > 0) {
          await tx.insert(missionScheduleParticipantGradingTable).values(
            input.grades.map((grade) => ({
              missionScheduleParticipantId: input.assignmentId,
              gradingTemplateAttributeId: grade.gradingTemplateAttributeId,
              gradingScaleOptionId: grade.gradingScaleOptionId,
              obtainedScoreValue: grade.obtainedScoreValue?.toString() ?? null,
              status: grade.status,
              weightAtGrading: 100,
            })),
          );
        }
      });
    }),

  delete: protectedProcedure
    .input(z.object({ toDeleteId: z.number() }))
    .mutation(async ({ input }) => {
      await getScheduleOrThrow(input.toDeleteId);

      await db
        .delete(missionScheduleParticipantTable)
        .where(
          eq(
            missionScheduleParticipantTable.missionScheduleId,
            input.toDeleteId,
          ),
        );

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

function deriveScoredStatus(
  grades: { status: "pending" | "scored" | "exempt" }[],
) {
  if (grades.length === 0) return "pending" as const;
  if (grades.every((grade) => grade.status === "exempt")) {
    return "exempt" as const;
  }
  if (
    grades.every(
      (grade) => grade.status === "scored" || grade.status === "exempt",
    )
  ) {
    return "scored" as const;
  }
  return "pending" as const;
}
