export function generateGradeRanges<T extends Record<string, any>>(
  optionsHighToLow: Array<T>,
) {
  const n = optionsHighToLow.length
  if (n === 0) return []

  const size = 100 / n
  let prevPoint = -1

  // Compute bounds from lowest grade up, then restore highest-first display order.
  const lowToHigh = [...optionsHighToLow].reverse().map((item, i) => {
    const point = i === n - 1 ? 100 : Math.round((i + 1) * size)
    const lowerBound = prevPoint + 1
    prevPoint = point
    return { ...item, lowerBound, upperBound: point, point }
  })

  return lowToHigh.reverse()
}
