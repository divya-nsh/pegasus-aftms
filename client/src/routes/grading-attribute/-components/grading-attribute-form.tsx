import {
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

const schema = z.object({
  name: z.string().min(1, 'Required').min(3),
  notes: z.string().optional(),
})

export type GradingAttributeFormData = z.infer<typeof schema>

export type GradingAttributeFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: GradingAttributeFormData
  onOpenChange: (open: boolean) => void
}

export default function GradingAttributeDialog({
  mode,
  toEditId,
  initialFormData = defaultFormData,
  onOpenChange,
}: GradingAttributeFormProps) {
  const form = useAppForm({
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
    mutationFn: async (data: GradingAttributeFormData) => {
      if (toEditId) {
        return trpcClient.gradingAttribute.update.mutate({
          ...data,
          toEditId,
        })
      } else {
        return trpcClient.gradingAttribute.create.mutate(data)
      }
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingAttribute.pathFilter())
      toast.success('Grading Attribute Saved Successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const title =
    mode === 'create' ? 'New Grading Attribute' : 'Edit Grading Attribute'

  const validateNameUnique = async ({ value }: { value: string }) => {
    try {
      const isNameExists = await trpcClient.gradingAttribute.isNameExists.query(
        {
          name: value,
          excludeId: toEditId,
        },
      )
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="">
          <DialogTitle className=" ">{title}</DialogTitle>
        </DialogHeader>
        <DialogMain className="grid gap-4">
          <form.AppField
            name="name"
            validators={{
              onBlurAsync: validateNameUnique,
            }}
            children={(f) => (
              <f.CTextField
                required
                label="Grading Attribute"
                placeholder="eg. Endurance, Knowledge, etc."
              />
            )}
          />
          <form.AppField
            name="notes"
            children={(f) => (
              <f.CTextAreaField label="Notes" placeholder="Optional notes" />
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

const defaultFormData: GradingAttributeFormData = {
  name: '',
  notes: '',
}
