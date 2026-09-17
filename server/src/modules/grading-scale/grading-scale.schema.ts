import { z } from "zod";

const scoreValue = z.coerce.number().min(0).max(100);

const optionSchema = z.object({
  id: z.number().nullable().default(null),
  label: z.string().trim().min(1),
  point: scoreValue,
  lowerBound: scoreValue,
  upperBound: scoreValue,
});

export const createSchema = z.object({
  name: z.string().trim().min(1),
  notes: z.string().trim().default(""),
  options: z.array(optionSchema).min(1),
});

export const updateSchema = createSchema.extend({
  toEditId: z.number(),
});

export const idSchema = z.object({
  id: z.number(),
});

export const isNameExistsSchema = z.object({
  name: z.string(),
  excludeId: z.number().optional(),
});
