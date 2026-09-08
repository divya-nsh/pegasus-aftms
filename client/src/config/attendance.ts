const ATTENDANCE_STATUS_OPTIONS = [
  {
    label: 'Present',
    value: 'present',
  },
  {
    label: 'Absent',
    value: 'absent',
  },
  {
    label: 'Excused',
    value: 'excused',
  },
]

const getAttendanceStatusLabel = (value: string | null) => {
  if (!value) return ''
  return (
    ATTENDANCE_STATUS_OPTIONS.find((option) => option.value === value)?.label ||
    value
  )
}

export { ATTENDANCE_STATUS_OPTIONS, getAttendanceStatusLabel }
