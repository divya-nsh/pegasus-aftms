import {
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import { Button } from '@/components/ui/button'
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
  id: z.number().optional(),
  name: z.string().min(1, 'Required').min(3),
  notes: z.string().optional(),
})

export type GradingAttributeFormData = z.infer<typeof schema>

export type GradingAttributeFormProps = {
  mode: 'create' | 'edit' | 'view'
  initialFormData?: GradingAttributeFormData
  onClose: () => void
}

const titles = {
  singular: 'Grading Attribute',
  create: 'New Grading Attribute',
  edit: 'Edit Grading Attribute',
  view: 'Grading Attribute Details',
}

export default function GradingAttributeDialog({
  mode,
  initialFormData = defaultFormData,
  onClose,
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
      if (data.id) {
        return trpcClient.gradingAttribute.update.mutate({
          ...data,
          toEditId: data.id,
        })
      } else {
        return trpcClient.gradingAttribute.create.mutate(data)
      }
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingAttribute.pathFilter())
      toast.success('Grading Attribute Saved Successfully')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const validateNameUnique = async ({ value }: { value: string }) => {
    try {
      const isNameExists = await trpcClient.gradingAttribute.isNameExists.query(
        {
          name: value,
          excludeId: initialFormData.id,
        },
      )
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="">
          <DialogTitle className=" ">{titles[mode]}</DialogTitle>
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
        </DialogMain>
        <DialogFooter>
          {readonly ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <form.AppForm>
              <form.SubscribeButton
                label={mode === 'create' ? 'Create' : 'Update'}
              />
            </form.AppForm>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const defaultFormData: GradingAttributeFormData = {
  name: '',
  notes: '',
}
