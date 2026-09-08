import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import { revalidateLogic, useSelector } from '@tanstack/react-form'
import PageCard from '@/components/layout/PageCard'
import { useSuspenseQuery } from '@tanstack/react-query'
import { trpc } from '@/trpc'
import { FieldColumns, FieldError } from '@/components/ui/field'
import TextField from '@/components/inputs/TextField'
import { useMemo, useState } from 'react'
import { addMinutesToDateTimeLocal, formatDate } from '@/lib/date'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogMain,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PencilIcon, PlusIcon } from 'lucide-react'
import { getPersonnelType, getPilotQualification } from '@repo/shared'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/schedules/form2')({
  component: RouteComponent,
})

function RouteComponent() {
  const form = useAppForm({
    defaultValues: defaultFormData,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
    },
  })

  const missionsQ = useSuspenseQuery(trpc.missions.getAll.queryOptions())
  const areasQ = useSuspenseQuery(trpc.areas.getAll.queryOptions())
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

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
    <PageCard>
      {/* Form Header */}
      <div className="border-b pb-2 ">
        <h1 className="text-xl font-bold">Schedule Event Form</h1>
      </div>

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
              //   onCommited={(newValue) => {
              //     if (!newValue) return
              //     const mission = missionsQ.data.items.find(
              //       (itm) => itm.id === Number(newValue),
              //     )
              //     if (!mission) return
              //   }}
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
                label="Schedule Number"
                placeholder="Leave blank to auto-generate SCH-{id}"
              />
            )}
          />
          <form.AppField
            name="startDateTime"
            children={(f) => (
              <f.CTextField
                type="datetime-local"
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
              onChange: ({ value, fieldApi }) => {
                if (!value) return undefined
                const startDateTime =
                  fieldApi.form.getFieldValue('startDateTime')
                if (
                  startDateTime &&
                  new Date(value) < new Date(startDateTime)
                ) {
                  return 'End datetime must be after start datetime'
                }
              },
            }}
            children={(f) => (
              <f.CTextField type="datetime-local" label="End DateTime" />
            )}
          />
          <form.Subscribe
            selector={(state) => [
              state.values.startDateTime,
              state.values.endDateTime,
            ]}
          >
            {([startDateTime, endDateTime]) => (
              <TextField
                readOnly
                value={(
                  durationMinutes(startDateTime, endDateTime) ??
                  (selectedMission?.durationMinutes || 0)
                ).toString()}
                label="Duration (minutes)"
              />
            )}
          </form.Subscribe>
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
                  values={f.state.value}
                  onChange={f.handleChange}
                />
              </>
            )}
          />
        </div>

        <div className="mt-6">
          <form.AppForm>
            <form.SubscribeButton />
          </form.AppForm>
        </div>
      </div>
    </PageCard>
  )
}

const requiredTextSchema = z.string().min(1, 'Required')
const optionalTextSchema = z.string().optional().nullable()

const assignmentSchema = z.object({
  personnelId: z.number().min(1, 'Required'),
  // For display in the table it is not required by server
  personnelDataForDisplay: z
    .object({
      firstName: optionalTextSchema,
      lastName: optionalTextSchema,
      personnelType: optionalTextSchema,
      qualification: optionalTextSchema,
      rank: optionalTextSchema,
    })
    .optional(),
  attendanceStatus: z.enum(['present', 'absent', 'excused']).nullable(),
  score: z.number().int().min(0).max(100).nullable(),
  result: z.enum(['passed', 'failed']).nullable(),
  remarks: optionalTextSchema,
  aircraftId: z.number().nullable(),
  takeoffTime: optionalTextSchema,
  landingTime: optionalTextSchema,
  aircraftTime: optionalTextSchema,
})

const schema = z.object({
  missionId: z.number().min(1, 'Required'),
  scheduleNumber: z.string(),
  name: requiredTextSchema,
  description: z.string(),
  startDateTime: requiredTextSchema,
  endDateTime: requiredTextSchema,
  remarks: z.string(),
  assigments: z.array(assignmentSchema),
})

type FormData = z.infer<typeof schema>
type Assignment = z.infer<typeof assignmentSchema>

const defaultFormData: FormData = {
  missionId: null as unknown as number,
  scheduleNumber: '',
  name: '',
  description: '',
  startDateTime: '',
  endDateTime: '',
  remarks: '',
  assigments: [],
}

function durationMinutes(startDateTime: string, endDateTime: string) {
  if (!startDateTime || !endDateTime) return null
  return Math.floor(
    (new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) /
      1000 /
      60,
  )
}

function AssignmentLine({
  values,
  onChange,
}: {
  values: FormData['assigments']
  onChange: (values: FormData['assigments']) => void
}) {
  const [addFormOpen, setAddFormOpen] = useState<{
    open: boolean
    editIndex?: number
  }>({
    open: false,
  })
  const aircraftsQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

  const handleSave = (assignment: Assignment) => {
    if (addFormOpen.editIndex != null) {
      onChange(
        values.map((v, i) => (i === addFormOpen.editIndex ? assignment : v)),
      )
    } else {
      onChange([...values, assignment])
    }
  }

  const getPersonnel = (personnelId: number) => {
    const person = personnelQ.data.items.find((p) => p.id === personnelId)
    if (!person) return null
    return person
  }

  const personnelName = (personnelId: number) => {
    const person = getPersonnel(personnelId)
    if (!person) return '—'
    return `${person.firstName} ${person.lastName}`
  }

  const aircraftName = (aircraftId: number | null) => {
    if (!aircraftId) return '—'
    return aircraftsQ.data.items.find((a) => a.id === aircraftId)?.name ?? '—'
  }

  return (
    <div>
      <div className="border-b pb-2 text-sm font-semibold flex justify-between items-center">
        <p>Pilots List</p>
        <Button
          size="sm"
          variant="secondary"
          className="border shadow-xs"
          onClick={() => setAddFormOpen({ open: true })}
        >
          <PlusIcon className="size-4" />
          Add Pilot
        </Button>
      </div>
      <div
        className="mt-3 overflow-hidden rounded-md border"
        style={{
          borderStyle: values.length > 0 ? 'solid' : 'dashed',
        }}
      >
        {values.length > 0 ? (
          <Table className=" border-collapse">
            <TableHeader>
              <TableRow className=" bg-muted/40">
                <TableHead className="border">S.No</TableHead>
                <TableHead className="border">Pilot</TableHead>
                <TableHead className="border">Aircraft</TableHead>
                <TableHead className="border">Attendance</TableHead>
                <TableHead className="border">Result</TableHead>
                <TableHead className="border">Score</TableHead>
                <TableHead className="border">Remarks</TableHead>
                <TableHead className="w-20 text-right border">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {values.map((assignment, index) => {
                const _personnel = getPersonnel(assignment.personnelId)
                return (
                  <TableRow
                    key={`${assignment.personnelId}-${index}`}
                    onClick={() =>
                      setAddFormOpen({ open: true, editIndex: index })
                    }
                  >
                    <TableCell className="align-top">{index + 1}</TableCell>
                    <TableCell className="border align-top">
                      <div className="max-w-[200px] grid">
                        <span className=" truncate">
                          {personnelName(assignment.personnelId)}
                        </span>
                        <span className="text-muted-foreground">
                          Service Id: {_personnel?.code}{' '}
                        </span>
                        {_personnel?.personnelType && (
                          <span className="text-muted-foreground">
                            Type:{' '}
                            {getPersonnelType(_personnel.personnelType)?.name ??
                              _personnel.personnelType}
                          </span>
                        )}
                        {_personnel?.rank && (
                          <span className="text-muted-foreground">
                            Rank: {_personnel.rank}
                          </span>
                        )}
                        {_personnel?.qualification && (
                          <span className="text-muted-foreground">
                            Qualification:{' '}
                            {getPilotQualification(_personnel.qualification)
                              ?.name ?? _personnel.qualification}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border align-top">
                      <div className="grid max-w-62.5">
                        <span className=" truncate">
                          {aircraftName(assignment.aircraftId)}
                        </span>
                        <span className="">
                          Takeoff:{' '}
                          {assignment.takeoffTime
                            ? formatDate(assignment.takeoffTime, true)
                            : '—'}
                        </span>
                        <span className="">
                          Landing:{' '}
                          {assignment.landingTime
                            ? formatDate(assignment.landingTime, true)
                            : '—'}
                        </span>
                        <span className="">
                          Aircraft:{' '}
                          {assignment.aircraftTime
                            ? formatDate(assignment.aircraftTime, true)
                            : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="border align-top">
                      {assignment.attendanceStatus || '—'}
                    </TableCell>
                    <TableCell className="border align-top">
                      {assignment.result || '—'}
                    </TableCell>
                    <TableCell className="border align-top">
                      {assignment.score || '—'}
                    </TableCell>
                    <TableCell className="max-w-64 truncate align-top text-muted-foreground">
                      {assignment.remarks || '—'}
                    </TableCell>

                    <TableCell
                      className="text-right border align-top"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          setAddFormOpen({ open: true, editIndex: index })
                        }}
                      >
                        <PencilIcon className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div
            className="py-8 text-center text-muted-foreground cursor-pointer hover:bg-muted"
            onClick={() => setAddFormOpen({ open: true })}
          >
            No Assignments added yet
          </div>
        )}
      </div>
      {addFormOpen.open && (
        <AssignmentsModal
          key={addFormOpen.editIndex ?? 'add'}
          onClose={(open) => setAddFormOpen({ open })}
          mode={addFormOpen.editIndex != null ? 'edit' : 'add'}
          defaultValues={
            addFormOpen.editIndex != null
              ? values[addFormOpen.editIndex]
              : undefined
          }
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function AssignmentsModal({
  onClose,
  onSave,
  mode,
  defaultValues,
}: {
  onClose: (open: boolean) => void
  onSave: (assignment: Assignment) => void
  mode: 'add' | 'edit'
  defaultValues?: Assignment
}) {
  const aircraftsQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

  const form = useAppForm({
    defaultValues: defaultValues || defaultAssignmentFormData,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: assignmentSchema,
    },
    onSubmit: ({ value, meta }) => {
      onSave(value)
      form.reset()
      if (meta !== 'savestay') {
        onClose(false)
      }
    },
    onSubmitInvalid: handleSubmitInvalid,
  })

  //   const formValues = useSelector(form.store, (state) => state.values)

  //   const selectedPersonnel = useMemo(() => {
  //     return personnelQ.data.items.find(
  //       (person) => person.id === formValues.personnelId,
  //     )
  //   }, [personnelQ.data.items, formValues.personnelId])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="min-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Pilot' : 'Add Pilots'}
          </DialogTitle>
        </DialogHeader>
        <DialogMain className="space-y-5">
          {/* No score attendance While adding pilot */}
          <form.AppField
            name="personnelId"
            children={(f) => (
              <f.CBasicSelect
                label="Pilot"
                placeholder="Select Pilot"
                options={personnelQ.data.items.map((person) => ({
                  label: `${person.firstName} ${person.lastName} (${[person.personnelType, person.qualification].filter(Boolean).join(', ')})`,
                  value: person.id,
                }))}
                valueAsNumber
              />
            )}
          />

          <form.AppField
            name="aircraftId"
            children={(f) => (
              <f.CBasicSelect
                label="Aircraft"
                placeholder="Select Aircraft to be used"
                options={aircraftsQ.data.items.map((aircraft) => ({
                  label: `${aircraft.name}`,
                  value: aircraft.id,
                }))}
                valueAsNumber
              />
            )}
          />

          <form.AppField
            name="remarks"
            children={(f) => (
              <f.CTextAreaField
                label="Remarks"
                placeholder="Enter any remarks or optionally "
              />
            )}
          />

          <hr className="my-4" />

          <FieldColumns className="gap-5" cols={2}>
            <form.AppField
              name="takeoffTime"
              children={(f) => (
                <f.CTextField
                  type="datetime-local"
                  label="Takeoff Time"
                  placeholder="Enter takeoff time"
                />
              )}
            />
            <form.AppField
              name="landingTime"
              children={(f) => (
                <f.CTextField
                  type="datetime-local"
                  label="Landing Time"
                  placeholder="Enter landing time"
                />
              )}
            />
            <form.AppField
              name="aircraftTime"
              children={(f) => (
                <f.CTextField
                  type="datetime-local"
                  label="Aircraft Time"
                  placeholder="Enter aircraft time"
                />
              )}
            />
          </FieldColumns>

          <div className="pb-2 mt-4 mb-4">
            <p className="text-sm text-muted-foreground font-bold border-b pb-2 mb-4">
              Evaluation
            </p>
            <FieldColumns className="gap-4" cols={3}>
              <form.AppField
                name="attendanceStatus"
                children={(f) => (
                  <f.CBasicSelect
                    label="Attendance Status"
                    placeholder="Select attendance status"
                    options={[
                      { label: 'Present', value: 'present' },
                      { label: 'Absent', value: 'absent' },
                      { label: 'Excused', value: 'excused' },
                    ]}
                  />
                )}
              />
              <form.AppField
                name="result"
                children={(f) => (
                  <f.CBasicSelect
                    label="Result"
                    placeholder="Select result"
                    options={[
                      { label: 'Passed', value: 'passed' },
                      { label: 'Failed', value: 'failed' },
                    ]}
                  />
                )}
              />
              <form.AppField
                name="score"
                children={(f) => (
                  <f.CTextField
                    label="Score"
                    placeholder="From 0 to 100"
                    valueAsNumber
                    type="number"
                    min={0}
                    max={100}
                  />
                )}
              />
            </FieldColumns>
          </div>
        </DialogMain>
        <DialogFooter className="py-2">
          {mode === 'add' && (
            <>
              <Button
                type="button"
                onClick={() => form.handleSubmit('savestay')}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.handleSubmit()}
              >
                Save & Close
              </Button>
            </>
          )}
          {mode === 'edit' && (
            <form.AppForm>
              <form.SubscribeButton label="Save" />
            </form.AppForm>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const defaultAssignmentFormData: FormData['assigments'][number] = {
  personnelId: null as unknown as number,
  attendanceStatus: null,
  score: null,
  result: null,
  remarks: null,
  aircraftId: null,
  takeoffTime: null,
  landingTime: null,
  aircraftTime: null,
}
