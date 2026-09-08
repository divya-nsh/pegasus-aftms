import { Badge } from '@/components/ui/badge'
import { getAttendanceStatusLabel } from '@/config/attendance'
import { getResultLabel } from './helpers'

export default function AttendanceBadge({
  attendanceStatus,
}: {
  attendanceStatus: string | null
}) {
  if (!attendanceStatus) return '—'
  return (
    <Badge
      className=" tracking-wider"
      variant={
        attendanceStatus === 'present'
          ? 'green'
          : attendanceStatus === 'absent'
            ? 'orange'
            : 'yellow'
      }
    >
      {getAttendanceStatusLabel(attendanceStatus)}
    </Badge>
  )
}

export function ResultBadge({
  result,
}: {
  result: 'passed' | 'failed' | null
}) {
  if (!result) return '—'
  return (
    <Badge
      className=" tracking-wider"
      variant={result === 'passed' ? 'green' : 'destructive'}
    >
      {getResultLabel(result)}
    </Badge>
  )
}
