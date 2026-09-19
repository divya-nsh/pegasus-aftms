import { z } from 'zod'

export const attributeSchema = z.object({
  attributeId: z
    .object({
      label: z.string(),
      value: z.number(),
    })
    .transform((data) => data.value),
  // weight: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
})

export const gradingTemplateSchema = z.object({
  name: z.string().min(1, 'Required').min(3),
  notes: z.string(),
  gradingScaleId: z
    .object({
      label: z.string(),
      value: z.number(),
    })
    .nullable()
    .refine((value) => value !== null, {
      message: 'Required',
    })
    .transform((data) => {
      return data.value
    }),
  attributes: z.array(attributeSchema).min(1, 'Add at least one attribute'),
})

export type GradingTemplateFormData = z.input<typeof gradingTemplateSchema>
export type AttributeFormData = z.input<typeof attributeSchema>
export type GradingTemplateFormSchemaOutput = z.infer<
  typeof gradingTemplateSchema
>
