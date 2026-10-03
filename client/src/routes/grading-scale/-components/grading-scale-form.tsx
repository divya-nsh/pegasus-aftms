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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { FieldError } from '@/components/ui/field'
import { ScaleOptionsLine } from './options-line'
import { Button } from '@/components/ui/button'

const scoreValue = z.number().min(0, 'Min 0').max(100, 'Max 100')

const optionSchema = z.object({
  id: z.number().optional().nullable(),
  label: z.string().trim().min(1, 'Required'),
  point: scoreValue,
  lowerBound: scoreValue,
  upperBound: scoreValue,
})

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Required').min(3),
  notes: z.string(),
  options: z.array(optionSchema).min(1, 'Add at least one option'),
})

export type GradingScaleOptionFormData = z.infer<typeof optionSchema>
export type GradingScaleFormData = z.infer<typeof schema>

export type GradingScaleFormProps = {
  mode: 'create' | 'edit' | 'view'
  initialFormData?: GradingScaleFormData
  onClose: () => void
}

const titleMap = {
  create: 'New Grading Scale',
  edit: 'Edit Grading Scale',
  view: 'Grading Scale Details',
}

export default function GradingScaleDialog({
  mode,
  initialFormData = defaultFormData,
  onClose,
}: GradingScaleFormProps) {
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
  const mutation = useMutation({
    mutationFn: async (data: GradingScaleFormData) => {
      if (data.id) {
        return trpcClient.gradingScale.update.mutate({
          ...data,
          toEditId: data.id,
        })
      }
      return trpcClient.gradingScale.create.mutate(data)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingScale.pathFilter())
      toast.success('Grading Scale Saved Successfully')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const validateNameUnique = async ({ value }: { value: string }) => {
    try {
      const isNameExists = await trpcClient.gradingScale.isNameExists.query({
        name: value,
        excludeId: initialFormData.id,
      })
      if (isNameExists) return 'Name already exists'
    } catch (error) {
      return getErrorMessage(error)
    }
  }

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
                label="Scale Name"
                placeholder="eg. ABCF Scale"
                readOnly={readonly}
              />
            )}
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
            name="options"
            children={(f) => (
              <>
                <ScaleOptionsLine
                  options={f.state.value}
                  setOptions={f.handleChange}
                  readonly={readonly}
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

const defaultFormData: GradingScaleFormData = {
  name: '',
  notes: '',
  options: [],
}
