import { z } from "zod";

export const createSchema = z.object({
  name: z.string().trim().min(1),
  notes: z.string().trim().default(""),
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
