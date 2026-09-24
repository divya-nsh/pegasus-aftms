import { z } from "zod";

const optionalText = z.string().optional();
const optionalId = z.number().optional().nullable();

export const missionStatusSchema = z.enum([
  "draft",
  "published",
  "completed",
  "cancelled",
  "in_progress",
]);

export const assignmentGradeSchema = z.object({
  id: optionalId,
  gradingTemplateAttributeId: z.number(),
  gradingScaleOptionId: z.number().nullable(),
  obtainedScoreValue: z.number().nullable(),
  status: z.enum(["pending", "scored", "exempt"]),
});

export type TMissionStatus = z.infer<typeof missionStatusSchema>;

export const createSchema = z.object({
  missionId: z.number(),
  scheduleNumber: z.string().trim().optional(),
  name: z.string().min(1),
  description: optionalText,
  startDateTime: z.preprocess(
    (value) => (value === "" ? null : value),
    z.coerce.date().nullable().optional(),
  ),
  endDateTime: z.preprocess(
    (value) => (value === "" ? null : value),
    z.coerce.date().nullable().optional(),
  ),
  aircraftId: optionalId,
  areaId: optionalId,
  // Status can only be draft or published (in case for create *  published)
  status: z.enum(["draft", "published"]),
  // instructorId: optionalId,
  // pilotId: optionalId,
  remarks: optionalText,
  assignments: z.array(
    z.object({
      // id is optional for update
      id: optionalId,

      personnelId: z.number(),
      aircraftId: z.int().nullable(),
      attendanceStatus: z
        .enum(["present", "absent", "excused"])
        .nullable()
        .optional(),
      // score: z.number().int().min(0).max(100).nullable().optional(),
      aircraftTime: z.coerce.date().optional().nullable(),
      takeoffTime: z.coerce.date().optional().nullable(),
      landingTime: z.coerce.date().optional().nullable(),
      result: z.enum(["passed", "failed"]).nullable(),
      remarks: optionalText,
      obtainedGradeId: z.int().nullable(),
      obtainedScoreValue: z.number().nullable(),
      obtainedScorePercentage: z.number().min(0).max(100).nullable(),
      grades: z.array(assignmentGradeSchema).default([]),
    }),
  ),
});

export const updateSchema = createSchema.extend({
  id: z.number(),
});

export const updateAssignmentGradesSchema = z.object({
  scheduleId: z.number(),
  assignments: createSchema.shape.assignments,
});

const optionalDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.date().nullable().optional(),
);

export const updateAssignmentSchema = z.object({
  scheduleId: z.number(),
  assignmentId: z.number(),
  aircraftId: z.int().nullable(),
  attendanceStatus: z
    .enum(["present", "absent", "excused"])
    .nullable(),
  aircraftTime: optionalDate,
  takeoffTime: optionalDate,
  landingTime: optionalDate,
  remarks: optionalText,
  obtainedGradeId: z.int().nullable(),
  obtainedScoreValue: z.number().nullable(),
  obtainedScorePercentage: z.number().min(0).max(100).nullable(),
  grades: z.array(assignmentGradeSchema).default([]),
});
