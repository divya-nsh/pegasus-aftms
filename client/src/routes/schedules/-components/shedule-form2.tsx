import {
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import { FieldColumns } from '@/components/ui/field'
import { trpc } from '@/trpc'
import { revalidateLogic, useSelector } from '@tanstack/react-form'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'

const schema = z.object({
  scheduleNumber: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  description: z.string(),
  startDateTime: z.string().min(1, 'Required'),
  endDateTime: z.string().min(1, 'Required'),
  aircraftId: z.number().nullable(),
  areaId: z.number().nullable(),
  instructorId: z.number().min(1, 'Required'),
  pilotId: z.number().nullable(),
  remarks: z.string(),
  missionId: z.number().min(1, 'Required'),
})

export type SheduleForm2Data = z.infer<typeof schema>

export type SheduleForm2Props = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: SheduleForm2Data
}

export default function SheduleForm2({
  mode,
  toEditId,
  initialFormData,
}: SheduleForm2Props) {
  const form = useAppForm({
    defaultValues: initialFormData,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
    },
    onSubmit: ({ value }) => saveMutation.mutateAsync(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  const missionsQ = useSuspenseQuery(trpc.missions.getAll.queryOptions())

  const saveMutation = useMutation({
    mutationFn: async (data: SheduleForm2Data) => {
      console.log(data)
      //   const header = {
      //     scheduleNumber: data.scheduleNumber,
      //     name: data.name,
      //     description: data.description,
      //     startDateTime: data.startDateTime,
      //     endDateTime: data.endDateTime,
      //     aircraftId: data.aircraftId,
      //     areaId: data.areaId,
      //     instructorId: data.instructorId,
      //     pilotId: data.pilotId,
      //     remarks: data.remarks,
      //   }
      //   const line = {
      //     trainees: lineRows.map((row) => ({
      //       personId: row.personId,
      //       attendanceStatus: row.attendanceStatus,
      //       score: row.score === '' ? undefined : Number(row.score),
      //       result: row.result,
      //       remarks: row.remarks,
      //     })),
      //   }
    },
    onSuccess: () => {},
  })

  const [missionId, startDateTime] = useSelector(
    form.store,
    (state) => [state.values.missionId, state.values.startDateTime] as const,
  )

  if (!missionId) {
    return (
      <div>
        <form.AppField
          name="missionId"
          children={(f) => (
            <f.CBasicSelect
              label="Mission"
              placeholder="Select a mission first"
              valueAsNumber
              options={missionsQ.data.items.map((item) => ({
                value: String(item.id),
                label: `${item.name} (${item.durationMinutes} min)`,
              }))}
            />
          )}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <form.AppField
        name="missionId"
        children={(f) => (
          <f.CBasicSelect
            disabled
            label="Mission"
            placeholder="Select a mission first"
            valueAsNumber
            options={missionsQ.data.items.map((item) => ({
              value: String(item.id),
              label: `${item.name} (${item.durationMinutes} min)`,
            }))}
          />
        )}
      />
      <FieldColumns cols={2}>
        <form.AppField
          name="scheduleNumber"
          children={(f) => (
            <f.CTextField
              label="Shedule Number"
              placeholder="Leave blank to auto-generate SCH-{id}"
            />
          )}
        />
        <form.AppField
          name="name"
          children={(f) => <f.CTextField label="Shedule Name" />}
        />
        <form.AppField
          name="description"
          children={(f) => (
            <f.CTextField
              className="col-span-2"
              label="Description"
              placeholder="Optional note or Details about schedule"
            />
          )}
        />

        <form.AppField
          name="startDateTime"
          children={(f) => (
            <f.CTextField
              className="col-span-2"
              type="datetime-local"
              label="Start Time"
              min={todayStart()}
            />
          )}
        />
        <form.AppField
          name="endDateTime"
          children={(f) => (
            <f.CTextField
              className="col-span-2"
              type="datetime-local"
              label="End Time"
              min={startDateTime}
            />
          )}
        />
      </FieldColumns>
    </div>
  )
}

function todayStart() {
  const date = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00`
}
