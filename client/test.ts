function generateGradeRanges(optionsHightToLow: string[]) {
  const options = [...optionsHightToLow].reverse()
  // options ordered LOW to HIGH, e.g. ['F', 'C', 'B', 'A']
  const n = options.length
  const size = 100 / n

  let prevPoint = -1
  return options.map((label, i) => {
    const point = i === n - 1 ? 100 : Math.round((i + 1) * size)
    const lowerBound = prevPoint + 1
    prevPoint = point
    return { label, lowerBound, upperBound: point, point }
  })
}
const options = ['A', 'B', 'C', 'F']
console.log(generateGradeRanges(options))
