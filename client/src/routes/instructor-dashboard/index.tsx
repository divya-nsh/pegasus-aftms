import PageCard from '@/components/layout/PageCard'
import { createFileRoute } from '@tanstack/react-router'
import { FlyingHoursChartCard } from '../trainee-dashboard'
import { useSuspenseQuery } from '@tanstack/react-query'
import { trpc } from '@/trpc'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { format, isSameDay, startOfToday } from 'date-fns'
import MissionStatusBadge from '../schedules/-components/mission-stage-bar'
import {
  Clock,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  UserCog,
  PlaneTakeoff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/instructor-dashboard/')({
  component: RouteComponent,
})

const today = startOfToday()

function RouteComponent() {
  const personelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())
  const sheduleQ = useSuspenseQuery(
    trpc.schedules.getAll.queryOptions({
      status: ['completed', 'completed', 'in_progress', 'published'],
    }),
  )

  const todaySchedules = sheduleQ.data.items
    .filter(
      (schedule) =>
        schedule.startDateTime && isSameDay(schedule.startDateTime, today),
    )
    .sort(
      (a, b) =>
        new Date(a.startDateTime!).getTime() -
        new Date(b.startDateTime!).getTime(),
    )

  const completedToday = todaySchedules.filter(
    (schedule) => schedule.status === 'completed',
  ).length

  const pendingToday = todaySchedules.filter(
    (schedule) => schedule.status === 'published',
  ).length

  const trainees = personelQ.data.items.filter(
    (personel) => personel.personnelType === 'trainee',
  ).length
  const instructors = personelQ.data.items.filter(
    (personel) => personel.personnelType === 'instructor',
  ).length
  const pilots = personelQ.data.items.filter(
    (personel) => personel.personnelType === 'pilot',
  ).length

  return (
    <PageCard className="bg-slate-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg">Instructor Dashboard</h2>
      </div>

      <p className="text-xs font-medium text-muted-foreground mb-2">Today</p>
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Pending Today"
          value={pendingToday.toString()}
          icon={Clock}
          tone="amber"
        />
        <SummaryCard
          label="Events Today"
          value={todaySchedules.length.toString()}
          icon={CalendarClock}
          tone="sky"
        />
        <SummaryCard
          label="Completed Today"
          value={completedToday.toString()}
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <p className="text-xs font-medium text-muted-foreground mb-2 mt-4">
        Personnel
      </p>
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Total Trainee"
          value={trainees.toString()}
          icon={GraduationCap}
          tone="violet"
        />
        <SummaryCard
          label="Total Instructor"
          value={instructors.toString()}
          icon={UserCog}
          tone="indigo"
        />
        <SummaryCard
          label="Total Pilots"
          value={pilots.toString()}
          icon={PlaneTakeoff}
          tone="teal"
        />
      </div>

      <div className="py-4 pb-0 rounded-md bg-white mt-4 border shadow-xs">
        <h3 className="border-b text-sm pb-2 font-semibold mb-2 px-4">
          Today Schedules
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/80">
              <TableHead className="text-muted-foreground">Time</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Area</TableHead>
              <TableHead className="text-center">Personnels</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todaySchedules.map((schedule) => (
              <TableRow
                key={schedule.id}
                className="hover:bg-muted/40 transition-colors"
              >
                <TableCell className="py-4">
                  {formatStartEnd(schedule.startDateTime, schedule.endDateTime)}
                </TableCell>
                <TableCell>{schedule.scheduleNumber}</TableCell>
                <TableCell>
                  <MissionStatusBadge status={schedule.status} size="sm" />
                </TableCell>
                <TableCell>{schedule.name}</TableCell>
                <TableCell>{schedule.area?.name}</TableCell>
                <TableCell className="text-center">
                  {schedule.assignmentsCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* <div className="mt-4">
        <FlyingHoursChartCard />
      </div> */}
    </PageCard>
  )
}

const TONE_CLASSES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700',
  sky: 'bg-sky-50 text-sky-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  violet: 'bg-violet-50 text-violet-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  teal: 'bg-teal-50 text-teal-700',
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  description?: string
  icon: LucideIcon
  tone: keyof typeof TONE_CLASSES
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-3 shadow-xs">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="font-semibold tabular-nums leading-tight">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

function formatStartEnd(start: string | null, end: string | null) {
  if (!start || !end) {
    return 'N/A'
  }
  if (isSameDay(start, end)) {
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
  }
  return `${format(start, 'HH:mm')} - ${format(end, 'dd MMM HH:mm')}`
}
