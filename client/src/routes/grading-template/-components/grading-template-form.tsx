import {
  baseFormOptions,
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogMain,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/utils'
import trpc, { trpcClient } from '@/trpc'
import { revalidateLogic } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { FieldError } from '@/components/ui/field'
import { TemplateAttributesLine } from './attributes-line'
import { useMemo } from 'react'

const attributeSchema = z.object({
  attributeId: z
    .object({
      label: z.string(),
      value: z.number(),
    })
    .transform((data) => data.value),
  // weight: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
})

const schema = z.object({
  name: z.string().min(1, 'Required').min(3),
  notes: z.string(),
  gradingScaleId: z
    .object({
      label: z.string(),
      value: z.number(),
    })
    .transform((data) => data.value),
  attributes: z.array(attributeSchema).min(1, 'Add at least one attribute'),
})

export type GradingTemplateFormData = z.input<typeof schema>

export type GradingTemplateFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: GradingTemplateFormData
  onOpenChange: (open: boolean) => void
}

export default function GradingTemplateDialog({
  mode,
  toEditId,
  initialFormData = defaultFormData,
  onOpenChange,
}: GradingTemplateFormProps) {
  const form = useAppForm({
    ...baseFormOptions,
    defaultValues: initialFormData,
    validators: {
      onDynamic: schema,
    },
    onSubmit: ({ value }) => {
      const data = schema.parse(value)
      mutation.mutateAsync(data)
    },
  })

  const queryClient = useQueryClient()
  const gradingScaleQ = useQuery(trpc.gradingScale.getAll.queryOptions())
  const gradingAttributeQ = useQuery(
    trpc.gradingAttribute.getAll.queryOptions(),
  )

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      if (toEditId) {
        return trpcClient.gradingTemplate.update.mutate({
          ...data,
          toEditId,
        })
      }
      return trpcClient.gradingTemplate.create.mutate(data)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingTemplate.pathFilter())
      toast.success('Grading Template Saved Successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const title =
    mode === 'create' ? 'New Grading Template' : 'Edit Grading Template'

  const validateNameUnique = async ({ value }: { value: string }) => {
    try {
      const isNameExists = await trpcClient.gradingTemplate.isNameExists.query({
        name: value,
        excludeId: toEditId,
      })
      if (isNameExists) return 'Name already exists'
    } catch (error) {
      return getErrorMessage(error)
    }
  }

  const scaleOptions = useMemo(() => {
    return (
      gradingScaleQ.data?.items.map((scale) => ({
        label: scale.name,
        value: scale.id,
      })) ?? []
    )
  }, [gradingScaleQ.data])

  return (
    <Dialog
      open={true}
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="min-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogMain className=" space-y-4">
          <form.AppField
            name="name"
            validators={{
              onBlurAsync: validateNameUnique,
            }}
            children={(f) => (
              <f.CTextField
                required
                label="Template Name"
                placeholder="eg. Basic Flight Evaluation"
              />
            )}
          />
          <form.Subscribe
            selector={(state) => state.values.gradingScaleId}
            children={() => {
              return (
                <form.AppField
                  name="gradingScaleId"
                  children={(f) => (
                    <f.CComboboxField
                      required
                      label="Grading Scale"
                      placeholder="Select grading scale"
                      items={scaleOptions}
                      description={`This will be used to grade the attributes.`}
                    />
                  )}
                />
              )
            }}
          />

          <form.AppField
            name="notes"
            children={(f) => (
              <f.CTextAreaField
                label="Description"
                placeholder="Optional description or any notes"
              />
            )}
          />

          <form.AppField
            name="attributes"
            children={(f) => (
              <>
                <TemplateAttributesLine
                  attributes={f.state.value}
                  setAttributes={f.handleChange}
                />
                <FieldError errors={f.state.meta.errors} />
              </>
            )}
          />
        </DialogMain>
        <DialogFooter>
          <form.AppForm>
            <form.SubscribeButton
              label={mode === 'create' ? 'Create' : 'Update'}
            />
          </form.AppForm>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const defaultFormData: GradingTemplateFormData = {
  name: '',
  notes: '',
  gradingScaleId: null as any,
  attributes: [],
}
