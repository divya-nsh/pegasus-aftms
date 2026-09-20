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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import BasicSelect from '@/components/inputs/basic-select'
import { AlertTriangleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssignmentGradingAttribute, ScheduleFormAssignment } from './type'

type GradeRow = {
  templateAttributeId: number
  name: string
  weight: number
  gradeId: number | null
  status: 'pending' | 'scored' | 'exempt'
}

type GradeSavePayload = Pick<
  ScheduleFormAssignment,
  | 'gradingAttributes'
  | 'obtainedGrade'
  | 'obtainedScoreValue'
  | 'obtainedScorePercentage'
>

export default function GradeModal({
  gradingTemplateId,
  assignment,
  readOnly,
  onClose,
  onSave,
}: {
  gradingTemplateId: number
  assignment: ScheduleFormAssignment
  readOnly?: boolean
  onClose: () => void
  onSave: (payload: GradeSavePayload) => void
}) {
  const { data: gradingTemplate } = useSuspenseQuery(
    trpc.gradingTemplate.getById.queryOptions(gradingTemplateId),
  )

  const scaleOptions = useMemo(
    () => gradingTemplate.gradingScale?.options ?? [],
    [gradingTemplate.gradingScale?.options],
  )

  const [rows, setRows] = useState<GradeRow[]>(() => {
    const existing = new Map(
      assignment.gradingAttributes.map((item) => [
        item.templateAttributeId,
        item,
      ]),
    )

    return gradingTemplate.gradingTemplateAttributes.map((attribute) => {
      const prev = existing.get(attribute.id)
      return {
        templateAttributeId: attribute.id,
        name: attribute.gradingAttribute?.name ?? 'Attribute',
        weight: Number(attribute.weight),
        gradeId: prev?.gradeId ?? null,
        status: prev?.status ?? 'pending',
      }
    })
  })

  const [attemptedSave, setAttemptedSave] = useState(false)

  const gradeOptionsMap = useMemo(() => {
    return new Map(
      scaleOptions.map((item) => [
        item.id,
        {
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
    const paperMarks = rows.length * categoryMarks
    const exemptCount = rows.filter((row) => row.status === 'exempt').length
    const exemptMarks = exemptCount * categoryMarks
    const remainingMarks = paperMarks - exemptMarks

    const scoredRows = rows.filter((row) => row.status !== 'exempt')
    const obtainedMarks = scoredRows.reduce((sum, row) => {
      const point = row.gradeId
        ? (gradeOptionsMap.get(row.gradeId)?.point ?? 0)
        : 0
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

    const incompleteCount = rows.filter(
      (row) => row.status !== 'exempt' && row.gradeId == null,
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
  }, [gradeOptionsMap, rows, scaleOptions])

  const updateRow = (templateAttributeId: number, patch: Partial<GradeRow>) => {
    setRows((prev) =>
      prev.map((row) =>
        row.templateAttributeId === templateAttributeId
          ? { ...row, ...patch }
          : row,
      ),
    )
  }

  const handleSave = () => {
    if (readOnly) {
      onClose()
      return
    }

    setAttemptedSave(true)

    if (totals.incompleteCount > 0) {
      toast.error(
        `Score or exempt every category before saving (${totals.incompleteCount} remaining)`,
      )
      return
    }

    const gradingAttributes: AssignmentGradingAttribute[] = rows.map((row) => ({
      templateAttributeId: row.templateAttributeId,
      gradeId: row.status === 'exempt' ? null : row.gradeId,
      weight: row.weight,
      status: row.status === 'exempt' ? 'exempt' : 'scored',
    }))

    onSave({
      gradingAttributes,
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
            Template: {gradingTemplate.name}. Score every category, or exempt
            it. Save writes the final score back to this line.
          </DialogDescription>
        </DialogHeader>
        <DialogMain className="space-y-4">
          {attemptedSave && totals.incompleteCount > 0 && (
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
          )}

          <Table className="border rounded-md shadow-sm" fullGridLine>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Category</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="w-28 text-center">Marks</TableHead>
                <TableHead className="w-24 text-center">Exempt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isIncomplete =
                  row.status !== 'exempt' && row.gradeId == null
                const selectedGrade = row.gradeId
                  ? gradeOptionsMap.get(row.gradeId)
                  : null

                return (
                  <TableRow
                    key={row.templateAttributeId}
                    className={cn(
                      row.status === 'exempt' && 'bg-muted/40',
                      attemptedSave && isIncomplete && 'bg-destructive/5',
                    )}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{row.name}</span>
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
                          value={row.gradeId}
                          disabled={readOnly}
                          aria-invalid={attemptedSave && isIncomplete}
                          onValueChange={(value) => {
                            const gradeId = value == null ? null : Number(value)
                            updateRow(row.templateAttributeId, {
                              gradeId: Number.isFinite(gradeId)
                                ? gradeId
                                : null,
                              status:
                                gradeId != null && Number.isFinite(gradeId)
                                  ? 'scored'
                                  : 'pending',
                            })
                          }}
                          placeholder="Pick a grade"
                          options={scaleOptions.map((option) => ({
                            label: option.label,
                            value: option.id,
                          }))}
                          valueAsNumber
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.status === 'exempt'
                        ? '—'
                        : selectedGrade
                          ? formatMarks(selectedGrade.point)
                          : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Label className="inline-flex justify-center font-normal">
                        <Checkbox
                          checked={row.status === 'exempt'}
                          disabled={readOnly}
                          onCheckedChange={(checked) => {
                            const exempt = checked === true
                            updateRow(row.templateAttributeId, {
                              status: exempt
                                ? 'exempt'
                                : row.gradeId != null
                                  ? 'scored'
                                  : 'pending',
                              gradeId: exempt ? null : row.gradeId,
                            })
                          }}
                        />
                        <span className="sr-only">Exempt {row.name}</span>
                      </Label>
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
          {!readOnly && (
            <Button type="button" onClick={handleSave}>
              Save grade
            </Button>
          )}
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
      <Badge variant="green">Graded</Badge>
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
