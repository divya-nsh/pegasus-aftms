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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import { ATTENDANCE_STATUS_OPTIONS } from '@/config/attendance'
import { cn, formatStartEndTime, makeFullName } from '@/lib/utils'
import { trpc, trpcClient } from '@/trpc'
import type { TrpcRouterOutputs } from '@/trpc'
import {
  MAX_CATEGORY_MARKS,
  applyGradeOption,
  calcGradeTotals,
  formatMarks,
  setRowExempt,
} from './grade-helpers'
import type { GradeRowData, GradeTotals } from './grade-helpers'

type Assignment =
  TrpcRouterOutputs['schedules']['getById']['assignments'][number]
type GradingTemplate = TrpcRouterOutputs['gradingTemplate']['getById']
type AircraftItem = TrpcRouterOutputs['aircraft']['getAll']['items'][number]
type AttendanceStatus = 'present' | 'absent' | 'excused'

type FormValues = {
  aircraft: { label: string; value: number } | null
  attendanceStatus: AttendanceStatus | null
  remarks: string
  takeoffTime: string | null
  landingTime: string | null
  aircraftTime: string | null
  grades: GradeRowData[]

  // For future use
  briefingTime: string | null
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

  const gradeSelectOptions = useMemo(
    () => scaleOptions.map((o) => ({ label: o.label, value: o.id })),
    [scaleOptions],
  )

  const mutation = useMutation({
    mutationFn: async (value: FormValues) => {
      // Totals come from the submitted values, not from render state.
      const totals = calcGradeTotals(value.grades, scaleOptions)
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
        obtainedGradeId: totals.gradeId,
        // Overall score is always out of 100, so score === percentage.
        obtainedScoreValue: totals.overall,
        obtainedScorePercentage: totals.overall,
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

  const defaultValues = useMemo<FormValues>(() => {
    const existingByAttributeId = new Map(
      assignment.participantGradings.map((g) => [
        g.gradingTemplateAttributeId,
        g,
      ]),
    )

    return {
      aircraft: assignment.aircraft
        ? { label: assignment.aircraft.name, value: assignment.aircraft.id }
        : null,
      attendanceStatus: assignment.attendanceStatus,
      remarks: assignment.remarks ?? '',
      takeoffTime: assignment.takeoffTime,
      landingTime: assignment.landingTime,
      aircraftTime: assignment.aircraftTime,
      briefingTime: assignment.briefingTime,
      grades: gradingTemplate.gradingTemplateAttributes.map((attribute) => {
        const existing = existingByAttributeId.get(attribute.id)
        return {
          gradingTemplateAttributeId: attribute.id,
          gradingScaleOptionId: existing?.gradingScaleOptionId ?? null,
          // `!= null` so a saved score of 0 is kept.
          obtainedScoreValue:
            existing?.obtainedScoreValue != null
              ? Number(existing.obtainedScoreValue)
              : null,
          status: existing?.status ?? 'pending',
        }
      }),
    }
  }, [assignment, gradingTemplate])

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => mutation.mutateAsync(value),
    ...baseFormOptions,
  })

  const isHasAircraft = useSelector(
    form.store,
    (state) => !!state.values.aircraft,
  )

  const updateRow = (
    rowIndex: number,
    update: (row: GradeRowData) => GradeRowData,
  ) => {
    form.setFieldValue(
      `grades[${rowIndex}]`,
      update(form.state.values.grades[rowIndex]),
    )
  }

  /** Apply one grade to every row that isn't Not Applicable. */
  const setAllGrades = (optionId: number) => {
    form.setFieldValue(
      'grades',
      form.state.values.grades.map((row) =>
        applyGradeOption(row, optionId, scaleOptions),
      ),
    )
  }

  const setAllExempt = () => {
    form.setFieldValue(
      'grades',
      form.state.values.grades.map((row) => setRowExempt(row, true)),
    )
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
                      className="flex items-center gap-6"
                      value={field.state.value ?? ''}
                      onValueChange={(value) =>
                        field.handleChange(value as AttendanceStatus)
                      }
                    >
                      {ATTENDANCE_STATUS_OPTIONS.map((option) => {
                        const id = `attendance-${option.value}`
                        return (
                          <Field
                            key={option.value}
                            orientation="horizontal"
                            className="w-max"
                          >
                            <RadioGroupItem id={id} value={option.value} />
                            <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
                          </Field>
                        )
                      })}
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
                    name="takeoffTime"
                    validators={{
                      onDynamic({ value }) {
                        if (!value) return undefined
                        if (!startDateTime) return 'Start time is not set'
                        const takeoff = new Date(value)
                        if (Number.isNaN(takeoff.getTime())) {
                          return 'Invalid takeoff time'
                        }
                        if (
                          takeoff.getTime() < new Date(startDateTime).getTime()
                        ) {
                          return 'Takeoff time must be after schedule start time'
                        }
                        return undefined
                      },
                    }}
                    children={(field) => (
                      <field.CDateField time label="Takeoff Time" />
                    )}
                  />
                  <form.AppField
                    name="landingTime"
                    validators={{
                      // Re-run when takeoff changes, so stale errors clear.
                      onDynamic({ value, fieldApi }) {
                        const takeoff =
                          fieldApi.form.getFieldValue('takeoffTime')
                        if (
                          value &&
                          takeoff &&
                          new Date(takeoff) > new Date(value)
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm font-semibold">Grading</p>
                <div className="flex gap-3">
                  {gradeSelectOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setAllGrades(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-orange-700"
                    onClick={setAllExempt}
                  >
                    Not Applicable
                  </Button>
                </div>
              </div>

              <Table
                className="rounded-md border border-l-0 border-r-0 shadow-sm"
                fullGridLine
              >
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-full">Category</TableHead>
                    <TableHead className="min-w-0">Grade</TableHead>
                    <TableHead className="w-16 text-center">N/A</TableHead>
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
                                if (value.status === 'pending')
                                  return 'Required'
                                if (
                                  value.status === 'scored' &&
                                  !value.gradingScaleOptionId
                                ) {
                                  return 'Required'
                                }
                                return undefined
                              },
                            }}
                            children={(f) =>
                              f.state.value.status === 'exempt' ? (
                                <span className="flex h-9 w-42 items-center text-sm text-muted-foreground">
                                  Not applicable
                                </span>
                              ) : (
                                <f.CBasicSelect
                                  value={f.state.value.gradingScaleOptionId}
                                  onValueChange={(value) =>
                                    updateRow(rowIndex, (r) =>
                                      applyGradeOption(
                                        r,
                                        value === null ? null : Number(value),
                                        scaleOptions,
                                      ),
                                    )
                                  }
                                  placeholder="Select grade"
                                  options={gradeSelectOptions}
                                  className="w-42"
                                />
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <form.Subscribe
                            selector={(state) =>
                              state.values.grades[rowIndex]?.status === 'exempt'
                            }
                            children={(isExempt) => (
                              <input
                                type="checkbox"
                                className="size-4 cursor-pointer accent-primary"
                                aria-label={`Not applicable: ${row.gradingAttribute?.name ?? ''}`}
                                checked={isExempt}
                                onChange={(e) =>
                                  updateRow(rowIndex, (r) =>
                                    setRowExempt(r, e.target.checked),
                                  )
                                }
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          <form.Subscribe
                            selector={(state) =>
                              state.values.grades[rowIndex]?.obtainedScoreValue
                            }
                            children={(value) =>
                              value != null ? formatMarks(value) : '—'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>

              <form.Subscribe
                selector={(state) => state.values.grades}
                children={(grades) => (
                  <GradingSummary
                    totals={calcGradeTotals(grades, scaleOptions)}
                  />
                )}
              />
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

function GradingSummary({ totals }: { totals: GradeTotals }) {
  const { overall, gradedCount, totalCount, exemptCount, gradeLabel } = totals
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard
        label="Overall score"
        value={
          overall === null
            ? '—'
            : `${formatMarks(overall)}/${MAX_CATEGORY_MARKS}`
        }
      />
      <SummaryCard
        label="Graded"
        value={`${gradedCount}/${totalCount - exemptCount}`}
      />
      <SummaryCard label="Exempted" value={String(exemptCount)} />
      <SummaryCard label="Overall grade" value={gradeLabel ?? '—'} highlight />
    </div>
  )
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
