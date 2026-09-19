import { z } from "zod";

const attributeSchema = z.object({
  attributeId: z.int().positive(),
  weight: z.int().min(1).max(100).default(100),
});

export const createSchema = z.object({
  name: z.string().trim().min(1),
  notes: z.string().trim().default(""),
  gradingScaleId: z.int().min(1, "Required"),
  attributes: z.array(attributeSchema).min(1),
});

export const updateSchema = createSchema.extend({
  toEditId: z.int(),
});

export const idSchema = z.object({
  id: z.int(),
});

export const isNameExistsSchema = z.object({
  name: z.string(),
  excludeId: z.int().optional(),
});
