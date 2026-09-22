import { useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { trpc } from '@/trpc'
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
import { Checkbox } from '@/components/ui/checkbox'
import BasicSelect from '@/components/inputs/basic-select'
import { cn } from '@/lib/utils'
import type { AssignmentGradingAttribute, ScheduleFormAssignment } from './type'

type GradeRow = ScheduleFormAssignment['participantGradings'][number]

type GradeSavePayload = Pick<
  ScheduleFormAssignment,
  | 'participantGradings'
  | 'obtainedGrade'
  | 'obtainedScoreValue'
  | 'obtainedScorePercentage'
>

export default function GradeModal({
  gradingTemplateId,
  assignment,
  onClose,
  onSave,
}: {
  gradingTemplateId: number
  assignment: ScheduleFormAssignment
  onClose: () => void
  onSave: (payload: GradeSavePayload) => void
}) {
  const { data: gradingTemplate } = useSuspenseQuery(
    trpc.gradingTemplate.getById.queryOptions(gradingTemplateId),
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scaleOptions = gradingTemplate.gradingScale?.options ?? []

  const [rows, setRows] = useState<Record<number, GradeRow>>(() => {
    const record: Record<number, GradeRow> = {}
    if (assignment.participantGradings.length > 0) {
      assignment.participantGradings.forEach((attribute) => {
        record[attribute.templateAttribute.value] = attribute
      })
    } else {
      for (const attribute of gradingTemplate.gradingTemplateAttributes) {
        record[attribute.id] = {
          templateAttribute: {
            label: attribute.gradingAttribute?.name ?? 'Attribute',
            value: attribute.id,
          },
          gradingScaleOption: null,
          obtainedScoreValue: null,
          status: 'pending',
        }
      }
    }

    return record
  })

  const rowsArray = useMemo(() => Object.values(rows), [rows])

  const gradeOptionsMap = useMemo(() => {
    return new Map(
      scaleOptions.map((item) => [
        item.id,
        {
          id: item.id,
          label: item.label,
          point: Number(item.point),
          lowerBound: Number(item.lowerBound),
          upperBound: Number(item.upperBound),
        },
      ]),
    )
  }, [scaleOptions])

  const totals = useMemo(() => {
    const categoryMarks = 100
    const paperMarks = rowsArray.length * categoryMarks
    const exemptCount = rowsArray.filter(
      (row) => row.status === 'exempt',
    ).length
    const exemptMarks = exemptCount * categoryMarks
    const remainingMarks = paperMarks - exemptMarks

    const scoredRows = rowsArray.filter((row) => row.status !== 'exempt')
    const obtainedMarks = scoredRows.reduce((sum, row) => {
      const point = row.obtainedScoreValue ?? 0
      return sum + point
    }, 0)

    const percentage =
      remainingMarks === 0 ? 0 : (obtainedMarks / remainingMarks) * 100
    const roundedPercentage = Math.round(percentage)

    const grade = scaleOptions.find(
      (item) =>
        roundedPercentage >= Number(item.lowerBound) &&
        roundedPercentage <= Number(item.upperBound),
    )

    const incompleteCount = rowsArray.filter(
      (row) => row.status !== 'exempt' && row.gradingScaleOption == null,
    ).length

    return {
      paperMarks,
      exemptMarks,
      remainingMarks,
      obtainedMarks,
      percentage,
      roundedPercentage,
      gradeLabel: grade?.label ?? 'N/A',
      gradeId: grade?.id ?? null,
      incompleteCount,
    }
  }, [rowsArray, scaleOptions])

  const updateRow = (templateAttributeId: number, patch: Partial<GradeRow>) => {
    setRows((prev) => ({
      ...prev,
      [templateAttributeId]: { ...prev[templateAttributeId], ...patch },
    }))
  }

  const handleGradeChange = (templateAttributeId: number, value?: number) => {
    const gradeOption = value ? gradeOptionsMap.get(value) : null
    if (!gradeOption) return
    updateRow(templateAttributeId, {
      gradingScaleOption: {
        label: gradeOption.label,
        value: gradeOption.id,
      },
      status: value ? 'scored' : 'pending',
      obtainedScoreValue: gradeOption.point,
    })
  }

  const exemptAttribute = (templateAttributeId: number, value: boolean) => {
    updateRow(templateAttributeId, {
      status: value ? 'exempt' : 'pending',
      gradingScaleOption: null,
      obtainedScoreValue: null,
    })
  }

  const handleSave = () => {
    const incompleteCount = Object.values(rows).filter(
      (row) => row.status !== 'exempt' && row.gradingScaleOption == null,
    ).length

    if (incompleteCount > 0) {
      toast.error(
        `Please Score every category before saving (${incompleteCount} remaining)`,
      )
      return
    }

    const participantGradings: GradeRow[] = Object.values(rows)

    onSave({
      participantGradings,
      obtainedGrade:
        totals.gradeId != null
          ? { label: totals.gradeLabel, value: totals.gradeId }
          : null,
      obtainedScoreValue: Number(totals.obtainedMarks.toFixed(2)),
      obtainedScorePercentage: Number(totals.percentage.toFixed(2)),
    })
  }

  const personnelName = assignment.personnel?.label ?? 'Personnel'

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-3xl">
        <DialogHeader>
          <DialogTitle>Grade {personnelName}</DialogTitle>
          <DialogDescription>
            Template: {gradingTemplate.name}
          </DialogDescription>
        </DialogHeader>
        <DialogMain className="space-y-4">
          {/* {attemptedSave && totals.incompleteCount > 0 && (
            <Alert variant="warning">
              <AlertTriangleIcon />
              <AlertTitle>Incomplete grading</AlertTitle>
              <AlertDescription>
                {totals.incompleteCount}{' '}
                {totals.incompleteCount === 1
                  ? 'category is'
                  : 'categories are'}{' '}
                still missing a score. Pick a grade or mark Exempt.
              </AlertDescription>
            </Alert>
          )} */}

          <Table className="border rounded-md shadow-sm" fullGridLine>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Category</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="w-28 text-center">Marks</TableHead>
                <TableHead className="w-24 text-center">
                  Not Applicable
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(rows).map((row, i) => {
                // const selectedGrade = row.gradeId
                //   ? gradeOptionsMap.get(row.gradeId)
                //   : null

                return (
                  <TableRow
                    key={i}
                    className={cn(
                      row.status === 'exempt' && ' opacity-70',
                      // attemptedSave && isIncomplete && 'bg-destructive/5',
                    )}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{row.templateAttribute.label}</span>
                        {row.status === 'exempt' && (
                          <span className="text-xs text-muted-foreground">
                            Exempted from this category
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.status === 'exempt' ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        <BasicSelect
                          value={row.gradingScaleOption?.value}
                          onValueChange={(value) => {
                            if (!value) return
                            handleGradeChange(
                              row.templateAttribute.value,
                              Number(value),
                            )
                          }}
                          placeholder="Pick a grade"
                          options={scaleOptions.map((option) => ({
                            label: option.label,
                            value: option.id,
                          }))}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.status === 'exempt'
                        ? '—'
                        : row.obtainedScoreValue
                          ? formatMarks(row.obtainedScoreValue)
                          : '—'}
                    </TableCell>
                    <TableCell className="text-center ">
                      <Checkbox
                        className="mx-auto"
                        checked={row.status === 'exempt'}
                        onCheckedChange={(checked) => {
                          const exempt = checked === true
                          exemptAttribute(row.templateAttribute.value, exempt)
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SummaryCard
              label="Paper marks"
              value={formatMarks(totals.paperMarks)}
            />
            <SummaryCard
              label="Exempted"
              value={formatMarks(totals.exemptMarks)}
            />
            <SummaryCard
              label="Obtained"
              value={
                totals.incompleteCount > 0
                  ? '—'
                  : `${formatMarks(totals.obtainedMarks)}/${formatMarks(totals.remainingMarks)}`
              }
            />
            <SummaryCard
              label="Percentage"
              value={
                totals.incompleteCount > 0
                  ? '—'
                  : `${totals.roundedPercentage}%`
              }
            />
            <SummaryCard
              label="Overall grade"
              value={totals.incompleteCount > 0 ? '—' : totals.gradeLabel}
              highlight
            />
          </div>
        </DialogMain>
        <DialogFooter className="py-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button type="button" onClick={handleSave}>
            Save grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function GradeStatusCell({
  assignment,
}: {
  assignment: ScheduleFormAssignment
}) {
  const isGraded = assignment.obtainedScorePercentage != null

  if (!isGraded) {
    return <span className="text-xs text-muted-foreground">Not graded</span>
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="tabular-nums text-sm">
        {Number(assignment.obtainedScorePercentage).toFixed(0)}%
        {assignment.obtainedGrade?.label
          ? ` · ${assignment.obtainedGrade.label}`
          : ''}
      </span>
      {assignment.obtainedScoreValue != null && (
        <span className="text-xs text-muted-foreground tabular-nums">
          Score {assignment.obtainedScoreValue}
        </span>
      )}
    </div>
  )
}
