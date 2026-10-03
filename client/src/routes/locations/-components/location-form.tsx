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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'

const schema = z.object({
  id: z.number().optional(),
  code: z.string().min(1, 'Required').min(3).uppercase(),
  name: z.string().min(1, 'Required').min(2),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export type LocationFormData = z.infer<typeof schema>

export type LocationFormProps = {
  mode: 'create' | 'edit' | 'view'
  initialFormData?: LocationFormData
  // onSubmit: (data: LocationFormData) => void
  onClose: () => void
}

const titleMap = {
  create: 'New Location',
  edit: 'Edit Location',
  view: 'Location Details',
}

export default function LocationForm({
  mode,
  initialFormData = defaultFormData,
  onClose,
}: LocationFormProps) {
  const toEditId = initialFormData.id

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
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

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

  const readonly = mode === 'view'

  return (
    <Dialog
      open={true}
      onOpenChange={() => {
        if (mutation.isPending) return
        onClose()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="">
          <DialogTitle className=" uppercase">{titleMap[mode]}</DialogTitle>
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
                readOnly={readonly}
                placeholder="Must be unique and no spaces"
              />
            )}
          />

          <form.AppField
            name="name"
            children={(f) => (
              <f.CTextField
                required
                label="Location Name"
                readOnly={readonly}
              />
            )}
          />

          <form.AppField
            name="phone"
            children={(f) => (
              <f.CTextField
                label="Phone"
                placeholder="Enter optional phone number"
                readOnly={readonly}
              />
            )}
          />
          <form.AppField
            name="address"
            children={(f) => (
              <f.CTextAreaField
                label="Address"
                placeholder="Enter optional address"
                readOnly={readonly}
              />
            )}
          />
          <form.AppField
            name="description"
            children={(f) => (
              <f.CTextAreaField
                label="Note / Description"
                readOnly={readonly}
                placeholder="Enter optional note or description"
              />
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
              <form.SubscribeButton label="Save" />
            )}
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
