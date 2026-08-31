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
  code: z.string().min(1, 'Required').min(3).uppercase(),
  name: z.string().min(1, 'Required').min(3),
  description: z.string().optional(),
  address: z.string().optional(),
})

export type AreaFormData = z.infer<typeof schema>

export type AreaFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: AreaFormData
  onOpenChange: (open: boolean) => void
}

export default function AreaForm({
  mode,
  toEditId,
  initialFormData = defaultFormData,
  onOpenChange,
}: AreaFormProps) {
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
    mutationFn: async (data: AreaFormData) => {
      if (toEditId) {
        return trpcClient.areas.update.mutate({
          ...data,
          toEditId,
        })
      } else {
        return trpcClient.areas.create.mutate(data)
      }
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.areas.pathFilter())
      toast.success('Area Saved Successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const title = mode === 'create' ? 'New Area' : 'Edit Area'

  const validateCodeUnique = async ({ value }: { value: string }) => {
    try {
      const isCodeExists = await trpcClient.areas.isCodeExists.query({
        code: value,
        excludeId: toEditId,
      })
      if (isCodeExists) return 'Code already exists'
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
          <DialogTitle className=" uppercase">{title}</DialogTitle>
        </DialogHeader>
        <DialogMain className="grid gap-4">
          <form.AppField
            name="code"
            validators={{
              onBlurAsync: validateCodeUnique,
            }}
            children={(f) => (
              <f.CTextField
                valueAsUppercase
                required
                label="Area Code"
                placeholder="Must be unique and no spaces"
              />
            )}
          />
          <form.AppField
            name="name"
            children={(f) => <f.CTextField required label="Area Name" />}
          />
          <form.AppField
            name="address"
            children={(f) => <f.CTextAreaField label="Address" />}
          />
          <form.AppField
            name="description"
            children={(f) => <f.CTextAreaField label="Note Or Description" />}
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

const defaultFormData: AreaFormData = {
  name: '',
  description: '',
  code: '',
  address: '',
}
