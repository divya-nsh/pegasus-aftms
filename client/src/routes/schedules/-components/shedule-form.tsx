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
import { addMinutesToDateTimeLocal, formatDateDifference } from '@/lib/date'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { trpcClient, trpc } from '@/trpc'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import MissionStatusBadge from './mission-stage-bar'
import type { FormMode } from '@/types/general'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import promptConfirm from '@/lib/confirm'
import type { ScheduleFormData } from './type'
import AssignmentLine from './assignment-line'

// ----------------------------------------------------
// --------------------- Form Component ---------------------
// ----------------------------------------------------

export type ScheduleForm3Props = {
  mode: FormMode
  defaultValues: ScheduleFormData
}

// In this From since its big complex validation are define on field level
export default function ScheduleForm3({
  mode,
  defaultValues,
}: ScheduleForm3Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (formData: ScheduleFormData) => {
      // const data = schema.parse(unProcessedData)
      if (mode === 'view') return
      const actionFn =
        mode === 'create'
          ? trpcClient.schedules.create
          : trpcClient.schedules.update
      await actionFn.mutate({
        id: formData.id!,
        missionId: formData.mission.value,
        name: formData.name,
        description: formData.description,
        scheduleNumber: formData.scheduleNumber,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        aircraftId: formData.mission.value,
        areaId: formData.area!.value,
        remarks: formData.remarks,
        status: 'draft',

        assignments: formData.assignments.map((assignment) => ({
          personnelId: assignment.personnel!.value,
          aircraftId: assignment.aircraft?.value ?? null,
          attendanceStatus: assignment.attendanceStatus,
          aircraftTime: assignment.aircraftTime,
          takeoffTime: assignment.takeoffTime,
          landingTime: assignment.landingTime,
          result: null,
          remarks: assignment.remarks,
          obtainedGradeId: assignment.obtainedGrade?.value ?? null,
          obtainedScoreValue: assignment.obtainedScoreValue ?? null,
          obtainedScorePercentage: assignment.obtainedScorePercentage ?? null,
          grades: assignment.participantGradings.map((grade) => ({
            gradingTemplateAttributeId: grade.templateAttribute.value,
            gradingScaleOptionId: grade.gradingScaleOption?.value ?? null,
            obtainedScoreValue: grade.obtainedScoreValue,
            status: grade.status,
          })),
        })),
      })
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
    onSubmit: ({ value }) => mutation.mutate(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  const areasQ = useSuspenseQuery(trpc.areas.getAll.queryOptions())
  //   const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

  const selectedMission = useSelector(
    form.store,
    (state) => state.values.mission,
  )

  const [startDateTime, endDateTime] = useSelector(form.store, (state) => [
    state.values.startDateTime,
    state.values.endDateTime,
  ])

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
          validators={{
            onDynamic: ({ value }) => required(value),
          }}
          name="mission.label"
          children={(f) => (
            <f.CTextField disabled placeholder="Select Event" label="Event" />
          )}
        />

        <FieldColumns>
          <form.AppField
            name="name"
            validators={{
              onDynamic: ({ value }) => required(value),
            }}
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

          <form.AppField
            name="startDateTime"
            validators={{
              onDynamic: ({ value }) => required(value),
            }}
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
                      selectedMission.durationMinutes,
                    ),
                  )
                }}
              />
            )}
          />

          <form.AppField
            name="endDateTime"
            validators={{
              onDynamic: ({ value }) => {
                if (!value) return 'This is Required'
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
                  !startDateTime ? 'Pick start datetime first' : 'Pick a date'
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
              selectedMission.durationMinutes
            ).toString()}
            label="Duration"
          />

          <form.AppField
            name="area"
            validators={{
              onDynamic: ({ value }) => required(value),
            }}
            children={(f) => (
              <f.CComboboxField
                label="Area"
                placeholder="Select Area"
                items={areasQ.data.items.map((area) => ({
                  label: area.name,
                  value: area.id,
                }))}
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
            validators={{
              onDynamic: ({ value }) => required(value),
            }}
            name="assignments"
            children={(f) => (
              <>
                {f.state.meta.errors.length > 0 && (
                  <FieldError errors={f.state.meta.errors} />
                )}
                <AssignmentLine
                  gradingTemplateId={selectedMission.gradingTemplateId}
                  startDateTime={startDateTime}
                  endDateTime={endDateTime}
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

export const required = (value: unknown) => {
  if (!value) return 'This is Required'
  if (typeof value === 'string' && !value.trim()) return 'This is Required'
  if (Array.isArray(value) && value.length === 0)
    return 'At least one Item is required'
  return undefined
}
