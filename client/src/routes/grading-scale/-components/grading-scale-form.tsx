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

const scoreValue = z.number().min(0, 'Min 0').max(100, 'Max 100')

const optionSchema = z.object({
  label: z.string().trim().min(1, 'Required'),
  point: scoreValue,
  lowerBound: scoreValue,
  upperBound: scoreValue,
})

const schema = z.object({
  name: z.string().min(1, 'Required').min(3),
  notes: z.string(),
  options: z.array(optionSchema).min(1, 'Add at least one option'),
})

export type GradingScaleOptionFormData = z.infer<typeof optionSchema>
export type GradingScaleFormData = z.infer<typeof schema>

export type GradingScaleFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: GradingScaleFormData
  onOpenChange: (open: boolean) => void
}

export default function GradingScaleDialog({
  mode,
  toEditId,
  initialFormData = defaultFormData,
  onOpenChange,
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
      if (toEditId) {
        return trpcClient.gradingScale.update.mutate({
          ...data,
          toEditId,
        })
      }
      return trpcClient.gradingScale.create.mutate(data)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingScale.pathFilter())
      toast.success('Grading Scale Saved Successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const title = mode === 'create' ? 'New Grading Scale' : 'Edit Grading Scale'

  const validateNameUnique = async ({ value }: { value: string }) => {
    try {
      const isNameExists = await trpcClient.gradingScale.isNameExists.query({
        name: value,
        excludeId: toEditId,
      })
      if (isNameExists) return 'Name already exists'
    } catch (error) {
      return getErrorMessage(error)
    }
  }

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
                label="Scale Name"
                placeholder="eg. ABCF Scale"
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
            name="options"
            children={(f) => (
              <>
                <ScaleOptionsLine
                  options={f.state.value}
                  setOptions={f.handleChange}
                />
                <FieldError errors={f.state.meta.errors} />
              </>
            )}
          />
        </DialogMain>
        <DialogFooter>
          <form.AppForm>
            <form.SubscribeButton
              label={mode === 'create' ? 'Create' : 'Save'}
            />
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
