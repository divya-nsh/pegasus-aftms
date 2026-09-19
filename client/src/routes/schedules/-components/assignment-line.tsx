import { baseFormOptions, useAppForm } from '@/components/form/tanstack-form'
import { useSelector } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { FieldColumns } from '@/components/ui/field'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { formatDate } from '@/lib/date'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  ClockIcon,
  ArrowRightIcon,
} from 'lucide-react'
import {
  getPersonnelType,
  getPilotQualification,
  getQualificationLabel,
} from '@repo/shared'
import toast from 'react-hot-toast'
import { trpc } from '@/trpc'
import AttendanceBadge, { ResultBadge } from './attendance-badge'
import type { FormMode } from '@/types/general'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import BasicSelect from '@/components/inputs/basic-select'
import type { ScheduleFormAssignment } from './type'
import { required } from './shedule-form'

const defaultAssignmentFormData: ScheduleFormAssignment = {
  personnel: null,
  attendanceStatus: null,
  aircraft: null,
  // score: null,
  result: null,
  remarks: '',
  takeoffTime: null,
  landingTime: null,
  aircraftTime: null,
  briefingTime: null,
  obtainedGrade: null,
  obtainedScoreValue: null,
  obtainedScorePercentage: null,
  gradingAttributes: [],
}

export default function AssignmentLine({
  values,
  onChange,
  mode,
  startDateTime,
  endDateTime,
  gradingTemplateId,
}: {
  values: ScheduleFormAssignment[]
  onChange: (values: ScheduleFormAssignment[]) => void
  mode: 'create' | 'edit' | 'view'
  startDateTime?: string | null
  endDateTime?: string | null
  gradingTemplateId: number
}) {
  const [addFormOpen, setAddFormOpen] = useState<{
    open: boolean
    editIndex?: number
  }>({
    open: false,
  })

  useSuspenseQuery(trpc.gradingTemplate.getById.queryOptions(gradingTemplateId))

  const handleSave = (assignment: ScheduleFormAssignment) => {
    const nextAssignment = assignment.aircraft
      ? assignment
      : {
          ...assignment,
          takeoffTime: null,
          landingTime: null,
          aircraftTime: null,
        }

    if (addFormOpen.editIndex != null) {
      onChange(
        values.map((v, i) =>
          i === addFormOpen.editIndex ? nextAssignment : v,
        ),
      )
    } else {
      const set = new Set(values.map((v) => v.personnel))
      if (set.has(nextAssignment.personnel)) {
        toast.error('Personnel already in the list')
        return
      }
      onChange([...values, nextAssignment])
    }
  }

  const timeNotAvailable = !startDateTime || !endDateTime

  const openModal = () => {
    if (timeNotAvailable) {
      toast.error('Please set the schedule time first')
      return
    }
    setAddFormOpen({ open: true })
  }

  return (
    <div>
      <div className="border-b pb-2 text-sm font-semibold flex justify-between items-center">
        <p>Personnels {values.length > 0 ? `(${values.length})` : ''}</p>
        {mode !== 'view' && (
          <Button
            size="sm"
            variant="secondary"
            className="border shadow-xs border-neutral-200 border-dashed"
            onClick={openModal}
          >
            <PlusIcon className="size-4" />
            Add
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
                  // 'Score',
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
                return (
                  <TableRow
                    key={`${assignment.personnel?.value}-${index}`}
                    onDoubleClick={() =>
                      setAddFormOpen({ open: true, editIndex: index })
                    }
                  >
                    <TableCell className="align-top text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="border align-top">
                      <div className="max-w-62.5 grid">
                        <span className=" truncate">
                          {assignment.personnel?.label || 'N/A'}
                        </span>
                        {assignment.personnel?.type && (
                          <span className="text-muted-foreground">
                            Type:{' '}
                            {getPersonnelType(assignment.personnel.type)
                              ?.name ?? assignment.personnel.type}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          ID: {assignment.personnel?.value}{' '}
                        </span>
                        {assignment.personnel?.qualification && (
                          <span className="text-muted-foreground">
                            Qualification:{' '}
                            {getQualificationLabel(
                              assignment.personnel.qualification,
                            )}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border align-top">
                      {assignment.aircraft ? (
                        <div className="flex max-w-62.5 flex-col gap-1.5 py-1">
                          <span
                            className="truncate text-sm font-medium"
                            title={assignment.aircraft.label}
                          >
                            {assignment.aircraft.label}
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
                    {/* <TableCell
                      className={cn(
                        'border align-top tabular-nums',
                        assignment.score
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {assignment.score || '—'}
                    </TableCell> */}
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
            onClick={openModal}
          >
            No Assignments added yet
          </div>
        )}
      </div>
      {addFormOpen.open && (
        <AssignmentsModal
          gradingTemplateId={gradingTemplateId}
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          formMode={mode}
          key={addFormOpen.editIndex ?? 'add'}
          onClose={(open) => setAddFormOpen({ open })}
          mode={addFormOpen.editIndex != null ? 'edit' : 'add'}
          items={values}
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
  startDateTime,
  endDateTime,
  items,
  gradingTemplateId,
}: {
  onClose: (open: boolean) => void
  onSave: (assignment: ScheduleFormAssignment) => void
  mode: 'add' | 'edit'
  defaultValues?: ScheduleFormAssignment
  formMode: FormMode
  startDateTime?: string | null
  endDateTime?: string | null
  items: ScheduleFormAssignment[]
  gradingTemplateId: number
}) {
  const [warning, setWarning] = useState<ReactNode>('')
  const aircraftsQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

  const form = useAppForm({
    defaultValues: defaultValues || defaultAssignmentFormData,
    onSubmit: ({ value, meta }) => {
      if (warning) {
        const isConfirm = confirm(
          'Selected pilots have conflicting schedules. Are you sure you want to add him to line',
        )
        if (!isConfirm) {
          return
        }
      }
      onSave(value)
      form.reset()
      if (meta !== 'savestay') {
        onClose(false)
      }
    },
    ...baseFormOptions,
  })

  const { data: gradingTemplate } = useSuspenseQuery(
    trpc.gradingTemplate.getById.queryOptions(gradingTemplateId),
  )

  const selectedPersonnelId = useSelector(
    form.store,
    (s) => s.values.personnel?.value,
  )

  const personnelOptions = useMemo(() => {
    return personnelQ.data.items.map((person) => ({
      label: `${person.firstName} ${person.lastName}`,
      value: person.id,
      type: person.personnelType,
      qualification: person.qualification,
    }))
  }, [personnelQ.data])

  const takeoffTime = useSelector(form.store, (s) => s.values.takeoffTime)
  const isHasAircraft = useSelector(form.store, (s) => !!s.values.aircraft)

  const selectedPersonnel = useMemo(() => {
    return personnelQ.data.items.find(
      (person) => person.id === selectedPersonnelId,
    )
  }, [personnelQ.data.items, selectedPersonnelId])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={'min-w-3xl'}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Pilot' : 'Add Pilots'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <ClockIcon size={16} /> {formatDate(startDateTime!, true)} -{' '}
            {formatDate(endDateTime!, true)}
          </DialogDescription>
        </DialogHeader>
        <DialogMain className="space-y-5">
          <FieldColumns className="gap-5" cols={2}>
            <form.AppField
              name="personnel"
              validators={{
                onDynamic: ({ value }) => required(value),
              }}
              children={(f) => (
                <f.CComboboxField
                  required
                  itemToStringLabel={(item) =>
                    `${item.label} (${item.type} - ${item.qualification})`
                  }
                  label="Personnel"
                  placeholder="Select Personnel"
                  items={personnelOptions}
                  onValueChange={(value) => {
                    if (!value) return
                    if (
                      items.some(
                        (item) => item.personnel?.value === value.value,
                      )
                    ) {
                      toast.error('Personnel already in the list')
                      return
                    }
                    f.handleChange(value)
                  }}
                  // onCommited={async (value) => {
                  //   if (!value) return
                  //   const id = 'jfsdafklsdjalkfjd'
                  //   toast.loading('Checking for Pilot Availability....', { id })
                  //   try {
                  //     const conflictingShedules =
                  //       await trpcClient.schedules.checkConflictingSchedule.query(
                  //         {
                  //           personnelId: Number(value),
                  //           startDateTime,
                  //           endDateTime,
                  //         },
                  //       )
                  //     if (conflictingShedules.length) {
                  //       setWarning(
                  //         <>
                  //           <ol className=" list-decimal">
                  //             {conflictingShedules.map((v) => (
                  //               <li className="flex justify-between">
                  //                 {formatDate(v.startDateTime, true)}{' '}
                  //                 <ArrowRightIcon />{' '}
                  //                 {formatDate(v.endDateTime, true)}
                  //                 <span className="ml-4 font-bold">
                  //                   {v.scheduleNumber}
                  //                 </span>
                  //               </li>
                  //             ))}
                  //           </ol>
                  //         </>,
                  //       )
                  //       toast.error('Warnning Shedule Conflict', { id })
                  //     } else {
                  //       toast.success('No Conflicting Shedules', { id })
                  //     }
                  //   } catch (error) {
                  //     toast.error(
                  //       `Error Checking Pilot Availability: ${(error as any).message}`,
                  //       { id },
                  //     )
                  //   }
                  // }}
                />
              )}
            />

            <form.AppField
              name="aircraft"
              children={(f) => (
                <f.CComboboxField
                  label="Aircraft"
                  placeholder="Select Aircraft to be used"
                  items={aircraftsQ.data.items.map((aircraft) => ({
                    label: `${aircraft.name}`,
                    value: aircraft.id,
                  }))}
                  onValueChange={(value) => {
                    f.handleChange(value)
                    if (!value) {
                      form.setFieldValue('takeoffTime', null)
                      form.setFieldValue('landingTime', null)
                      form.setFieldValue('aircraftTime', null)
                    }
                  }}
                />
              )}
            />
            <form.AppField
              name="briefingTime"
              children={(f) => (
                <f.CDateField
                  time
                  label="Briefing Time"
                  placeholder="Enter briefing time"
                />
              )}
            />
          </FieldColumns>

          {selectedPersonnel && (
            <div className="text-sm bg-muted/50 p-2 rounded-md grid grid-cols-[120px_1fr] gap-4 gap-y-2 text-muted-foreground">
              <span> Qualification: </span>
              <span>
                {getQualificationLabel(selectedPersonnel.qualification) ||
                  'N/A'}
              </span>
              <span> Medical Status: </span>
              <span>
                {selectedPersonnel.medicalStatus}{' '}
                {/* {selectedPersonnel.medicalValidUntil &&
                  `Expired at ${selectedPersonnel.medicalValidUntil}`} */}
              </span>
            </div>
          )}

          {warning && (
            <Alert variant="warning">
              <AlertTriangleIcon />
              <AlertTitle>Shedule Conflict</AlertTitle>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}

          <form.AppField
            name="remarks"
            children={(f) => (
              <f.CTextAreaField
                label="Remarks"
                placeholder="Enter any remarks or optionally "
              />
            )}
          />
          <>
            {isHasAircraft ? (
              <FieldColumns className="gap-5 border-t pt-4" cols={2}>
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
            ) : null}

            {/* <div className="pb-2 mt-4 mb-4">
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
            </div> */}

            <div className="pb-2 mt-4 mb-4">
              <p className="text-sm text-muted-foreground font-bold border-b pb-2 mb-4">
                Grading (Template: {gradingTemplate.name})
              </p>
              <form.AppField
                name="attendanceStatus"
                children={(f) => (
                  <f.CBasicSelect
                    className="my-4 max-w-60"
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
              <GradingGrid gradingTemplateId={gradingTemplateId} />
            </div>
          </>
        </DialogMain>
        <DialogFooter className="py-2" hidden={formMode === 'view'}>
          {mode === 'add' && (
            <>
              <Button
                type="button"
                onClick={() => form.handleSubmit('savestay')}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.handleSubmit()}
              >
                Add & Close
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

const GradingGrid = ({ gradingTemplateId }: { gradingTemplateId: number }) => {
  const { data: gradingTemplate } = useSuspenseQuery(
    trpc.gradingTemplate.getById.queryOptions(gradingTemplateId),
  )

  const [data, setData] = useState(
    gradingTemplate.gradingTemplateAttributes.reduce<
      Record<number, { gradeId: number; weight: number }>
    >((acc, item) => {
      acc[item.id] = {
        gradeId: 0,
        weight: Number(item.weight),
      }
      return acc
    }, {}),
  )

  const gradeOptionsMap = useMemo(() => {
    const map = new Map<
      number,
      { label: string; value: number; point: number }
    >()
    gradingTemplate.gradingScale!.options.forEach((item) => {
      map.set(item.id, {
        label: `${item.label} (${+item.point})`,
        value: item.id,
        point: +item.point,
      })
    })
    return map
  }, [gradingTemplate])

  const totalGrad = (() => {
    // Since Each Score is in scale 0-100 it return percentage
    const totalScorePercent = calculateWeightedScore(
      Object.values(data).map((item) => ({
        score: gradeOptionsMap.get(Number(item.gradeId))?.point ?? 0,
        weight: Number(item.weight),
      })),
    )
    // Scale range is inclusive
    const roundedScore = Math.round(totalScorePercent)
    const grade = gradingTemplate.gradingScale!.options.find(
      (item) =>
        roundedScore >= +item.lowerBound && roundedScore <= +item.upperBound,
    )

    return {
      totalMarks: roundedScore,
      gradeLabel: grade?.label ?? 'N/A',
      gradeId: grade?.id ?? 0,
    }
  })()

  return (
    <Table className="border rounded-md shadow-sm" fullGridLine>
      <TableHeader>
        <TableRow className=" bg-muted/30 ">
          <TableHead className="border">Attribute</TableHead>
          {/* <TableHead className=" text-center">Weightage</TableHead> */}
          <TableHead>Grade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gradingTemplate.gradingTemplateAttributes.map((attribute) => {
          return (
            <TableRow>
              <TableCell>{attribute.gradingAttribute!.name}</TableCell>
              {/* <TableCell className="text-center">{attribute.weight}</TableCell> */}
              <TableCell>
                <BasicSelect
                  value={data[attribute.id]?.gradeId}
                  onValueChange={(value) => {
                    const gradeId = Number(value)
                    setData((prev) => ({
                      ...prev,
                      [attribute.id]: {
                        gradeId: Number.isFinite(gradeId) ? gradeId : 0,
                        weight: Number(attribute.weight),
                      },
                    }))
                  }}
                  placeholder="Pick a Grade"
                  options={gradingTemplate.gradingScale!.options.map(
                    (option) => ({
                      label: `${option.label} (${+option.point})`,
                      value: option.id,
                    }),
                  )}
                  valueAsNumber
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="text-right">
            <div className="flex flex-col gap-2">
              <span>
                <span className="font-bold w-20 inline-block">
                  Total Score:
                </span>{' '}
                {totalGrad.totalMarks}%
              </span>
              <span>
                <span className="font-bold w-20 inline-block">Grade:</span>{' '}
                {totalGrad.gradeLabel} Grade
              </span>
            </div>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

type ScoreItem = {
  score: number
  weight: number
}

// All items Score must be in same Scale for this give meanigfull output
function calculateWeightedScore(items: ScoreItem[]): number {
  const totalWeight = items.reduce((sum, item) => sum + Number(item.weight), 0)

  if (totalWeight === 0) return 0

  const weightedTotal = items.reduce(
    (sum, item) => sum + Number(item.score) * Number(item.weight),
    0,
  )

  return weightedTotal / totalWeight
}
