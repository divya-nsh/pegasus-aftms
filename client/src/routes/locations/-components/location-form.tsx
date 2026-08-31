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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(1, 'Required').min(3).uppercase(),
  name: z.string().min(1, 'Required').min(2),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export type LocationFormData = z.infer<typeof schema>

export type LocationFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: LocationFormData
  // onSubmit: (data: LocationFormData) => void
  onOpenChange: (open: boolean) => void
}

export default function LocationForm({
  mode,
  toEditId,
  initialFormData = defaultFormData,
  onOpenChange,
}: LocationFormProps) {
  const form = useAppForm({
    defaultValues: initialFormData,
    validators: {
      onSubmit: schema,
    },
    onSubmit: ({ value }) => mutation.mutateAsync(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      if (toEditId) {
        return trpcClient.locations.update.mutate({
          ...data,
          toEditId,
        })
      } else {
        return trpcClient.locations.create.mutate(data)
      }
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.locations.pathFilter())
      toast.success('Location Saved Successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const title = mode === 'create' ? 'New Location' : 'Edit Location'

  const validateCodeUnique = async ({ value }: { value: string }) => {
    try {
      const isCodeExists = await trpcClient.locations.isCodeExists.query({
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="">
          <DialogTitle className=" uppercase">{title}</DialogTitle>
          {/* <DialogDescription>{description}</DialogDescription> */}
        </DialogHeader>
        <DialogMain className="grid gap-4">
          <form.AppField
            name="code"
            validators={{
              onBlurAsync: validateCodeUnique,
              onSubmitAsync: validateCodeUnique,
            }}
            children={(f) => (
              <f.CTextField
                valueAsUppercase
                required
                label="Location Code"
                placeholder="Must be unique and no spaces"
              />
            )}
          />

          <form.AppField
            name="name"
            children={(f) => <f.CTextField required label="Location Name" />}
          />

          <form.AppField
            name="phone"
            children={(f) => (
              <f.CTextField
                label="Phone"
                placeholder="Enter optional phone number"
              />
            )}
          />
          <form.AppField
            name="address"
            children={(f) => (
              <f.CTextAreaField
                label="Address"
                placeholder="Enter optional address"
              />
            )}
          />
          <form.AppField
            name="description"
            children={(f) => (
              <f.CTextAreaField
                label="Note / Description"
                placeholder="Enter optional note or description"
              />
            )}
          />
        </DialogMain>

        <DialogFooter>
          <form.AppForm>
            <form.SubscribeButton label="Save" />
          </form.AppForm>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const defaultFormData: LocationFormData = {
  name: '',
  description: '',
  code: '',
  address: '',
  phone: '',
}
