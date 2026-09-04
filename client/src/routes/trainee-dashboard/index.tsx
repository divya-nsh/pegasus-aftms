import ErrorAlert from '@/components/errors/ErrorAlert'
import PageCard from '@/components/layout/PageCard'
import FullPageSpinner from '@/components/loaders/page-loader'
import { useAuth } from '@/context/auth-context'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import MissionStatusBadge from '@/routes/schedules/-components/mission-stage-bar'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { format, isToday, startOfDay } from 'date-fns'
import {
  CalendarClockIcon,
  CalendarOffIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ListTodoIcon,
  MapPinIcon,
  PlaneIcon,
  TrendingUp,
  TrophyIcon,
  UserIcon,
  UserXIcon,
  XCircleIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { TrpcRouterOutputs } from 'server/router'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/trainee-dashboard/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Trainee Dashboard" />
  ),
})

type AssignedSchedule =
  TrpcRouterOutputs['schedules']['getAll']['items'][number]

function traineeDisplayName(user: ReturnType<typeof useAuth>['user']) {
  const person = user?.personnel[0]
  const personnelName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(' ')
  return user?.name || personnelName || user?.username || 'there'
}

function personName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(' ')
}

function missionTimeRange(
  start?: string | Date | null,
  end?: string | Date | null,
) {
  const startTime = start ? formatDate(start, true).split(', ')[1] : null
  const endTime = end ? formatDate(end, true).split(', ')[1] : null
  if (!startTime && !endTime) return 'Time not set'
  if (!endTime) return startTime
  return `${startTime} – ${endTime}`
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
    <div className="flex items-start justify-between gap-3 rounded-md border bg-background p-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <span className={cn('rounded-md p-2', iconTone)}>{icon}</span>
    </div>
  )
}

function EmptyMissions({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-4 py-10 text-center">
      <CalendarOffIcon className="mb-3 size-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function MissionCard({
  mission,
  compact = false,
}: {
  mission: AssignedSchedule
  compact?: boolean
}) {
  const instructor = personName(
    mission.instructorFirstName,
    mission.instructorLastName,
  )

  return (
    <Link
      to="/trainee-dashboard/$id"
      params={{ id: String(mission.id) }}
      className="block rounded-md border bg-background p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground">
            {mission.scheduleNumber}
          </p>
          <p className="font-medium">{mission.name}</p>
          {mission.missionName ? (
            <p className="text-sm text-muted-foreground">
              {mission.missionName}
            </p>
          ) : null}
        </div>
        <MissionStatusBadge status={mission.status} />
      </div>

      {compact ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {formatDate(mission.startDateTime ?? '', true)}
          {mission.aircraftTailNumber ? ` · ${mission.aircraftTailNumber}` : ''}
        </p>
      ) : (
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <Clock3Icon className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              {missionTimeRange(mission.startDateTime, mission.endDateTime)}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <PlaneIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              {mission.aircraftName || 'Aircraft TBA'}
              {mission.aircraftTailNumber
                ? ` (${mission.aircraftTailNumber})`
                : ''}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span>{mission.areaName || 'Area TBA'}</span>
          </p>
          <p className="flex items-center gap-2">
            <UserIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span>{instructor || 'Instructor TBA'}</span>
          </p>
        </div>
      )}
    </Link>
  )
}

function RouteComponent() {
  const { user } = useAuth()
  const displayName = traineeDisplayName(user)
  const assignedQ = useSuspenseQuery(trpc.schedules.getAll.queryOptions({}))

  const { stats, todayMissions, upcomingMissions } = useMemo(() => {
    const items = assignedQ.data.items
    const uniqueMissions = new Set(
      items.map((item) => item.missionId).filter(Boolean),
    ).size
    const notStarted = items.filter(
      (item) => item.status === 'published',
    ).length
    const completed = items.filter((item) => item.status === 'completed').length

    const today = items
      .filter(
        (item) => item.startDateTime && isToday(new Date(item.startDateTime)),
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime ?? 0).getTime() -
          new Date(b.startDateTime ?? 0).getTime(),
      )

    const upcoming = items
      .filter((item) => {
        if (!item.startDateTime) return false
        return startOfDay(new Date(item.startDateTime)) > startOfDay(new Date())
      })
      .sort(
        (a, b) =>
          new Date(a.startDateTime ?? 0).getTime() -
          new Date(b.startDateTime ?? 0).getTime(),
      )
      .slice(0, 5)

    return {
      stats: {
        total: items.length,
        uniqueMissions,
        notStarted,
        completed,
        passed: 0,
        failed: 0,
        notAttended: 0,
        excused: 0,
        averageScore: 0,
        scoredCount: 0,
        graded: 0,
      },
      todayMissions: today,
      upcomingMissions: upcoming,
    }
  }, [assignedQ.data.items])

  return (
    <PageCard className="space-y-8 bg-neutral-50">
      <section className="space-y-4">
        <div className=" pb-1">
          <p className="text-sm text-muted-foreground">Trainee Dashboard</p>
          <h1 className="text-xl font-bold tracking-tight">
            Hey, {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, dd MMM yyyy')} · your assigned schedules
            and results
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Assigned"
            hint={
              stats.uniqueMissions
                ? `${stats.uniqueMissions} mission type${stats.uniqueMissions === 1 ? '' : 's'}`
                : 'Schedules you are part of'
            }
            value={stats.total}
            icon={<ListTodoIcon className="size-4" />}
          />
          <StatCard
            label="Passed"
            hint={
              stats.graded
                ? `${stats.passed} of ${stats.graded} graded`
                : 'No graded results yet'
            }
            value={stats.passed}
            icon={<CheckCircle2Icon className="size-4" />}
            tone="success"
          />
          <StatCard
            label="Failed"
            hint={
              stats.graded
                ? `${stats.failed} of ${stats.graded} graded`
                : 'No graded results yet'
            }
            value={stats.failed}
            icon={<XCircleIcon className="size-4" />}
            tone="danger"
          />
          <StatCard
            label="Not attended"
            hint={stats.excused ? `${stats.excused} excused` : 'Marked absent'}
            value={stats.notAttended}
            icon={<UserXIcon className="size-4" />}
            tone="warning"
          />
          <StatCard
            label="Average score"
            hint={
              stats.scoredCount
                ? `From ${stats.scoredCount} scored ${stats.scoredCount === 1 ? 'schedule' : 'schedules'}`
                : 'No scores recorded yet'
            }
            value={stats.averageScore}
            icon={<TrophyIcon className="size-4" />}
            tone="info"
          />
          <StatCard
            label="Completed"
            hint={`${stats.notStarted} still pending`}
            value={stats.completed}
            icon={<CalendarClockIcon className="size-4" />}
            tone="success"
          />
        </div>
      </section>

      <div className="flex gap-8">
        <Card className="min-w-[300px] space-y-4 flex-1">
          <CardHeader>
            <CardTitle>Today&apos;s missions</CardTitle>
            <CardDescription>
              {todayMissions.length
                ? `${todayMissions.length} scheduled for today`
                : 'Nothing on the board for today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayMissions.length ? (
              <ul className="space-y-3">
                {todayMissions.map((mission) => (
                  <li key={mission.id}>
                    <MissionCard mission={mission} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyMissions
                title="No missions today"
                description="You do not have any assigned sorties scheduled for today."
              />
            )}
          </CardContent>
        </Card>
        <DummyChartCard />
      </div>

      <div className="flex gap-8 items-start flex-wrap">
        <Card className="basis-[600px] space-y-4">
          <CardHeader>
            <CardTitle>Coming up</CardTitle>
            <CardDescription>Next assigned missions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMissions.length ? (
              <ul className="space-y-3">
                {upcomingMissions.map((mission) => (
                  <li key={mission.id}>
                    <MissionCard mission={mission} compact />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyMissions
                title="Nothing coming up"
                description="No later missions are assigned yet."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageCard>
  )
}

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#2563eb',
  },
  mobile: {
    label: 'Mobile',
    color: '#60a5fa',
  },
} satisfies ChartConfig

function DummyChartCard() {
  return (
    <Card className="min-w-[600px] flex-1">
      <CardHeader>
        <CardTitle>Bar Chart</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart accessibilityLayer data={chartData}>
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
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  )
}
