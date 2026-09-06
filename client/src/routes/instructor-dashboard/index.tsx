import PageCard from '@/components/layout/PageCard'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/auth-context'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import MissionStatusBadge from '@/routes/schedules/-components/mission-stage-bar'
import { createFileRoute } from '@tanstack/react-router'
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  Clock3Icon,
  GraduationCapIcon,
  ListTodoIcon,
  PlaneTakeoffIcon,
  UsersIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import {
  assignedTrainees,
  instructorStats,
  todayMissions,
  upcomingMissions,
} from './-components/mock-data'

export const Route = createFileRoute('/instructor-dashboard/')({
  component: RouteComponent,
})

function instructorDisplayName(user: ReturnType<typeof useAuth>['user']) {
  const person = user?.personnel[0]
  const personnelName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(' ')
  return user?.name || personnelName || user?.username || 'Instructor'
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function StatCard({
  label,
  hint,
  value,
  icon,
}: {
  label: string
  hint: string
  value: string | number
  icon: ReactNode
}) {
  return (
    <div className="flex items-start justify-between rounded-md border bg-background p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <span className="rounded-md bg-muted p-2 text-muted-foreground">
        {icon}
      </span>
    </div>
  )
}

function RouteComponent() {
  const { user } = useAuth()
  const displayName = instructorDisplayName(user)

  return (
    <PageCard className="space-y-8">
      <section className="space-y-4">
        <div className="border-b pb-3">
          <p className="text-sm text-muted-foreground">Instructor Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Hey {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Wednesday, 26 Aug 2026 · sample overview of your flying day
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Events today"
            hint="Sorties you are on today"
            value={instructorStats.missionsToday}
            icon={<CalendarClockIcon className="size-4" />}
          />
          <StatCard
            label="Events participated"
            hint="All events you have been part of"
            value={instructorStats.missionsParticipated}
            icon={<ListTodoIcon className="size-4" />}
          />
          <StatCard
            label="Trainees"
            hint="People assigned to you"
            value={instructorStats.trainees}
            icon={<UsersIcon className="size-4" />}
          />
          <StatCard
            label="In progress"
            hint="Events currently flying"
            value={instructorStats.inProgress}
            icon={<PlaneTakeoffIcon className="size-4" />}
          />
          <StatCard
            label="Completed this month"
            hint="Submitted sorties in August"
            value={instructorStats.completedThisMonth}
            icon={<CheckCircle2Icon className="size-4" />}
          />
          <StatCard
            label="Hours this month"
            hint="Instruction time logged"
            value={instructorStats.hoursThisMonth}
            icon={<Clock3Icon className="size-4" />}
          />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="border-b pb-2">
            <h2 className="text-lg font-semibold">Today&apos;s events</h2>
            <p className="text-sm text-muted-foreground">
              What you are scheduled to fly today
            </p>
          </div>
          <ul className="space-y-3">
            {todayMissions.map((mission) => (
              <li
                key={mission.id}
                className="rounded-md border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {mission.scheduleNumber}
                    </p>
                    <p className="font-medium">{mission.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {mission.missionName}
                    </p>
                  </div>
                  <MissionStatusBadge status={mission.status} />
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Time · </span>
                    {
                      formatDate(mission.startDateTime, true).split(', ')[1]
                    } – {formatDate(mission.endDateTime, true).split(', ')[1]}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Aircraft · </span>
                    {mission.aircraftName} ({mission.aircraftTailNumber})
                  </p>
                  <p>
                    <span className="text-muted-foreground">Area · </span>
                    {mission.areaName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Trainees · </span>
                    {mission.traineeNames.join(', ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="border-b pb-2">
            <h2 className="text-lg font-semibold">Coming up</h2>
            <p className="text-sm text-muted-foreground">
              Next events this week
            </p>
          </div>
          <ul className="space-y-3">
            {upcomingMissions.map((mission) => (
              <li
                key={mission.id}
                className="rounded-md border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{mission.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(mission.startDateTime, true)}
                    </p>
                  </div>
                  <GraduationCapIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mission.traineeNames.join(', ')} ·{' '}
                  {mission.aircraftTailNumber}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-lg font-semibold">Your trainees</h2>
          <p className="text-sm text-muted-foreground">
            People currently assigned to you
          </p>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainee</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last event</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedTrainees.map((trainee) => (
                <TableRow key={trainee.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {initials(trainee.firstName, trainee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {trainee.firstName} {trainee.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{trainee.code}</TableCell>
                  <TableCell>
                    {trainee.missionsCompleted}/{trainee.missionsAssigned}{' '}
                    completed
                  </TableCell>
                  <TableCell>{formatDate(trainee.lastMissionDate)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                        trainee.status === 'active'
                          ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {trainee.status === 'active' ? 'Active' : 'On leave'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </PageCard>
  )
}
