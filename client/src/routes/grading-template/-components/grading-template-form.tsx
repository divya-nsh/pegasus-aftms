import { baseFormOptions, useAppForm } from '@/components/form/tanstack-form'
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FieldError } from '@/components/ui/field'
import { TemplateAttributesLine } from './attributes-line'
import { useMemo } from 'react'
import { gradingTemplateSchema } from './schema'
import type {
  GradingTemplateFormData,
  GradingTemplateFormSchemaOutput,
} from './schema'
import { Button } from '@/components/ui/button'

export type GradingTemplateFormProps = {
  mode: 'create' | 'edit' | 'view'
  initialFormData?: GradingTemplateFormData
  onClose: () => void
}

const titleMap = {
  create: 'New Grading Template',
  edit: 'Edit Grading Template',
  view: 'Grading Template Details',
}

export default function GradingTemplateDialog({
  mode,
  initialFormData = defaultFormData,
  onClose,
}: GradingTemplateFormProps) {
  const form = useAppForm({
    ...baseFormOptions,
    defaultValues: initialFormData,
    validators: {
      onDynamic: gradingTemplateSchema,
    },
    onSubmit: ({ value }) => {
      const data = gradingTemplateSchema.parse(value)
      mutation.mutateAsync(data)
    },
  })

  const queryClient = useQueryClient()
  const gradingScaleQ = useQuery(trpc.gradingScale.getAll.queryOptions())

  const mutation = useMutation({
    mutationFn: async (data: GradingTemplateFormSchemaOutput) => {
      if (data.id) {
        return trpcClient.gradingTemplate.update.mutate({
          ...data,
          toEditId: data.id,
        })
      }
      return trpcClient.gradingTemplate.create.mutate(data)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingTemplate.pathFilter())
      toast.success('Grading Template Saved Successfully')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const validateNameUnique = async ({ value }: { value: string }) => {
    try {
      const isNameExists = await trpcClient.gradingTemplate.isNameExists.query({
        name: value,
        excludeId: initialFormData.id,
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

  const readonly = mode === 'view'

  return (
    <Dialog
      open={true}
      onOpenChange={() => {
        if (mutation.isPending) return
        onClose()
      }}
    >
      <DialogContent className="min-w-xl">
        <DialogHeader>
          <DialogTitle>{titleMap[mode]}</DialogTitle>
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
                readOnly={readonly}
              />
            )}
          />
          <form.Subscribe
            selector={(state) => state.values.gradingScaleId}
            children={(gradingScaleId) => {
              const selectedScale = gradingScaleQ.data?.items.find(
                (scale) => scale.id === gradingScaleId?.value,
              )

              return (
                <form.AppField
                  name="gradingScaleId"
                  children={(f) => (
                    <f.CComboboxField
                      required
                      label="Grading Scale"
                      items={scaleOptions}
                      readOnly={readonly}
                      description={
                        selectedScale
                          ? `Grades: ${selectedScale.options.map((o) => `${o.label} (${+o.upperBound} - ${+o.lowerBound})`).join(', ')}`
                          : `This will be used to grade the attributes.`
                      }
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
                readOnly={readonly}
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
                  readOnly={readonly}
                />
                <FieldError errors={f.state.meta.errors} />
              </>
            )}
          />
        </DialogMain>
        <DialogFooter>
          <form.AppForm>
            {readonly ? (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            ) : (
              <form.SubscribeButton
                label={mode === 'create' ? 'Create' : 'Save'}
              />
            )}
          </form.AppForm>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const defaultFormData: GradingTemplateFormData = {
  name: '',
  notes: '',
  gradingScaleId: null,
  attributes: [],
}
