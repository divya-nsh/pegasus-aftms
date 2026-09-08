const RESULT_OPTIONS = [
  {
    label: 'Pass',
    value: 'passed',
  },
  {
    label: 'Fail',
    value: 'failed',
  },
]
function getResultLabel(result: string | null) {
  if (!result) return ''
  return (
    RESULT_OPTIONS.find((option) => option.value === result)?.label || result
  )
}
export { RESULT_OPTIONS, getResultLabel }
