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

export type TMissionStatus = z.infer<typeof missionStatusSchema>;

export const createSchema = z.object({
  missionId: z.number(),
  scheduleNumber: optionalText,
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
  instructorId: optionalId,
  pilotId: optionalId,
  remarks: optionalText,
  assigments: z.array(
    z.object({
      personnelId: z.number(),
      remarks: optionalText,
      aircraftId: optionalId,
    }),
  ),
});

export const updateSchema = createSchema.extend({
  id: z.number(),
  assingments: z.object({
    personnelId: z.number(),
    attendanceStatus: z
      .enum(["present", "absent", "excused"])
      .nullable()
      .optional(),
    score: z.number().int().min(0).max(100).optional(),
    aircraftId: z.int().optional(),
    aircraftTime: z.coerce.date().optional(),
    takeoffTime: z.coerce.date().optional(),
    landingTime: z.coerce.date().optional(),
    result: z.enum(["passed", "failed"]).nullable(),
    remarks: optionalText,
  }),
});
