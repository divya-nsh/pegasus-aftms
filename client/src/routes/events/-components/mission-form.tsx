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
import { FieldColumns } from '@/components/ui/field'
import trpc, { trpcClient } from '@/trpc'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { defaultMissionTypeId, missionTypeOptions } from '@repo/shared'
import toast from 'react-hot-toast'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Required').min(3),
  description: z.string(),
  aircraftId: z.number().nullable(),
  gradingTemplateId: z.number().nullable(),
  durationMinutes: z.number().nullable(),
  missionType: z.string().min(1, 'Required'),
})

export type MissionFormData = z.infer<typeof schema>

export type MissionFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: MissionFormData
  onClose: (open: boolean) => void
}

export default function MissionForm({
  mode,
  toEditId,
  initialFormData,
  onClose,
}: MissionFormProps) {
  const queryClient = useQueryClient()
  const aircraftQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())
  const gradingTemplateQ = useSuspenseQuery(
    trpc.gradingTemplate.getAll.queryOptions(),
  )

  const form = useAppForm({
    defaultValues: initialFormData ?? defaultValues,
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => mutation.mutateAsync(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  const mutation = useMutation({
    mutationFn: async (data: MissionFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        aircraftId: data.aircraftId ? Number(data.aircraftId) : undefined,
        gradingTemplateId: data.gradingTemplateId
          ? Number(data.gradingTemplateId)
          : null,
        durationMinutes: Number(data.durationMinutes),
        missionType: data.missionType,
      }
      if (toEditId) {
        return trpcClient.missions.update.mutate({ ...payload, toEditId })
      }
      return trpcClient.missions.create.mutate(payload)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.missions.pathFilter())
      toast.success('Event saved successfully')
      onClose(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const aircraftOptions = aircraftQ.data.items.map((item) => ({
    value: item.id,
    label: item.tailNumber ? `${item.name} (${item.tailNumber})` : item.name,
  }))

  const gradingTemplateOptions = gradingTemplateQ.data.items.map((item) => ({
    value: item.id,
    label: item.name,
  }))

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return
        onClose(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === 'create' ? 'New Event' : 'Edit Event'}
          </DialogTitle>
        </DialogHeader>
        <DialogMain className="space-y-6">
          <FieldColumns>
            <form.AppField
              name="name"
              children={(f) => (
                <f.CTextField
                  required
                  label="Name"
                  placeholder="e.g. Chopper Fly"
                />
              )}
            />
            <form.AppField
              name="missionType"
              children={(f) => (
                <f.CBasicSelect
                  required
                  label="Type"
                  placeholder="Select event type"
                  options={missionTypeOptions}
                />
              )}
            />
            <form.AppField
              name="durationMinutes"
              children={(f) => (
                <f.CTextField
                  valueAsNumber
                  label="Duration (minutes)"
                  placeholder="Optional"
                  type="number"
                />
              )}
            />
            {/* <form.AppField
              name="aircraftId"
              children={(f) => (
                <f.CBasicSelect
                  valueAsNumber
                  label="Aircraft"
                  placeholder="Optional"
                  options={aircraftOptions}
                />
              )}
            /> */}
            <form.AppField
              name="gradingTemplateId"
              children={(f) => (
                <f.CBasicSelect
                  valueAsNumber
                  label="Grading Template"
                  placeholder="Optional"
                  options={gradingTemplateOptions}
                />
              )}
            />
          </FieldColumns>
          <form.AppField
            name="description"
            children={(f) => (
              <f.CTextAreaField
                label="Description"
                placeholder="e.g. Fly with chopper for 1 hour in circle"
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

const defaultValues: MissionFormData = {
  name: '',
  description: '',
  aircraftId: null,
  gradingTemplateId: null,
  durationMinutes: null,
  missionType: defaultMissionTypeId,
}
