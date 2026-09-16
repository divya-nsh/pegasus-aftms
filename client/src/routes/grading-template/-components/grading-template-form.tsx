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

const attributeSchema = z.object({
  attributeId: z.number().min(1, 'Required'),
  weight: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
})

const schema = z.object({
  name: z.string().min(1, 'Required').min(3),
  notes: z.string(),
  gradingScaleId: z.number().min(1, 'Required'),
  attributes: z.array(attributeSchema).min(1, 'Add at least one attribute'),
})

export type GradingTemplateFormData = z.infer<typeof schema>

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
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
      onSubmit: schema,
    },
    onSubmit: ({ value }) => mutation.mutateAsync(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  const queryClient = useQueryClient()
  const gradingScaleQ = useQuery(trpc.gradingScale.getAll.queryOptions())
  const gradingAttributeQ = useQuery(
    trpc.gradingAttribute.getAll.queryOptions(),
  )

  const mutation = useMutation({
    mutationFn: async (data: GradingTemplateFormData) => {
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

  const scaleOptions =
    gradingScaleQ.data?.items.map((scale) => ({
      label: scale.name,
      value: scale.id,
    })) ?? []

  const attributeOptions =
    gradingAttributeQ.data?.items.map((attribute) => ({
      label: attribute.name,
      value: attribute.id,
    })) ?? []

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
            name="gradingScaleId"
            children={(f) => (
              <f.CBasicSelect
                required
                allowClear={false}
                valueAsNumber
                label="Grading Scale"
                placeholder="Select grading scale"
                options={scaleOptions}
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
                  attributeOptions={attributeOptions}
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
  gradingScaleId: NaN,
  attributes: [],
}
