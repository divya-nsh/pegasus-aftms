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
import trpc, { trpcClient } from '@/trpc'
import { revalidateLogic } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  tailNumber: z.string().min(1, 'Required'),
  serialNumber: z.string().optional(),
  aircraftType: z.string().optional(),
  inductionDate: z.string().optional(),
  remarks: z.string().optional(),
  status: z.string().optional(),
})

export type AircraftFormData = z.infer<typeof schema>

export type AircraftFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: AircraftFormData
  onClose: () => void
}

const aircraftTypeOptions = [
  { label: 'Trainer', value: 'trainer' },
  { label: 'Fighter', value: 'fighter' },
  { label: 'Transport', value: 'transport' },
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Grounded', value: 'grounded' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'In Storage', value: 'in_storage' },
  { label: 'Retired', value: 'retired' },
]

export default function AircraftForm({
  mode,
  toEditId,
  initialFormData,
  onClose,
}: AircraftFormProps) {
  const queryClient = useQueryClient()

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

  const mutation = useMutation({
    mutationFn: async (data: AircraftFormData) => {
      if (toEditId) {
        return trpcClient.aircraft.update.mutate({
          ...data,
          toEditId,
        })
      }
      return trpcClient.aircraft.create.mutate(data)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.aircraft.pathFilter())
      toast.success(
        mode === 'create' ? 'New Aircraft created' : 'Aircraft updated',
      )
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const title = mode === 'create' ? 'New Aircraft' : 'Edit Aircraft'

  return (
    <Dialog
      open={true}
      onOpenChange={() => {
        if (mutation.isPending) return
        onClose()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="uppercase">{title}</DialogTitle>
        </DialogHeader>
        <DialogMain className="grid grid-cols-2 gap-4">
          <form.AppField
            name="name"
            children={(f) => <f.CTextField required label="Name" />}
          />
          <form.AppField
            name="tailNumber"
            children={(f) => (
              <f.CTextField required label="Tail Number / Call Sign" />
            )}
          />
          <form.AppField
            name="serialNumber"
            children={(f) => <f.CTextField label="Serial Number" />}
          />
          <form.AppField
            name="aircraftType"
            children={(f) => (
              <f.CBasicSelect
                label="Aircraft Type"
                placeholder="Select aircraft type"
                options={aircraftTypeOptions}
              />
            )}
          />
          <form.AppField
            name="inductionDate"
            children={(f) => (
              <f.CTextField label="Induction Date" type="date" />
            )}
          />
          <form.AppField
            name="status"
            children={(f) => (
              <f.CBasicSelect
                label="Status"
                placeholder="Select status"
                options={statusOptions}
              />
            )}
          />
          <form.AppField
            name="remarks"
            children={(f) => (
              <f.CTextAreaField
                className="col-span-2"
                label="Remarks"
                placeholder="Enter optional remarks"
              />
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
