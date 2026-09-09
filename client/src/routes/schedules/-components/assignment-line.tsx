import { z } from 'zod'
import { baseFormOptions, useAppForm } from '@/components/form/tanstack-form'
import { useSelector } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { FieldColumns } from '@/components/ui/field'
import { useState } from 'react'
import { formatDate } from '@/lib/date'
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
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { getPersonnelType, getPilotQualification } from '@repo/shared'
import toast from 'react-hot-toast'
import { trpc } from '@/trpc'
import AttendanceBadge, { ResultBadge } from './attendance-badge'
import { cn } from 'cn'
import type { FormMode } from '@/types/general'

const optionalTextSchema = z.string().optional().nullable()

export const assignmentSchema = z.object({
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
  remarks: z.string(),
  aircraftId: z.number().nullable(),
  takeoffTime: optionalTextSchema,
  landingTime: optionalTextSchema,
  aircraftTime: optionalTextSchema,
})

export type Assignment = z.infer<typeof assignmentSchema>

const defaultAssignmentFormData: Assignment = {
  personnelId: null as unknown as number,
  attendanceStatus: null,
  score: null,
  result: null,
  remarks: '',
  aircraftId: null,
  takeoffTime: null,
  landingTime: null,
  aircraftTime: null,
}

export default function AssignmentLine({
  values,
  onChange,
  mode,
}: {
  values: Assignment[]
  onChange: (values: Assignment[]) => void
  mode: 'create' | 'edit' | 'view'
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
      const set = new Set(values.map((v) => v.personnelId))
      if (set.has(assignment.personnelId)) {
        toast.error('Pilot already in the list')
        return
      }
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
        <p>Pilots List {values.length > 0 ? `(${values.length})` : ''}</p>
        {mode !== 'view' && (
          <Button
            size="sm"
            variant="secondary"
            className="border shadow-xs border-neutral-200"
            onClick={() => setAddFormOpen({ open: true })}
          >
            <PlusIcon className="size-4" />
            Add Pilot
          </Button>
        )}
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
                <TableHead className="border text-center w-10 ">S.No</TableHead>
                {[
                  'Pilot',
                  'Aircraft',
                  'Attendance',
                  'Result',
                  'Score',
                  'Remarks',
                ].map((header) => (
                  <TableHead className="border">{header}</TableHead>
                ))}
                {mode !== 'view' && (
                  <TableHead className="border text-center w-10">-</TableHead>
                )}
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
                    <TableCell className="align-top text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="border align-top">
                      <div className="max-w-[250px] grid">
                        <span className=" truncate">
                          {personnelName(assignment.personnelId)}
                        </span>
                        {_personnel?.personnelType && (
                          <span className="text-muted-foreground">
                            Type:{' '}
                            {getPersonnelType(_personnel.personnelType)?.name ??
                              _personnel.personnelType}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          ID: {_personnel?.code}{' '}
                        </span>
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
                      {assignment.aircraftId ? (
                        <div className="flex max-w-62.5 flex-col gap-1.5 py-1">
                          <span
                            className="truncate text-sm font-medium"
                            title={aircraftName(assignment.aircraftId)}
                          >
                            {aircraftName(assignment.aircraftId)}
                          </span>

                          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between gap-2">
                              <span>Takeoff</span>
                              <span className="tabular-nums text-foreground">
                                {assignment.takeoffTime
                                  ? formatDate(assignment.takeoffTime, true)
                                  : '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span>Landing</span>
                              <span className="tabular-nums text-foreground">
                                {assignment.landingTime
                                  ? formatDate(assignment.landingTime, true)
                                  : '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span>Aircraft</span>
                              <span className="tabular-nums text-foreground">
                                {assignment.aircraftTime
                                  ? formatDate(assignment.aircraftTime, true)
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          (No Aircraft)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="border align-top">
                      <AttendanceBadge
                        attendanceStatus={assignment.attendanceStatus}
                      />
                    </TableCell>
                    <TableCell className="border align-top">
                      <ResultBadge result={assignment.result} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        'border align-top tabular-nums',
                        assignment.score
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {assignment.score || '—'}
                    </TableCell>
                    <TableCell className="max-w-64 truncate align-top text-muted-foreground line-clamp-3">
                      {assignment.remarks || '—'}
                    </TableCell>
                    {mode !== 'view' && (
                      <TableCell
                        className="text-right border align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setAddFormOpen({ open: true, editIndex: index })
                          }}
                        >
                          <PencilIcon className="size-4 text-primary" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost-destructive"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onChange(values.filter((_, i) => i !== index))
                          }}
                        >
                          <TrashIcon className="size-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div
            className="py-8 text-center text-sm text-muted-foreground cursor-pointer hover:bg-muted"
            onClick={() => setAddFormOpen({ open: true })}
          >
            No Assignments added yet
          </div>
        )}
      </div>
      {addFormOpen.open && (
        <AssignmentsModal
          formMode={mode}
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

// -------------------------------------------------------------
// ---------------- Form Modal ---------------------------------
// -------------------------------------------------------------

function AssignmentsModal({
  onClose,
  onSave,
  mode,
  defaultValues,
  formMode,
}: {
  onClose: (open: boolean) => void
  onSave: (assignment: Assignment) => void
  mode: 'add' | 'edit'
  defaultValues?: Assignment
  formMode: FormMode
}) {
  const aircraftsQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

  const form = useAppForm({
    defaultValues: defaultValues || defaultAssignmentFormData,
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
    ...baseFormOptions,
  })

  const takeoffTime = useSelector(form.store, (s) => s.values.takeoffTime)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={formMode === 'create' ? 'min-w-xl' : 'min-w-2xl'}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Pilot' : 'Add Pilots'}
          </DialogTitle>
        </DialogHeader>
        <DialogMain className="space-y-5">
          <FieldColumns className="gap-5" cols={2}>
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
          </FieldColumns>

          <form.AppField
            name="remarks"
            children={(f) => (
              <f.CTextAreaField
                label="Remarks"
                placeholder="Enter any remarks or optionally "
              />
            )}
          />
          {formMode !== 'create' && (
            <>
              <hr className="my-4" />

              <FieldColumns className="gap-5" cols={2}>
                <form.AppField
                  name="takeoffTime"
                  children={(f) => (
                    <f.CDateField
                      time
                      label="Takeoff Time"
                      placeholder="Enter takeoff time"
                    />
                  )}
                />
                <form.AppField
                  name="landingTime"
                  validators={{
                    onDynamic({ value }) {
                      if (
                        value &&
                        new Date(value) > new Date(takeoffTime ?? '')
                      ) {
                        return 'Landing time must be after takeoff time'
                      }
                      return undefined
                    },
                  }}
                  children={(f) => (
                    <f.CDateField
                      time
                      label="Landing Time"
                      placeholder="Enter landing time"
                    />
                  )}
                />
                <form.AppField
                  name="aircraftTime"
                  children={(f) => (
                    <f.CDateField
                      time
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
            </>
          )}
        </DialogMain>
        <DialogFooter className="py-2" hidden={formMode === 'view'}>
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
