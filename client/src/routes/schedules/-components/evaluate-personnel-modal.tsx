import { useMemo } from 'react'
import { useSelector } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ClockIcon } from 'lucide-react'
import { baseFormOptions, useAppForm } from '@/components/form/tanstack-form'
import {
  FieldColumns,
  FieldLabel,
  FieldSet,
  Field,
  FieldError,
} from '@/components/ui/field'
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import { ATTENDANCE_STATUS_OPTIONS } from '@/config/attendance'
import { cn, formatStartEndTime, makeFullName } from '@/lib/utils'
import { trpc, trpcClient } from '@/trpc'
import type { TrpcRouterOutputs } from '@/trpc'
import type { ScheduleFormAssignment } from './type'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type Assignment =
  TrpcRouterOutputs['schedules']['getById']['assignments'][number]
type GradingTemplate = TrpcRouterOutputs['gradingTemplate']['getById']
type AircraftItem = TrpcRouterOutputs['aircraft']['getAll']['items'][number]

type GradeRow = ScheduleFormAssignment['participantGradings'][number]

type FormValues = {
  aircraft: { label: string; value: number } | null
  attendanceStatus: 'present' | 'absent' | 'excused' | null
  remarks: string
  takeoffTime: string | null
  landingTime: string | null
  aircraftTime: string | null
  grades: TGradingRowData[]

  // For Future Use
  briefingTime: string | null
}

type TGradingRowData = {
  gradingTemplateAttributeId: number
  gradingScaleOptionId: number | null
  obtainedScoreValue: number | null
  status: 'pending' | 'scored' | 'exempt'
}

const notApplicableGradeOption = {
  label: 'Not Applicable',
  value: -1,
  _style: {
    color: 'oklch(55.3% 0.195 38.402)',
  },
}

export default function EvaluatePersonnelModal({
  scheduleId,
  assignment,
  gradingTemplate,
  aircrafts,
  startDateTime,
  endDateTime,
  onClose,
}: {
  scheduleId: number
  assignment: Assignment
  gradingTemplate: GradingTemplate
  aircrafts: AircraftItem[]
  startDateTime: string | null
  endDateTime: string | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const gradingScaleOptions = gradingTemplate.gradingScale?.options
  const scaleOptions = useMemo(
    () => gradingScaleOptions ?? [],
    [gradingScaleOptions],
  )

  const mutation = useMutation({
    mutationFn: async (value: FormValues) => {
      const hasAircraft = value.aircraft != null

      await trpcClient.schedules.updateAssignment.mutate({
        scheduleId,
        assignmentId: assignment.id,
        aircraftId: value.aircraft?.value ?? null,
        attendanceStatus: value.attendanceStatus,
        aircraftTime: hasAircraft ? value.aircraftTime : null,
        takeoffTime: hasAircraft ? value.takeoffTime : null,
        landingTime: hasAircraft ? value.landingTime : null,
        briefingTime: value.briefingTime,
        remarks: value.remarks,
        obtainedGradeId: totals.incompleteCount > 0 ? null : totals.gradeId,
        obtainedScoreValue:
          totals.obtainedMarks === null || totals.incompleteCount > 0
            ? null
            : Number(totals.obtainedMarks.toFixed(2)),
        obtainedScorePercentage:
          totals.percentage === null || totals.incompleteCount > 0
            ? null
            : Number(totals.percentage.toFixed(2)),
        grades: value.grades,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(
        trpc.schedules.getById.queryFilter({ id: scheduleId }),
      )
      toast.success('Personnel updated')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const existingGradingAttributeMap = useMemo(() => {
    const map = new Map<number, TGradingRowData>()
    for (const grading of assignment.participantGradings) {
      map.set(grading.gradingTemplateAttributeId, {
        ...grading,
        obtainedScoreValue: grading.obtainedScoreValue
          ? Number(grading.obtainedScoreValue)
          : null,
      })
    }

    return map
  }, [assignment])

  const defaultValues: FormValues = {
    aircraft: assignment.aircraft
      ? {
          label: assignment.aircraft.name,
          value: assignment.aircraft.id,
        }
      : null,
    attendanceStatus: assignment.attendanceStatus,
    remarks: assignment.remarks ?? '',
    takeoffTime: assignment.takeoffTime,
    landingTime: assignment.landingTime,
    aircraftTime: assignment.aircraftTime,
    grades: gradingTemplate.gradingTemplateAttributes.map((attribute) => {
      const existing = existingGradingAttributeMap.get(attribute.id)
      return {
        gradingTemplateAttributeId: attribute.id,
        gradingScaleOptionId: existing?.gradingScaleOptionId ?? null,
        obtainedScoreValue: existing?.obtainedScoreValue ?? null,
        status: existing?.status ?? ('pending' as const),
      }
    }),
    briefingTime: assignment.briefingTime,
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => mutation.mutateAsync(value),
    ...baseFormOptions,
  })

  const takeoffTime = useSelector(
    form.store,
    (state) => state.values.takeoffTime,
  )
  const isHasAircraft = useSelector(
    form.store,
    (state) => !!state.values.aircraft,
  )

  const grades = useSelector(form.store, (state) => state.values.grades)

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const totals = useMemo(
    () => calcGradeTotals(grades, scaleOptions),
    [grades, scaleOptions],
  )

  const gradesOptions = useMemo(() => {
    const options =
      gradingTemplate.gradingScale?.options.map((option) => ({
        label: option.label,
        value: option.id,
      })) ?? []

    options.push(notApplicableGradeOption)
    return options
  }, [gradingTemplate])

  const handleGradeChange = (
    rowIndex: number,
    gradingOptionId: number | null,
  ) => {
    if (gradingOptionId === notApplicableGradeOption.value) {
      form.setFieldValue(`grades[${rowIndex}]`, (p) => ({
        ...p,
        gradingScaleOptionId: null,
        obtainedScoreValue: null,
        status: 'exempt',
      }))
      return
    }
    const option = scaleOptions.find(
      (_option) => _option.id === gradingOptionId,
    )
    if (!option) {
      form.setFieldValue(`grades[${rowIndex}]`, (p) => ({
        ...p,
        gradingScaleOptionId: null,
        obtainedScoreValue: null,
        status: 'pending',
      }))
      return
    } else {
      form.setFieldValue(`grades[${rowIndex}]`, (p) => ({
        ...p,
        gradingScaleOptionId: gradingOptionId,
        obtainedScoreValue: +option.point || 0,
        status: 'scored',
      }))
    }
  }

  return (
    <>
      <BlockingLoaderOverlay show={mutation.isPending} />
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[min(56rem,calc(100vw-2rem))] sm:max-w-[min(56rem,calc(100vw-2rem))]">
          <DialogHeader>
            <DialogTitle className="tracking-wide">
              Edit {makeFullName(assignment.personnel)} (
              {assignment.personnel?.personnelType})
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <ClockIcon size={16} />
              {formatStartEndTime(startDateTime, endDateTime)}
            </DialogDescription>
          </DialogHeader>
          <DialogMain className="space-y-5">
            <FieldColumns className="gap-5" cols={2}>
              <form.AppField
                name="aircraft"
                children={(field) => (
                  <field.CComboboxField
                    label="Aircraft"
                    placeholder="Select aircraft"
                    items={aircrafts.map((aircraft) => ({
                      label: aircraft.name,
                      value: aircraft.id,
                    }))}
                    onValueChange={(value) => {
                      field.handleChange(value)
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
                name="attendanceStatus"
                children={(field) => (
                  <FieldSet>
                    <FieldLabel>Attendance</FieldLabel>
                    <RadioGroup
                      className="flex gap-6 items-center"
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                        <Field
                          key={option.value}
                          orientation="horizontal"
                          className="w-max"
                        >
                          <RadioGroupItem
                            id={option.value}
                            value={option.value}
                          />
                          <FieldLabel htmlFor={option.value}>
                            {option.label}
                          </FieldLabel>
                        </Field>
                      ))}
                    </RadioGroup>
                    <FieldError errors={field.state.meta.errors} />
                  </FieldSet>
                )}
              />
              <form.AppField
                name="briefingTime"
                children={(field) => (
                  <field.CDateField time label="Briefing Time" />
                )}
              />
              {isHasAircraft ? (
                <>
                  <form.AppField
                    validators={{
                      onDynamic({ value }) {
                        if (
                          value &&
                          (!startDateTime ||
                            new Date(startDateTime) > new Date(value))
                        ) {
                          return 'Takeoff time must be greater than start time'
                        }
                        return undefined
                      },
                    }}
                    name="takeoffTime"
                    children={(field) => (
                      <field.CDateField time label="Takeoff Time" />
                    )}
                  />
                  <form.AppField
                    name="landingTime"
                    validators={{
                      onDynamic({ value }) {
                        if (
                          value &&
                          takeoffTime &&
                          new Date(takeoffTime) > new Date(value)
                        ) {
                          return 'Landing time must be after takeoff time'
                        }
                        return undefined
                      },
                    }}
                    children={(field) => (
                      <field.CDateField time label="Landing Time" />
                    )}
                  />
                  <form.AppField
                    name="aircraftTime"
                    children={(field) => (
                      <field.CDateField time label="Aircraft Time" />
                    )}
                  />
                </>
              ) : null}
            </FieldColumns>

            <form.AppField
              name="remarks"
              children={(field) => (
                <field.CTextAreaField
                  label="Remarks"
                  placeholder="Enter any remarks"
                />
              )}
            />

            <div className="space-y-3 border-t pt-4">
              <div>
                <p className="text-sm font-semibold">Grading</p>
              </div>
              <Table className="border rounded-md shadow-sm" fullGridLine>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-full">Category</TableHead>
                    <TableHead className="min-w-0">Grade</TableHead>
                    <TableHead className="w-28 text-center">Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradingTemplate.gradingTemplateAttributes.map(
                    (row, rowIndex) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.gradingAttribute?.name}</TableCell>
                        <TableCell className="min-w-0">
                          <form.AppField
                            name={`grades[${rowIndex}]`}
                            validators={{
                              onDynamic({ value }) {
                                if (value.status === 'pending') {
                                  return 'Required'
                                }
                                if (
                                  value.status === 'scored' &&
                                  !value.gradingScaleOptionId
                                ) {
                                  return 'Required'
                                }
                                return undefined
                              },
                            }}
                            children={(f) => {
                              return (
                                <f.CBasicSelect
                                  value={f.state.value.gradingScaleOptionId}
                                  onValueChange={(value) => {
                                    handleGradeChange(
                                      rowIndex,
                                      value === null ? null : Number(value),
                                    )
                                  }}
                                  placeholder="Select grade"
                                  options={gradesOptions}
                                  className={cn(
                                    'w-42',
                                    f.state.value.status === 'exempt' &&
                                      `text-orange-700`,
                                  )}
                                />
                              )
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          <form.Subscribe
                            selector={(state) =>
                              state.values.grades[rowIndex].obtainedScoreValue
                            }
                            children={(value) => {
                              return value != null ? formatMarks(value) : '—'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                  label="Obtained"
                  value={
                    totals.obtainedMarks === null
                      ? '—'
                      : `${formatMarks(totals.obtainedMarks)}/${formatMarks(totals.remainingMarks)}`
                  }
                />
                <SummaryCard
                  label="Exempted"
                  value={formatMarks(totals.exemptMarks)}
                />
                <SummaryCard
                  label="Percentage"
                  value={
                    totals.roundedPercentage === null
                      ? '—'
                      : `${totals.roundedPercentage}%`
                  }
                />
                <SummaryCard
                  label="Overall grade"
                  value={totals.gradeLabel === null ? '—' : totals.gradeLabel}
                  highlight
                />
              </div>
            </div>
          </DialogMain>
          <DialogFooter className="py-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <form.AppForm>
              <form.SubscribeButton label="Save" />
            </form.AppForm>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function calcGradeTotals(
  rowsArray: FormValues['grades'],
  scaleOptions: NonNullable<GradingTemplate['gradingScale']>['options'],
) {
  const categoryMarks = 100
  const paperMarks = rowsArray.length * categoryMarks
  const exemptCount = rowsArray.filter((row) => row.status === 'exempt').length
  const exemptMarks = exemptCount * categoryMarks
  const remainingMarks = paperMarks - exemptMarks
  const obtainedMarks = rowsArray
    .filter((row) => row.status !== 'exempt')
    .reduce((sum, row) => sum + (row.obtainedScoreValue ?? 0), 0)
  const percentage =
    remainingMarks === 0 ? 0 : (obtainedMarks / remainingMarks) * 100
  const roundedPercentage = Math.round(percentage)
  const grade = scaleOptions.find(
    (item) =>
      roundedPercentage >= Number(item.lowerBound) &&
      roundedPercentage <= Number(item.upperBound),
  )
  const incompleteCount = rowsArray.filter(
    (row) => row.status !== 'exempt' && row.gradingScaleOptionId == null,
  ).length

  const isAllGraded = incompleteCount === 0

  return {
    paperMarks,
    exemptMarks,
    remainingMarks,
    incompleteCount,

    //
    obtainedMarks: isAllGraded ? obtainedMarks : null,
    percentage: isAllGraded ? percentage : null,
    roundedPercentage: isAllGraded ? roundedPercentage : null,
    gradeLabel: isAllGraded ? (grade?.label ?? 'N/A') : null,
    gradeId: isAllGraded ? (grade?.id ?? null) : null,
  }
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-md border bg-muted/30 px-3 py-2',
        highlight && 'border-primary/30 bg-primary/5',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}
