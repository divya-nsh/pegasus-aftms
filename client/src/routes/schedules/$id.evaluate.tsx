import { useState } from 'react'
import { trpc } from '@/trpc'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { cn, makeFullName } from '@/lib/utils'
import PageCard from '@/components/layout/PageCard'
import MissionStatusBadge from './-components/mission-stage-bar'
import { isSameDay, format } from 'date-fns'
import { formatDate } from '@/lib/date'
import { ArrowLeftIcon, PencilIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { getPersonnelType, getQualificationLabel } from '@repo/shared'
import AttendanceBadge from './-components/attendance-badge'
import EvaluatePersonnelModal from './-components/evaluate-personnel-modal'

export const Route = createFileRoute('/schedules/$id/evaluate')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = Route.useParams()
  const scheduleId = Number(params.id)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { data: schedule } = useSuspenseQuery(
    trpc.schedules.getById.queryOptions({ id: scheduleId }),
  )

  const templateQ = useSuspenseQuery(
    trpc.gradingTemplate.getById.queryOptions(
      schedule.mission!.gradingTemplateId!,
    ),
  )
  const aircraftsQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())

  const editingAssignment =
    schedule.assignments.find((assignment) => assignment.id === editingId) ??
    null

  return (
    <PageCard>
      <Link
        to="/schedules"
        className="text-muted-foreground mb-2 flex items-center gap-2 text-sm hover:text-primary hover:underline"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Go Back
      </Link>
      <div className="items-center gap-1 border-b mb-4 pb-1 flex justify-between">
        <h1 className="text-xl font-bold">
          Schedule Evaluation #{schedule.scheduleNumber}
        </h1>
      </div>
      <div className="border px-4 py-4 mb-4 rounded-md relative">
        <div className="grid gap-4 grid-cols-3">
          <KeyValuePair label="Schedule Name" value={schedule.name} />
          <KeyValuePair
            label="Schedule Number"
            value={schedule.scheduleNumber}
          />
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
              schedule.endDateTime,
            )}
          />
          <KeyValuePair
            label="Description"
            value={templateQ.data.notes || 'N/A'}
          />
          <KeyValuePair label="Grading Template" value={templateQ.data.name} />
        </div>
      </div>

      <div className="border-b pb-2 text-sm font-semibold">
        Personnel
        {schedule.assignments.length > 0
          ? ` (${schedule.assignments.length})`
          : ''}
      </div>
      <div className="mt-3 overflow-hidden rounded-md border">
        {schedule.assignments.length > 0 ? (
          <Table fullGridLine>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-center w-10">S.No</TableHead>
                <TableHead>Personnel</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-center w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.assignments.map((assignment, index) => (
                <TableRow key={assignment.id}>
                  <TableCell className="align-top text-center">
                    {index + 1}
                  </TableCell>
                  <TableCell className=" align-top">
                    <div className="max-w-62.5 grid">
                      <span className="truncate">
                        {makeFullName(assignment.personnel) || 'N/A'}
                      </span>
                      {assignment.personnel?.personnelType && (
                        <span className="text-muted-foreground">
                          Type:{' '}
                          {getPersonnelType(assignment.personnel.personnelType)
                            ?.name ?? assignment.personnel.personnelType}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        ID: {assignment.personnelId}
                      </span>
                      {assignment.personnel?.qualification && (
                        <span className="text-muted-foreground">
                          Qualification:{' '}
                          {getQualificationLabel(
                            assignment.personnel.qualification,
                          )}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className=" align-top">
                    {assignment.aircraft ? (
                      <div className="flex max-w-62.5 flex-col gap-1.5 py-1">
                        <span className="truncate text-sm font-medium">
                          {assignment.aircraft.name}
                        </span>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          <TimeLine
                            label="Takeoff"
                            value={assignment.takeoffTime}
                          />
                          <TimeLine
                            label="Landing"
                            value={assignment.landingTime}
                          />
                          <TimeLine
                            label="Aircraft"
                            value={assignment.aircraftTime}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        (No Aircraft)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className=" align-top">
                    <AttendanceBadge
                      attendanceStatus={assignment.attendanceStatus}
                    />
                  </TableCell>
                  <TableCell className=" align-top">
                    <GradeCell assignment={assignment} />
                  </TableCell>
                  <TableCell className="max-w-64 align-top text-muted-foreground">
                    {assignment.remarks || '—'}
                  </TableCell>
                  <TableCell className=" align-top text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(assignment.id)}
                    >
                      <PencilIcon />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No personnel on this schedule
          </div>
        )}
      </div>

      {editingAssignment && (
        <EvaluatePersonnelModal
          key={editingAssignment.id}
          scheduleId={schedule.id}
          assignment={editingAssignment}
          gradingTemplate={templateQ.data}
          aircrafts={aircraftsQ.data.items}
          startDateTime={schedule.startDateTime}
          endDateTime={schedule.endDateTime}
          onClose={() => setEditingId(null)}
        />
      )}
    </PageCard>
  )
}

function TimeLine({
  label,
  value,
}: {
  label: string
  value: string | Date | null
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">
        {value ? formatDate(value, true) : '—'}
      </span>
    </div>
  )
}

function GradeCell({
  assignment,
}: {
  assignment: {
    obtainedScorePercentage: string | null
    obtainedScoreValue: string | null
    obtainedGrade: { label: string } | null
  }
}) {
  if (assignment.obtainedScorePercentage == null) {
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
          Score {Number(assignment.obtainedScoreValue)}
        </span>
      )}
    </div>
  )
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
      <span>{value}</span>
    </div>
  )
}

function formatStartEndTime(start: string | null, end: string | null) {
  if (!start && !end) return 'N/A'
  if (!end && start) return formatDate(start, true)
  if (isSameDay(start!, end!)) {
    return `${format(start!, 'dd MMM yyy')} , ${format(start!, 'hh:mm')} - ${format(end!, 'hh:mm')}`
  }
  return `${formatDate(start, true)} - ${formatDate(end, true)}`
}
