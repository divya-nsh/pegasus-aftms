/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { createFileRoute } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import PageCard from '@/components/layout/PageCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc, trpcClient } from '@/trpc'
import { useAppForm } from '@/components/form/tanstack-form'
import { cn, makeFullName } from '@/lib/utils'
import { getQualificationLabel } from '@repo/shared'
import { baseTableOptions } from '@/components/table/table'
import { useMemo } from 'react'
import { formatDate } from '@/lib/date'
import { format, isSameDay } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogMain,
  DialogTitle,
} from '@/components/ui/dialog'
import MissionStatusBadge from './-components/mission-stage-bar'
import toast from 'react-hot-toast'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'

export const Route = createFileRoute('/schedules/$id/grade')({
  component: RouteComponent,
})

const notApplicableOption = {
  label: 'Not Applicable',
  value: -1,
  _style: {
    color: 'oklch(55.3% 0.195 38.402)',
  },
}

type TRowData = {
  assignmentId: number
  personnelId: number
  personnel: {
    fullName: string
  }

  gradingAttributes: {
    gradingAttributeId: number
    gradingOptionId: number | null
    obtainedScoreValue: number | null
    status: 'pending' | 'scored' | 'exempt'
  }[]

  obtainedGradeId: number | null
  obtainedScoreValue: number | null
  obtainedScorePercentage: number | null
}

type TGradingScaleOption = {
  id: number
  lowerBound: string
  upperBound: string
  label: string
  point: string
}

function RouteComponent() {
  const parmas = Route.useParams()

  return (
    <PageCard>
      <div className="px-3 pb-2 border-b">
        <p className="text-xl font-bold">Grading Sheet</p>
      </div>
    </PageCard>
  )
}

function calcPersonGrades(
  attributesRows: TRowData['gradingAttributes'],
  scale: TGradingScaleOption[],
) {
  const categoryMarks = 100
  let totalScore = 0
  let exemptedAttributesCount = 0
  let isAllGraded = true

  for (const attribute of attributesRows) {
    if (attribute.status === 'exempt') {
      exemptedAttributesCount++
      continue
    }

    if (
      attribute.status !== 'scored' ||
      attribute.gradingOptionId == null ||
      attribute.gradingOptionId === notApplicableOption.value
    ) {
      isAllGraded = false
    }

    totalScore += attribute.obtainedScoreValue ?? 0
  }

  const maxMarks =
    (attributesRows.length - exemptedAttributesCount) * categoryMarks
  const percentage = maxMarks > 0 ? (totalScore / maxMarks) * 100 : 0
  const roundedPercentage = Math.round(percentage)

  const overallGrade = scale.find(
    (option) =>
      roundedPercentage >= Number(option.lowerBound) &&
      roundedPercentage <= Number(option.upperBound),
  )

  return {
    totalScore: Number(totalScore.toFixed(2)),
    exemptedAttributesCount,
    maxMarks,
    percentage: Number(percentage.toFixed(2)),
    roundedPercentage,
    isAllGraded,
    overallGrade,
  }
}

function KeyValuePair({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-1 text-sm', className)}>
      <span className="font-medium text-xs text-gray-700 tracking-wider">
        {label}
      </span>
      <span className=" ">{value}</span>
    </div>
  )
}

function formatStartEndTime(start: string | null, end: string | null) {
  if (!start && !end) return 'N/A'
  if (!end && start) return formatDate(start, true)
  if (isSameDay(start!, end!)) {
    // Compact Format if same day
    return `${format(start!, 'dd MMM YYY')} , ${format(start!, 'hh:mm')} - ${format(end!, 'hh:mm')}`
  }
  return `${formatDate(start!, true)} - ${formatDate(end!, true)}`
}

export function GraddingSheetModal({
  scheduleId,
  onClose,
}: {
  scheduleId: number
  onClose: () => void
}) {
  const { data: schedule } = useSuspenseQuery(
    trpc.schedules.getById.queryOptions({ id: scheduleId }),
  )

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (
      assignments: Parameters<
        typeof trpcClient.schedules.updateAssignmentGrades.mutate
      >[0]['assignments'],
    ) =>
      trpcClient.schedules.updateAssignmentGrades.mutate({
        scheduleId: schedule.id,
        assignments,
      }),
    onSuccess: async () => {
      await queryClient.resetQueries(trpc.schedules.pathFilter())
      toast.success('Grading saved successfully')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const existingGradingMap = useMemo(() => {
    const map = new Map<string, TRowData['gradingAttributes'][0]>()
    for (const assignment of schedule.assignments) {
      for (const grading of assignment.participantGradings) {
        map.set(`${assignment.id}-${grading.gradingTemplateAttributeId}`, {
          gradingAttributeId: grading.gradingTemplateAttributeId,
          gradingOptionId: grading.gradingScaleOptionId,
          obtainedScoreValue: grading.obtainedScoreValue
            ? Number(grading.obtainedScoreValue)
            : null,
          status: grading.status,
        })
      }
    }
    return map
  }, [schedule])

  const templateQ = useSuspenseQuery(
    trpc.gradingTemplate.getById.queryOptions(
      schedule.mission!.gradingTemplateId!,
    ),
  )

  const gradesOptions = useMemo(() => {
    const options =
      templateQ.data.gradingScale?.options.map((option) => ({
        label: option.label,
        value: option.id,
      })) ?? []

    options.push(notApplicableOption)
    return options
  }, [templateQ.data.gradingScale?.options])

  const form = useAppForm({
    ...baseTableOptions,
    defaultValues: schedule.assignments.map((assignment) => {
      const rowData: TRowData = {
        assignmentId: assignment.id,
        personnelId: assignment.personnelId,
        personnel: {
          fullName: makeFullName(assignment.personnel),
        },
        gradingAttributes: templateQ.data.gradingTemplateAttributes.map(
          (attribute) => {
            const existingGrading = existingGradingMap.get(
              `${assignment.id}-${attribute.id}`,
            )
            return {
              gradingAttributeId: attribute.id,
              gradingOptionId:
                existingGrading?.status === 'exempt'
                  ? notApplicableOption.value
                  : (existingGrading?.gradingOptionId ?? null),
              obtainedScoreValue: existingGrading?.obtainedScoreValue ?? null,
              status: existingGrading?.status ?? 'pending',
            }
          },
        ),
        obtainedGradeId: assignment.obtainedGradeId,
        obtainedScoreValue: assignment.obtainedScoreValue
          ? Number(assignment.obtainedScoreValue)
          : null,
        obtainedScorePercentage: assignment.obtainedScorePercentage
          ? Number(assignment.obtainedScorePercentage)
          : null,
      }
      return rowData
    }),
    onSubmit: async ({ value }) => {
      const scale = templateQ.data.gradingScale?.options ?? []
      const incompleteNames: string[] = []

      const scoredRows = value.map((row) => {
        const stats = calcPersonGrades(row.gradingAttributes, scale)
        if (!stats.isAllGraded) {
          incompleteNames.push(row.personnel.fullName)
        }

        return {
          ...row,
          obtainedGradeId: stats.overallGrade?.id ?? null,
          obtainedScoreValue: stats.totalScore,
          obtainedScorePercentage: stats.percentage,
        }
      })

      if (incompleteNames.length > 0) {
        toast.error(
          `Please score every category before saving (${incompleteNames.length} remaining)`,
        )
        return
      }

      scoredRows.forEach((row, rowIndex) => {
        form.setFieldValue(`[${rowIndex}].obtainedGradeId`, row.obtainedGradeId)
        form.setFieldValue(
          `[${rowIndex}].obtainedScoreValue`,
          row.obtainedScoreValue,
        )
        form.setFieldValue(
          `[${rowIndex}].obtainedScorePercentage`,
          row.obtainedScorePercentage,
        )
      })

      await mutation.mutateAsync(
        schedule.assignments.map((assignment, rowIndex) => {
          const row = scoredRows[rowIndex]!
          return {
            personnelId: assignment.personnelId,
            aircraftId: assignment.aircraftId ?? null,
            attendanceStatus: assignment.attendanceStatus,
            aircraftTime: assignment.aircraftTime,
            takeoffTime: assignment.takeoffTime,
            landingTime: assignment.landingTime,
            result: assignment.result ?? null,
            remarks: assignment.remarks ?? undefined,
            obtainedGradeId: row.obtainedGradeId,
            obtainedScoreValue: row.obtainedScoreValue,
            obtainedScorePercentage: row.obtainedScorePercentage,
            grades: row.gradingAttributes.map((grade) => ({
              gradingTemplateAttributeId: grade.gradingAttributeId,
              gradingScaleOptionId:
                grade.status === 'exempt' ||
                grade.gradingOptionId === notApplicableOption.value
                  ? null
                  : grade.gradingOptionId,
              obtainedScoreValue: grade.obtainedScoreValue,
              status: grade.status,
            })),
          }
        }),
      )
    },
  })

  const handleGradeChange = (
    rowIndex: number,
    attributeIndex: number,
    gradingOptionId: number | null,
  ) => {
    if (gradingOptionId === notApplicableOption.value) {
      form.setFieldValue(
        `[${rowIndex}].gradingAttributes[${attributeIndex}]`,
        (p) => ({
          ...p,
          gradingOptionId,
          obtainedScoreValue: null,
          status: 'exempt',
        }),
      )
      return
    }
    const option = templateQ.data.gradingScale?.options.find(
      (_option) => _option.id === gradingOptionId,
    )
    if (!option) {
      form.setFieldValue(
        `[${rowIndex}].gradingAttributes[${attributeIndex}]`,
        (p) => ({
          ...p,
          gradingOptionId: null,
          obtainedScoreValue: null,
          status: 'pending',
        }),
      )
      return
    }
    form.setFieldValue(
      `[${rowIndex}].gradingAttributes[${attributeIndex}]`,
      (p) => ({
        ...p,
        gradingOptionId,
        obtainedScoreValue: +option.point || 0,
        status: 'scored',
      }),
    )
  }

  if (!schedule.mission!.gradingTemplateId) {
    throw new Error('Event Mission Has no Grading Template Configured')
  }

  return (
    <>
      <BlockingLoaderOverlay show={mutation.isPending} />
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="min-w-6xl min-h-[95vh]">
          <DialogHeader>
            <DialogTitle>Grading Sheet #{schedule.scheduleNumber}</DialogTitle>
          </DialogHeader>
          <DialogMain>
            <div className="border px-4 py-4 mb-4 rounded-md relative">
              <div className="grid gap-3 grid-cols-3">
                <KeyValuePair
                  label="Shedule Number"
                  value={schedule.scheduleNumber}
                />
                <KeyValuePair label="Shedule Name" value={schedule.name} />
                <KeyValuePair
                  label="Event Type"
                  value={schedule.mission!.missionType}
                />
                <KeyValuePair
                  label="Status"
                  value={<MissionStatusBadge status={schedule.status} />}
                />
                <KeyValuePair
                  label="Time Slot"
                  value={formatStartEndTime(
                    schedule.startDateTime,
                    schedule.endDateTime!,
                  )}
                />
                <KeyValuePair
                  label="Grading Template"
                  value={templateQ.data.name}
                />
              </div>
            </div>
            <Table className="border shadow-xs" fullGridLine>
              <TableHeader>
                <TableRow className="bg-muted/80">
                  <TableHead>S.No</TableHead>
                  <TableHead>Name</TableHead>
                  {templateQ.data.gradingTemplateAttributes.map((attribute) => (
                    <TableHead key={attribute.id} className="min-w-25 max-w-52">
                      {attribute.gradingAttribute!.name}
                    </TableHead>
                  ))}

                  <TableHead className="text-center ">Total Score</TableHead>
                  <TableHead className="text-center ">Overall Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.assignments!.map((participant, rowIndex) => (
                  <TableRow key={participant.id}>
                    <TableCell>{rowIndex + 1}</TableCell>
                    <TableHead>
                      <div className=" py-2">
                        <p>{makeFullName(participant.personnel)}</p>
                        <p className="text-muted-foreground text-sm">
                          {participant.personnel?.personnelType}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Qualification:{' '}
                          {getQualificationLabel(
                            participant.personnel?.qualification ?? null,
                          )}
                        </p>
                      </div>
                    </TableHead>

                    {templateQ.data.gradingTemplateAttributes.map(
                      (attribute, attributeIndex) => (
                        <TableCell key={attribute.id}>
                          <form.AppField
                            validators={{
                              onChange: ({ value }) => {
                                if (!value) return 'Required'
                                if (
                                  typeof value.gradingAttributeId !== 'number'
                                ) {
                                  return 'Value must be a number'
                                }
                                if (
                                  value.gradingOptionId &&
                                  !value.obtainedScoreValue
                                ) {
                                  return 'Something Wrong No Score Value is found'
                                }
                              },
                            }}
                            name={`[${rowIndex}].gradingAttributes[${attributeIndex}]`}
                            children={(f) => {
                              const gridAttribute = form.getFieldValue(
                                `[${rowIndex}].gradingAttributes[${attributeIndex}]`,
                              )
                              return (
                                <f.CBasicSelect
                                  className={
                                    gridAttribute.status === 'exempt'
                                      ? ' text-orange-700'
                                      : ''
                                  }
                                  options={gradesOptions}
                                  value={gridAttribute.gradingOptionId}
                                  onValueChange={(value) => {
                                    handleGradeChange(
                                      rowIndex,
                                      attributeIndex,
                                      value ? Number(value) : null,
                                    )
                                  }}
                                />
                              )
                            }}
                          />
                        </TableCell>
                      ),
                    )}

                    <form.Subscribe
                      selector={(f) => f.values[rowIndex]}
                      children={(s) => {
                        const stats = calcPersonGrades(
                          s.gradingAttributes,
                          templateQ.data.gradingScale?.options ?? [],
                        )

                        return (
                          <>
                            <TableHead className="text-center ">
                              {stats.isAllGraded ? (
                                <>
                                  {stats.totalScore}{' '}
                                  <span className="text-muted-foreground">
                                    / {stats.maxMarks}
                                  </span>
                                </>
                              ) : (
                                '-'
                              )}
                            </TableHead>
                            <TableHead className="text-center ">
                              {stats.isAllGraded ? (
                                <>
                                  {stats.percentage}%.{' '}
                                  {stats.overallGrade?.label}
                                </>
                              ) : (
                                '-'
                              )}
                            </TableHead>
                          </>
                        )
                      }}
                    />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogMain>

          <DialogFooter className="">
            <form.AppForm>
              <form.SubscribeButton label="Submit" className="" />
            </form.AppForm>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
