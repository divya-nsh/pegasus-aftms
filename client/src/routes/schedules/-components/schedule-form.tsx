import ErrorAlert from '@/components/errors/ErrorAlert'
import TextField, {
  BasicSelectField,
  TextAreaField,
} from '@/components/inputs/TextField'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { addMinutesToDateTimeLocal, toDateTimeLocal } from '@/lib/date'
import trpc, { trpcClient } from '@/trpc'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { TrpcRouterOutputs } from 'server/router'
import TraineePicker, { personName } from './trainee-picker'
import type { LineRow } from './trainee-picker'
import { MISSION_STATUS_LABELS, MissionStatusPicker } from './mission-stage-bar'
import type { MissionStatus } from './mission-stage-bar'

type ScheduleDetail = TrpcRouterOutputs['schedules']['getById']

function toOptionalId(value: string) {
  return value ? Number(value) : undefined
}

function headerFromSchedule(schedule?: ScheduleDetail) {
  return {
    missionId: schedule?.missionId ? String(schedule.missionId) : '',
    scheduleNumber: schedule?.scheduleNumber ?? '',
    name: schedule?.name ?? '',
    description: schedule?.description ?? '',
    startDateTime: toDateTimeLocal(schedule?.startDateTime),
    endDateTime: toDateTimeLocal(schedule?.endDateTime),
    aircraftId: schedule?.aircraftId ? String(schedule.aircraftId) : '',
    areaId: schedule?.areaId ? String(schedule.areaId) : '',
    instructorId: schedule?.instructorId ? String(schedule.instructorId) : '',
    pilotId: schedule?.pilotId ? String(schedule.pilotId) : '',
    remarks: schedule?.remarks ?? '',
    durationMinutes: schedule?.durationMinutes ?? 0,
  }
}

function lineFromSchedule(schedule?: ScheduleDetail): LineRow[] {
  if (!schedule) return []
  return schedule.assignments
    .filter((row) => row.personId != null)
    .map((row) => ({
      personId: row.personId as number,
      attendanceStatus: row.attendanceStatus,
      score: row.score == null ? '' : String(row.score),
      result: row.result,
      remarks: row.remarks ?? '',
    }))
}

export default function ScheduleForm({
  schedule,
}: {
  schedule?: ScheduleDetail
}) {
  const [formState, setFormState] = useState(() => headerFromSchedule(schedule))
  const [lineRows, setLineRows] = useState<LineRow[]>(() =>
    lineFromSchedule(schedule),
  )
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const scheduleId = schedule?.id
  const missionLocked = Boolean(formState.missionId)

  const missionsQ = useSuspenseQuery(trpc.missions.getAll.queryOptions())
  const aircraftQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())
  const areasQ = useSuspenseQuery(trpc.areas.getAll.queryOptions())
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

  const instructors = personnelQ.data.items.filter(
    (person) => person.personnelType === 'instructor',
  )
  const trainees = personnelQ.data.items.filter(
    (person) => person.personnelType === 'trainee',
  )
  const pilotsOptions = personnelQ.data.items.filter(
    (person) => person.personnelType === 'pilot',
  )
  const traineeOptions = trainees.length ? trainees : personnelQ.data.items
  const instructorOptions = instructors.length
    ? instructors
    : personnelQ.data.items

  const saveMutation = useMutation({
    mutationFn: async () => {
      const header = {
        scheduleNumber: formState.scheduleNumber,
        name: formState.name,
        description: formState.description,
        startDateTime: formState.startDateTime,
        endDateTime: formState.endDateTime,
        aircraftId: toOptionalId(formState.aircraftId),
        areaId: toOptionalId(formState.areaId),
        instructorId: toOptionalId(formState.instructorId),
        pilotId: toOptionalId(formState.pilotId),
        remarks: formState.remarks,
      }
      const line = {
        trainees: lineRows.map((row) => ({
          personId: row.personId,
          attendanceStatus: row.attendanceStatus,
          score: row.score === '' ? undefined : Number(row.score),
          result: row.result,
          remarks: row.remarks,
        })),
      }

      if (scheduleId) {
        await trpcClient.schedules.update.mutate({
          ...header,
          toEditId: scheduleId,
        })
        await trpcClient.schedules.saveLine.mutate({
          id: scheduleId,
          ...line,
        })
        return { id: scheduleId }
      }

      const created = await trpcClient.schedules.create.mutate({
        ...header,
        missionId: Number(formState.missionId),
        traineeIds: lineRows.map((row) => row.personId),
      })
      await trpcClient.schedules.saveLine.mutate({
        id: created.id,
        ...line,
      })
      return created
    },
    onSuccess: (result) => {
      queryClient.resetQueries(trpc.schedules.pathFilter())
      toast.add({
        type: 'success',
        title: scheduleId ? 'Schedule saved' : 'Schedule created',
      })
      if (!scheduleId) {
        navigate({
          to: '/schedules/$id',
          params: { id: String(result.id) },
        })
      }
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to save schedule',
        description: error.message,
      })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: MissionStatus) =>
      trpcClient.schedules.setStatus.mutate({ id: scheduleId!, status }),
    onSuccess: () => {
      queryClient.resetQueries(trpc.schedules.pathFilter())
      toast.add({ type: 'success', title: 'Schedule status updated' })
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to update status',
        description: error.message,
      })
    },
  })

  const updateFormState = (newState: Partial<typeof formState>) => {
    setFormState((prev) => ({ ...prev, ...newState }))
  }

  const applyStartAndDuration = (
    startDateTime: string,
    durationMinutes: number,
  ) => {
    updateFormState({
      startDateTime,
      endDateTime: addMinutesToDateTimeLocal(startDateTime, durationMinutes),
    })
  }

  const selectMission = (missionId: string) => {
    if (!missionId || formState.missionId) return
    const mission = missionsQ.data.items.find(
      (item) => String(item.id) === missionId,
    )
    if (!mission) return

    const startDateTime = formState.startDateTime

    updateFormState({
      missionId,
      name: mission.name,
      description: mission.description ?? '',
      aircraftId: mission.aircraftId ? String(mission.aircraftId) : '',
      durationMinutes: mission.durationMinutes,
      endDateTime: startDateTime
        ? addMinutesToDateTimeLocal(startDateTime, mission.durationMinutes)
        : formState.endDateTime,
    })
  }

  return (
    <>
      <ErrorAlert error={saveMutation.error} />
      {schedule ? (
        <MissionStatusPicker
          value={schedule.status}
          disabled={statusMutation.isPending}
          onChange={(status) => {
            const confirmed = window.confirm(
              `Are you sure you want to mark this schedule as ${MISSION_STATUS_LABELS[status]}?\n\nYou cannot go back after the status is changed.`,
            )
            if (confirmed) statusMutation.mutate(status)
          }}
        />
      ) : null}
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate()
        }}
      >
        <section className="grid grid-cols-2 gap-6">
          <BasicSelectField
            required
            className="col-span-2"
            label="Mission"
            placeholder="Select a mission first"
            disabled={missionLocked}
            value={formState.missionId}
            options={missionsQ.data.items.map((item) => ({
              value: String(item.id),
              label: `${item.name} (${item.durationMinutes} min)`,
            }))}
            onValueChange={(missionId) =>
              selectMission(String(missionId ?? ''))
            }
          />

          {missionLocked ? (
            <>
              <TextField
                label="Schedule Number"
                placeholder="Leave blank to auto-generate SCH-{id}"
                value={formState.scheduleNumber}
                onValueChange={(scheduleNumber) =>
                  updateFormState({ scheduleNumber })
                }
              />
              <TextField
                required
                label="Schedule Name*"
                value={formState.name}
                onValueChange={(name) => updateFormState({ name })}
              />
              <TextField
                label="Duration"
                readOnly
                value={`${formState.durationMinutes} min`}
              />
              <TextAreaField
                className="col-span-2"
                label="Note / Description"
                placeholder="Optional note for this schedule"
                value={formState.description}
                onValueChange={(description) =>
                  updateFormState({ description })
                }
              />
              <TextField
                label="Start"
                type="datetime-local"
                min={todayStart()}
                value={formState.startDateTime}
                onValueChange={(startDateTime) =>
                  applyStartAndDuration(
                    startDateTime,
                    formState.durationMinutes,
                  )
                }
              />
              <TextField
                label="End"
                min={formState.startDateTime}
                type="datetime-local"
                value={formState.endDateTime}
                onValueChange={(endDateTime) =>
                  updateFormState({ endDateTime })
                }
              />
              <BasicSelectField
                label="Aircraft"
                placeholder="Select aircraft"
                value={formState.aircraftId}
                options={aircraftQ.data.items.map((item) => ({
                  value: String(item.id),
                  label: `${item.name}${item.tailNumber ? ` (${item.tailNumber})` : ''}`,
                }))}
                onValueChange={(aircraftId) =>
                  updateFormState({ aircraftId: String(aircraftId ?? '') })
                }
              />
              <BasicSelectField
                required
                label="Area*"
                placeholder="Select area"
                value={formState.areaId}
                options={areasQ.data.items.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
                onValueChange={(areaId) =>
                  updateFormState({ areaId: String(areaId ?? '') })
                }
              />
              <BasicSelectField
                required
                label="Instructor*"
                placeholder="Select instructor"
                value={formState.instructorId}
                options={instructorOptions.map((item) => ({
                  value: String(item.id),
                  label: `${personName(item)} (${item.personnelType})`,
                }))}
                onValueChange={(instructorId) =>
                  updateFormState({
                    instructorId: String(instructorId ?? ''),
                  })
                }
              />
              <BasicSelectField
                label="Pilot"
                placeholder="Select pilot"
                value={formState.pilotId}
                options={pilotsOptions.map((item) => ({
                  value: String(item.id),
                  label: `${personName(item)} (${item.personnelType})`,
                }))}
                onValueChange={(pilotId) =>
                  updateFormState({ pilotId: String(pilotId ?? '') })
                }
              />
            </>
          ) : (
            <p className="col-span-2 text-sm text-muted-foreground">
              Select a mission to continue. Aircraft, name, and duration will
              fill in automatically. The mission cannot be changed after it is
              selected.
            </p>
          )}
        </section>

        {missionLocked ? (
          <>
            <TraineePicker
              trainees={traineeOptions}
              rows={lineRows}
              onRowsChange={setLineRows}
            />

            <TextAreaField
              label="Remarks"
              value={formState.remarks}
              onValueChange={(remarks) => updateFormState({ remarks })}
            />

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                Save
              </Button>
            </div>
          </>
        ) : null}
      </form>
      <BlockingLoaderOverlay
        show={saveMutation.isPending || statusMutation.isPending}
      />
    </>
  )
}

function todayStart() {
  const date = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00`
}
