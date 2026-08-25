import TextField, { TextAreaField } from '@/components/inputs/TextField'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toDateTimeLocal } from '@/lib/date'
import type { TrpcRouterOutputs } from 'server/router'
import { personName } from '@/routes/schedules/-components/trainee-picker'

type ScheduleDetail = TrpcRouterOutputs['schedules']['getById']

const ATTENDANCE_LABELS: Record<string, string> = {
  pending: 'Pending',
  present: 'Present',
  absent: 'Absent',
  excused: 'Excused',
}

const RESULT_LABELS: Record<string, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
}

function displayName(
  firstName?: string | null,
  lastName?: string | null,
) {
  return personName({ firstName, lastName }) || '-'
}

export default function ScheduleReadonly({
  schedule,
}: {
  schedule: ScheduleDetail
}) {
  const aircraftLabel = schedule.aircraftName
    ? schedule.aircraftTailNumber
      ? `${schedule.aircraftName} (${schedule.aircraftTailNumber})`
      : schedule.aircraftName
    : '-'

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-6">
        <TextField
          readOnly
          className="col-span-2"
          label="Mission"
          value={schedule.missionName ?? ''}
        />
        <TextField
          readOnly
          label="Schedule Number"
          value={schedule.scheduleNumber ?? ''}
        />
        <TextField readOnly label="Schedule Name" value={schedule.name ?? ''} />
        <TextField
          readOnly
          label="Duration"
          value={
            schedule.durationMinutes != null
              ? `${schedule.durationMinutes} min`
              : ''
          }
        />
        <TextAreaField
          readOnly
          className="col-span-2"
          label="Note / Description"
          value={schedule.description ?? ''}
        />
        <TextField
          readOnly
          label="Start"
          type="datetime-local"
          value={toDateTimeLocal(schedule.startDateTime)}
        />
        <TextField
          readOnly
          label="End"
          type="datetime-local"
          value={toDateTimeLocal(schedule.endDateTime)}
        />
        <TextField readOnly label="Aircraft" value={aircraftLabel} />
        <TextField readOnly label="Area" value={schedule.areaName ?? ''} />
        <TextField
          readOnly
          label="Instructor"
          value={displayName(
            schedule.instructorFirstName,
            schedule.instructorLastName,
          )}
        />
        <TextField
          readOnly
          label="Pilot"
          value={displayName(schedule.pilotFirstName, schedule.pilotLastName)}
        />
        <TextAreaField
          readOnly
          className="col-span-2"
          label="Remarks"
          value={schedule.remarks ?? ''}
        />
      </section>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Trainees</h2>
          <p className="text-sm text-muted-foreground">
            Assigned trainees and their results for this schedule.
          </p>
        </div>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.assignments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-20 text-center text-muted-foreground"
                  >
                    No trainees assigned.
                  </TableCell>
                </TableRow>
              ) : (
                schedule.assignments.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.code || '-'}</TableCell>
                    <TableCell>
                      {displayName(row.firstName, row.lastName)}
                    </TableCell>
                    <TableCell>{row.rank || '-'}</TableCell>
                    <TableCell>
                      {ATTENDANCE_LABELS[row.attendanceStatus] ??
                        row.attendanceStatus}
                    </TableCell>
                    <TableCell>{row.score ?? '-'}</TableCell>
                    <TableCell>
                      {RESULT_LABELS[row.result] ?? row.result}
                    </TableCell>
                    <TableCell>{row.remarks || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
