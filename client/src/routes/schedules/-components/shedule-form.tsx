import { z } from 'zod'
import {
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import { revalidateLogic, useSelector } from '@tanstack/react-form'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { FieldColumns, FieldError } from '@/components/ui/field'
import TextField from '@/components/inputs/TextField'
import { useMemo } from 'react'
import { addMinutesToDateTimeLocal, formatDateDifference } from '@/lib/date'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { trpcClient, trpc } from '@/trpc'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import MissionStatusBadge from './mission-stage-bar'
import AssignmentLine, { assignmentSchema } from './assignment-line'
import type { Assignment } from './assignment-line'
import type { FormMode } from '@/types/general'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import promptConfirm from '@/lib/confirm'

const requiredTextSchema = z.string().min(1, 'Required')

const schema = z.object({
  // Only for edit mode\
  id: z.number().optional(),
  status: z.string().optional(),
  missionId: z.number().min(1, 'Required'),
  scheduleNumber: z.string(),
  name: requiredTextSchema,
  description: z.string(),
  startDateTime: requiredTextSchema,
  endDateTime: requiredTextSchema,
  areaId: z.number().min(1, 'Required'),
  remarks: z.string(),
  assigments: z
    .array(assignmentSchema)
    .min(1, 'At least one pilot is required'),
})

export type FormData = z.infer<typeof schema>
export type { Assignment }

// ----------------------------------------------------
// --------------------- Form Component ---------------------
// ----------------------------------------------------

export type ScheduleForm3Props = {
  mode: FormMode
  defaultValues: FormData
}

export default function ScheduleForm3({
  mode,
  defaultValues,
}: ScheduleForm3Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (mode === 'view') return
      if (mode === 'create') {
        await trpcClient.schedules.create.mutate(data)
      } else {
        alert('Editing is not supported yet')
        // await trpcClient.schedules.update.mutate(data)
      }
    },
    onSuccess: () => {
      toast.success('Schedule saved successfully')
      router.navigate({ to: '/schedules' })
    },
    onError: (error) => {
      toast.error(error.message)
      console.error(error)
    },
  })

  const statusChangeMutation = useMutation({
    mutationFn: async (status: 'published' | 'cancelled' | 'completed') => {
      await trpcClient.schedules.setStatus.mutate({
        id: defaultValues.id || 0,
        status,
      })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.schedules.pathFilter())
      toast.success(`Status changed from ${defaultValues.status} to ${status}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useAppForm({
    defaultValues: defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
    },
    onSubmit: ({ value }) => mutation.mutate(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  const missionsQ = useSuspenseQuery(trpc.missions.getAll.queryOptions())
  const areasQ = useSuspenseQuery(trpc.areas.getAll.queryOptions())
  //   const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

  const selectedMissionId = useSelector(
    form.store,
    (state) => state.values.missionId,
  )

  const selectedMission = useMemo(() => {
    return missionsQ.data.items.find(
      (itm) => itm.id === Number(selectedMissionId),
    )
  }, [missionsQ.data.items, selectedMissionId])

  return (
    <>
      <BlockingLoaderOverlay
        show={mutation.isPending || statusChangeMutation.isPending}
      />
      <Link
        to="/schedules"
        className="text-muted-foreground mb-2 flex items-center gap-2 text-sm hover:text-primary hover:underline"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Go Back
      </Link>
      {/* Form Header */}
      <div className="border-b pb-2 flex items-center gap-3">
        <h1 className="text-lg font-bold">
          {mode === 'create'
            ? 'New Schedule'
            : `Edit Schedule > #${defaultValues.scheduleNumber}`}
        </h1>
        <MissionStatusBadge status={defaultValues.status || 'draft'} />
      </div>

      {mode === 'edit' && (
        <div className="pb-3 border-b flex items-center gap-2 -mt-2">
          <Button variant="secondary" size="sm" disabled>
            Draft
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (
                await promptConfirm(
                  'Are you sure you want to publish this schedule?',
                )
              ) {
                statusChangeMutation.mutate('published')
              }
            }}
            disabled={defaultValues.status === 'published'}
          >
            Publish Schedule
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (await promptConfirm('This Will Mark the Completed Status')) {
                statusChangeMutation.mutate('completed')
              }
            }}
            disabled={defaultValues.status === 'completed'}
          >
            Mark as Complete
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={async () => {
              if (
                await promptConfirm(
                  'This Will Mark the Cancelled Status and its irreversible.',
                )
              ) {
                statusChangeMutation.mutate('cancelled')
              }
            }}
            disabled={defaultValues.status === 'cancelled'}
          >
            Mark as Cancelled
          </Button>
        </div>
      )}

      {/* Form Body */}
      <div className="mt-4 space-y-6">
        <form.AppField
          name="missionId"
          children={(f) => (
            <f.CBasicSelect
              required
              disabled={!!f.state.value}
              placeholder="Select Event"
              label="Event"
              options={missionsQ.data.items.map((mission) => ({
                label: `${mission.name} (type: ${mission.missionType}, ${mission.durationMinutes} min)`,
                value: mission.id,
              }))}
              onCommited={(newValue) => {
                if (!newValue) return
                const mission = missionsQ.data.items.find(
                  (itm) => itm.id === Number(newValue),
                )
                if (!mission) return
                form.setFieldValue('description', mission.description || '')
              }}
              valueAsNumber
            />
          )}
        />
        <FieldColumns>
          <form.AppField
            name="name"
            children={(f) => (
              <f.CTextField
                label="Schedule Name"
                placeholder="Enter name"
                required
              />
            )}
          />
          <form.AppField
            name="scheduleNumber"
            children={(f) => (
              <f.CTextField
                disabled={mode !== 'create'}
                label="Schedule Number"
                placeholder="Leave blank to auto-generate SCH-{id}"
              />
            )}
          />

          <form.Subscribe
            selector={(state) => [
              state.values.startDateTime,
              state.values.endDateTime,
            ]}
          >
            {([startDateTime, endDateTime]) => (
              <>
                <form.AppField
                  name="startDateTime"
                  children={(f) => (
                    <f.CDateField
                      time={true}
                      required
                      label="Start DateTime"
                      onAfterCommit={(value) => {
                        if (!value || typeof value !== 'string') return
                        form.setFieldValue(
                          'endDateTime',
                          addMinutesToDateTimeLocal(
                            value,
                            selectedMission?.durationMinutes || 0,
                          ),
                        )
                      }}
                    />
                  )}
                />

                <form.AppField
                  name="endDateTime"
                  validators={{
                    onChangeListenTo: ['startDateTime'],
                    onChange: ({ value }) => {
                      if (!value) return undefined
                      if (
                        startDateTime &&
                        new Date(value) < new Date(startDateTime)
                      ) {
                        return 'End datetime must be after start datetime'
                      }
                    },
                  }}
                  children={(f) => (
                    <f.CDateField
                      time
                      required
                      placeholder={
                        !startDateTime
                          ? 'Pick start datetime first'
                          : 'Pick a date'
                      }
                      label="End DateTime"
                      disabled={!startDateTime}
                    />
                  )}
                />
                <TextField
                  readOnly
                  value={(
                    formatDateDifference(startDateTime, endDateTime) ??
                    (selectedMission?.durationMinutes || 0)
                  ).toString()}
                  label="Duration"
                />
              </>
            )}
          </form.Subscribe>
          <form.AppField
            name="areaId"
            children={(f) => (
              <f.CBasicSelect
                label="Area"
                placeholder="Select Area"
                options={areasQ.data.items.map((area) => ({
                  label: area.name,
                  value: area.id,
                }))}
                valueAsNumber
              />
            )}
          />
        </FieldColumns>
        <FieldColumns>
          <form.AppField
            name="description"
            children={(f) => (
              <f.CTextAreaField
                label="Description"
                placeholder="Enter Details of the event which will be shown to the user"
              />
            )}
          />
          <form.AppField
            name="remarks"
            children={(f) => (
              <f.CTextAreaField label="Remarks" placeholder="Enter remarks" />
            )}
          />
        </FieldColumns>

        <div>
          <form.Field
            name="assigments"
            children={(f) => (
              <>
                {f.state.meta.errors.length > 0 && (
                  <FieldError errors={f.state.meta.errors} />
                )}
                <AssignmentLine
                  mode={mode}
                  values={f.state.value}
                  onChange={f.handleChange}
                />
              </>
            )}
          />
        </div>

        {mode !== 'view' && (
          <div className="mt-6">
            <form.AppForm>
              <form.SubscribeButton />
            </form.AppForm>
          </div>
        )}
      </div>
    </>
  )
}
