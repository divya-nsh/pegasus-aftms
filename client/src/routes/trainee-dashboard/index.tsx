import ErrorAlert from '@/components/errors/ErrorAlert'
import PageCard from '@/components/layout/PageCard'
import FullPageSpinner from '@/components/loaders/page-loader'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { useAuth } from '@/context/auth-context'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { trpc } from '@/trpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import type { ReactNode } from 'react'

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plane,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

export const Route = createFileRoute('/trainee-dashboard/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Trainee Dashboard" />
  ),
})

const today = new Date()

function RouteComponent() {
  const { user } = useAuth()
  const displayName = traineeDisplayName(user)

  const { data } = useSuspenseQuery(
    trpc.schedules.getDasbhoardStats.queryOptions({
      today,
    }),
  )

  return (
    <PageCard>
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          Trainee Dashboard
        </p>

        <h1 className="text-2xl font-semibold tracking-tight">
          Hey, {displayName}
        </h1>

        <p className="text-sm text-muted-foreground">
          {formatDate(today)} · Your flight activity and schedules
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Upcoming"
          value={data.pendingAssignments}
          hint="Scheduled missions"
          icon={<CalendarClock className="size-4" />}
          tone="warning"
        />

        <StatCard
          label="Completed"
          value={data.completedAssignments}
          hint="Completed missions"
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
        />

        <StatCard
          label="Avg. Score"
          value={data.averageScore ?? '—'}
          hint="Across scored missions"
          icon={<Target className="size-4" />}
          tone="info"
        />

        <StatCard
          label="Flying Hours"
          value={`${data.flyingHours}h`}
          hint="Recorded flight time"
          icon={<Plane className="size-4" />}
          tone="info"
        />
      </div>

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <section className="min-w-70 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Today's Schedule</h2>

              <p className="text-xs text-muted-foreground">
                Your missions for today
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
            >
              View schedule
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border shadow-sm">
            {data.todayAssignments.length > 0 ? (
              <div className="divide-y">
                {data.todayAssignments.slice(0, 5).map((schedule) => (
                  <ScheduleRow key={schedule.id} schedule={schedule} />
                ))}
              </div>
            ) : (
              <EmptySchedule />
            )}
          </div>
        </section>

        <FlyingHoursChartCard />
      </div>

      <section className="mt-8 max-w-82">
        <PerformanceSection
          passRate={data.passRate}
          averageScore={data.averageScore}
          passed={data.passedAssignments}
          failed={data.failedAssignments}
          pending={data.pendingResults}
        />
      </section>
    </PageCard>
  )
}

function ScheduleRow({ schedule }: { schedule: (typeof dataExample)[number] }) {
  const startTime = schedule.startDateTime
    ? new Date(schedule.startDateTime)
    : null

  const endTime = schedule.endDateTime ? new Date(schedule.endDateTime) : null

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Time */}
      <div className="w-14 shrink-0 text-sm font-medium tabular-nums">
        {startTime ? formatTime(startTime) : '--:--'}
      </div>

      {/* Mission */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{schedule.name}</p>

        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="size-3" />

          <span>
            {startTime && endTime
              ? `${formatTime(startTime)} – ${formatTime(endTime)}`
              : 'Time not set'}
          </span>
        </div>
      </div>

      {/* Status */}
      <ScheduleStatus status={schedule.status} />
    </div>
  )
}

function ScheduleStatus({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="size-3.5" />
        Completed
      </span>
    )
  }

  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600">
        <span className="size-2 rounded-full bg-sky-500" />
        In progress
      </span>
    )
  }

  return (
    <span className="text-xs font-medium text-muted-foreground">Upcoming</span>
  )
}

function EmptySchedule() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <CalendarClock className="size-5" />
      </div>

      <p className="mt-3 text-sm font-medium">No missions scheduled today</p>

      <p className="mt-1 text-xs text-muted-foreground">
        You don't have any missions scheduled for today.
      </p>
    </div>
  )
}

function traineeDisplayName(user: ReturnType<typeof useAuth>['user']) {
  const person = user?.personnel[0]

  const personnelName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(' ')

  return user?.name || personnelName || user?.username || 'there'
}

function StatCard({
  label,
  hint,
  value,
  icon,
  tone = 'default',
}: {
  label: string
  hint: string
  value: string | number
  icon: ReactNode
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'info'
}) {
  const iconTone = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
    danger: 'bg-destructive/10 text-destructive',
    warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-400',
    info: 'bg-sky-600/10 text-sky-700 dark:text-sky-400',
  }[tone]

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-background p-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>

        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>

        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>

      <span className={cn('shrink-0 rounded-md p-2', iconTone)}>{icon}</span>
    </div>
  )
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Used only to infer the schedule type without importing
// your database type into this component.
const dataExample = [] as Array<{
  id: number
  name: string
  status: string
  startDateTime: Date | string | null
  endDateTime: Date | string | null
}>

function PerformanceSection({
  passRate,
  averageScore,
  passed,
  failed,
  pending,
}: {
  passRate: number
  averageScore: number | null
  passed: number
  failed: number
  pending: number
}) {
  return (
    <div className="rounded-lg border bg-background p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">Performance</h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Your mission results
        </p>
      </div>

      <div className="mt-5 flex items-end gap-10">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {passRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Pass Rate</p>
        </div>

        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {averageScore ?? '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Avg. Score</p>
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        <span className="text-emerald-600 dark:text-emerald-400">
          {passed} Passed
        </span>

        {' · '}

        <span className="text-destructive">{failed} Failed</span>

        {' · '}

        <span>{pending} Pending</span>
      </p>
    </div>
  )
}

const flyingHoursChartData = [
  { month: 'January', dual: 14, solo: 4 },
  { month: 'February', dual: 18, solo: 7 },
  { month: 'March', dual: 16, solo: 9 },
  { month: 'April', dual: 11, solo: 6 },
  { month: 'May', dual: 19, solo: 10 },
  { month: 'June', dual: 17, solo: 8 },
]

const flyingHoursChartConfig = {
  dual: {
    label: 'Dual',
    color: '#2563eb',
  },
  solo: {
    label: 'Solo',
    color: '#60a5fa',
  },
} satisfies ChartConfig

function FlyingHoursChartCard() {
  return (
    <Card className="min-w-[320px] flex-1">
      <CardHeader>
        <CardTitle>Flying hours</CardTitle>
        <CardDescription>
          Placeholder data · January – June 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={flyingHoursChartConfig} className="h-70 w-full">
          <BarChart accessibilityLayer data={flyingHoursChartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="dual" fill="var(--color-dual)" radius={4} />
            <Bar dataKey="solo" fill="var(--color-solo)" radius={4} />
          </BarChart>
        </ChartContainer>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            Up 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Sample dual vs solo flying hours for the last 6 months
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  )
}
