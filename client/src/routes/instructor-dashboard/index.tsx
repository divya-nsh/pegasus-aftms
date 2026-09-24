import PageCard from '@/components/layout/PageCard'
import { createFileRoute } from '@tanstack/react-router'
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
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { addDays, format, isSameDay, startOfToday } from 'date-fns'
import MissionStatusBadge from '../schedules/-components/mission-stage-bar'
import {
  Clock,
  CalendarClock,
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  UserCog,
  PlaneTakeoff,
} from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/instructor-dashboard/')({
  component: RouteComponent,
})

const today = startOfToday()

function RouteComponent() {
  const [selectedDate, setSelectedDate] = useState(today)
  const personelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())
  const sheduleQ = useSuspenseQuery(
    trpc.schedules.getAll.queryOptions({
      status: ['completed', 'completed', 'in_progress', 'published'],
    }),
  )

  const todaySchedules = sheduleQ.data.items
    .filter(
      (schedule) =>
        schedule.startDateTime &&
        isSameDay(schedule.startDateTime, selectedDate),
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
        <div className="flex items-center justify-between gap-3 border-b pb-2 mb-2 px-4">
          <h3 className="text-sm font-semibold">
            {isSameDay(selectedDate, today) ? 'Today Schedules' : 'Schedules'}
          </h3>
          <ScheduleDateNav date={selectedDate} onChange={setSelectedDate} />
        </div>
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
            {todaySchedules.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No schedules on {format(selectedDate, 'dd MMM yyyy')}.
                </TableCell>
              </TableRow>
            )}
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

function ScheduleDateNav({
  date,
  onChange,
}: {
  date: Date
  onChange: (date: Date) => void
}) {
  const [open, setOpen] = useState(false)
  const viewingToday = isSameDay(date, startOfToday())

  return (
    <div className="flex items-center gap-1">
      {!viewingToday && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(startOfToday())}
        >
          Today
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Previous day"
        onClick={() => onChange(addDays(date, -1))}
      >
        <ChevronLeft />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-36 justify-between font-normal"
            />
          }
        >
          {format(date, 'dd MMM yyyy')}
          <CalendarIcon className="text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            required
            captionLayout="dropdown"
            selected={date}
            onSelect={(value) => {
              onChange(value)
              setOpen(false)
            }}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 60, 11)}
          />
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Next day"
        onClick={() => onChange(addDays(date, 1))}
      >
        <ChevronRight />
      </Button>
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
