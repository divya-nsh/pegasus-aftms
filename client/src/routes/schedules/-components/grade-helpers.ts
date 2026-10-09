export const MAX_CATEGORY_MARKS = 100

export type GradeStatus = 'pending' | 'scored' | 'exempt'

export type GradeRowData = {
  gradingTemplateAttributeId: number
  gradingScaleOptionId: number | null
  obtainedScoreValue: number | null
  status: GradeStatus
}

export type ScaleOption = {
  id: number
  label: string
  point: string | number
  lowerBound: string | number
  upperBound: string | number
}

/** Set a row's grade from a scale option id. Null / unknown id -> pending. */
export function applyGradeOption(
  row: GradeRowData,
  optionId: number | null,
  scaleOptions: ScaleOption[],
): GradeRowData {
  const option = scaleOptions.find((o) => o.id === optionId)
  if (!option) {
    return {
      ...row,
      gradingScaleOptionId: null,
      obtainedScoreValue: null,
      status: 'pending',
    }
  }
  return {
    ...row,
    gradingScaleOptionId: option.id,
    obtainedScoreValue: Number(option.point) || 0,
    status: 'scored',
  }
}

/** Mark a row Not Applicable, or undo it (back to pending). */
export function setRowExempt(row: GradeRowData, exempt: boolean): GradeRowData {
  return {
    ...row,
    gradingScaleOptionId: null,
    obtainedScoreValue: null,
    status: exempt ? 'exempt' : 'pending',
  }
}

export type GradeTotals = {
  totalCount: number
  exemptCount: number
  gradedCount: number
  incompleteCount: number
  /** Average of the non-exempt categories, out of 100. Null until complete. */
  overall: number | null
  gradeLabel: string | null
  gradeId: number | null
}

export function calcGradeTotals(
  rows: GradeRowData[],
  scaleOptions: ScaleOption[],
): GradeTotals {
  const active = rows.filter((r) => r.status !== 'exempt')
  const gradedCount = active.filter(
    (r) => r.gradingScaleOptionId != null,
  ).length
  const incompleteCount = active.length - gradedCount

  const base = {
    totalCount: rows.length,
    exemptCount: rows.length - active.length,
    gradedCount,
    incompleteCount,
  }

  // Incomplete, or everything exempt -> no overall score / grade.
  if (incompleteCount > 0 || active.length === 0) {
    return { ...base, overall: null, gradeLabel: null, gradeId: null }
  }

  const sum = active.reduce((s, r) => s + (r.obtainedScoreValue ?? 0), 0)
  const overall = Number((sum / active.length).toFixed(2))
  const lookup = Math.round(overall)
  const grade = scaleOptions.find(
    (o) => lookup >= Number(o.lowerBound) && lookup <= Number(o.upperBound),
  )

  return {
    ...base,
    overall,
    gradeLabel: grade?.label ?? 'N/A',
    gradeId: grade?.id ?? null,
  }
}

export function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}
