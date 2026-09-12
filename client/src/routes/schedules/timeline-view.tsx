import ErrorAlert from '@/components/errors/ErrorAlert'
import { BasicSelectField, DateField } from '@/components/inputs/TextField'
import PageCard from '@/components/layout/PageCard'
import FullPageSpinner from '@/components/loaders/page-loader'
import RefetchButton from '@/components/table/refresh-button'
import { Button } from '@/components/ui/button'
import { TIME_FORMAT } from '@/config/constants'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import trpc from '@/trpc'
import { getMissionType } from '@repo/shared'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { addDays, endOfDay, format, startOfDay } from 'date-fns'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Suspense, useMemo, useState } from 'react'
import type { TrpcRouterOutputs } from 'server/router'
import MissionStatusBadge, {
  isMissionStatus,
} from './-components/mission-stage-bar'
import type { MissionStatus } from './-components/mission-stage-bar'

export const Route = createFileRoute('/schedules/timeline-view')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Day Timeline" />
  ),
})

type TScheduleListItem =
  TrpcRouterOutputs['schedules']['getAll']['items'][number]

const TIMELINE_STATUSES = [
  'published',
  'in_progress',
  'completed',
  'cancelled',
] as const

const PX_PER_HOUR = 84
const GUTTER_PX = 10
const BLOCK_GAP_PX = 3

const BLOCK_ACCENT: Record<MissionStatus, string> = {
  draft: 'border-l-muted-foreground/40 bg-muted/60',
  published: 'border-l-sky-500 bg-sky-500/8 hover:bg-sky-500/12',
  in_progress: 'border-l-amber-500 bg-amber-500/10 hover:bg-amber-500/14',
  completed: 'border-l-emerald-500 bg-emerald-500/8 hover:bg-emerald-500/12',
  cancelled: 'border-l-destructive bg-destructive/8 hover:bg-destructive/12',
}

function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function formatClock(value: Date | string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, TIME_FORMAT)
}

function formatHourLabel(hour: number) {
  if (hour === 24) return '24:00'
  return `${String(hour).padStart(2, '0')}:00`
}

function personnelLabel(person: {
  firstName: string
  lastName?: string | null
  code?: string | null
}) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ')
  if (name && person.code) return `${name} (${person.code})`
  return name || person.code || 'Personnel'
}

type TimedSchedule = {
  item: TScheduleListItem
  startMs: number
  endMs: number
}

type PositionedSchedule = TimedSchedule & {
  column: number
  columns: number
}

function positionSchedules(items: TimedSchedule[]): PositionedSchedule[] {
  const sorted = [...items].sort(
    (a, b) => a.startMs - b.startMs || a.endMs - b.endMs,
  )
  const result: PositionedSchedule[] = []
  let cluster: TimedSchedule[] = []
  let clusterEnd = Number.NEGATIVE_INFINITY

  const flushCluster = () => {
    if (cluster.length === 0) return

    const columnEnds: number[] = []
    const columnsByEvent = new Map<TimedSchedule, number>()

    for (const event of cluster) {
      let column = columnEnds.findIndex((end) => end <= event.startMs)
      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(event.endMs)
      } else {
        columnEnds[column] = event.endMs
      }
      columnsByEvent.set(event, column)
    }

    const columns = columnEnds.length
    for (const event of cluster) {
      result.push({
        ...event,
        column: columnsByEvent.get(event) ?? 0,
        columns,
      })
    }

    cluster = []
    clusterEnd = Number.NEGATIVE_INFINITY
  }

  for (const event of sorted) {
    if (cluster.length > 0 && event.startMs >= clusterEnd) {
      flushCluster()
    }
    cluster.push(event)
    clusterEnd = Math.max(clusterEnd, event.endMs)
  }

  flushCluster()
  return result
}

function hourCeil(date: Date) {
  if (
    date.getMinutes() > 0 ||
    date.getSeconds() > 0 ||
    date.getMilliseconds() > 0
  ) {
    return Math.min(24, date.getHours() + 1)
  }
  return date.getHours()
}

function RouteComponent() {
  const { linkedPersonnel, user } = useAuth()
  const canPickPersonnel = Boolean(user?.role?.isAdmin)
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())

  const [selectedDate, setSelectedDate] = useState(() =>
    toDateInputValue(new Date()),
  )
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<number | null>(
    linkedPersonnel?.id ?? null,
  )

  const queryClient = useQueryClient()
  const day = parseLocalDate(selectedDate)

  const personnelOptions = useMemo(
    () =>
      personnelQ.data.items.map((person) => ({
        value: person.id,
        label: personnelLabel(person),
      })),
    [personnelQ.data.items],
  )

  const shiftDay = (days: number) => {
    setSelectedDate(toDateInputValue(addDays(day, days)))
  }

  return (
    <PageCard className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-1 border-b pb-1">
        <h1 className="text-xl font-bold">Day timeline</h1>
        <RefetchButton
          onClick={() =>
            queryClient.refetchQueries(trpc.schedules.pathFilter())
          }
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 px-3 py-3">
        <div className="flex items-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mb-px"
            onClick={() => shiftDay(-1)}
            aria-label="Previous day"
          >
            <ChevronLeft />
          </Button>
          <DateField
            label="Date"
            className="w-52"
            value={selectedDate}
            enableClear={false}
            onChange={(value) => {
              if (value) setSelectedDate(value.slice(0, 10))
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mb-px"
            onClick={() => shiftDay(1)}
            aria-label="Next day"
          >
            <ChevronRight />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mb-px"
          onClick={() => setSelectedDate(toDateInputValue(new Date()))}
        >
          Today
        </Button>
        <BasicSelectField
          label="Personnel"
          className="min-w-64 max-w-96 flex-1"
          placeholder="All personnel"
          options={personnelOptions}
          value={selectedPersonnelId?.toString() ?? ''}
          allowClear={canPickPersonnel}
          readOnly={!canPickPersonnel}
          onValueChange={(value) => {
            if (!canPickPersonnel) return
            setSelectedPersonnelId(value ? Number(value) : null)
          }}
        />
      </div>

      <Suspense
        fallback={
          <div className="rounded-lg border px-6 py-16 text-center text-sm text-muted-foreground">
            Loading schedules…
          </div>
        }
      >
        <DayTimeline day={day} personnelId={selectedPersonnelId} />
      </Suspense>
    </PageCard>
  )
}

function DayTimeline({
  day,
  personnelId,
}: {
  day: Date
  personnelId: number | null
}) {
  const schedulesQ = useSuspenseQuery(
    trpc.schedules.getAll.queryOptions({
      startDateTime: startOfDay(day),
      endDateTime: endOfDay(day),
      status: [...TIMELINE_STATUSES],
      personnelId: personnelId ?? undefined,
    }),
  )

  const { timed, untimed } = useMemo(() => {
    const timedItems: TimedSchedule[] = []
    const untimedItems: TScheduleListItem[] = []

    for (const item of schedulesQ.data.items) {
      if (!item.startDateTime || !item.endDateTime) {
        untimedItems.push(item)
        continue
      }
      const startMs = new Date(item.startDateTime).getTime()
      const endMs = new Date(item.endDateTime).getTime()
      if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
        untimedItems.push(item)
        continue
      }
      timedItems.push({ item, startMs, endMs })
    }

    return {
      timed: positionSchedules(timedItems),
      untimed: untimedItems,
    }
  }, [schedulesQ.data.items])

  const { startHour, endHour } = useMemo(() => {
    if (timed.length === 0) {
      return { startHour: 6, endHour: 18 }
    }

    const from = Math.min(
      ...timed.map((event) => new Date(event.startMs).getHours()),
    )
    const to = Math.max(
      ...timed.map((event) => hourCeil(new Date(event.endMs))),
    )

    return {
      startHour: Math.max(0, from),
      endHour: Math.min(24, Math.max(from + 1, to)),
    }
  }, [timed])

  const rangeStartMs = startOfDay(day).getTime() + startHour * 60 * 60 * 1000
  const hourCount = Math.max(1, endHour - startHour)
  const timelineHeight = hourCount * PX_PER_HOUR
  const hours = Array.from(
    { length: hourCount },
    (_, index) => startHour + index,
  )

  return (
    <div className="space-y-4">
      {untimed.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Time not set
          </h2>
          <div className="space-y-2">
            {untimed.map((item) => (
              <ScheduleCard key={item.id} schedule={item} />
            ))}
          </div>
        </section>
      ) : null}

      {timed.length === 0 && untimed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3 text-muted-foreground">
            <CalendarClock className="size-5" />
          </div>
          <p className="mt-3 text-sm font-medium">No schedules for this day</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick another date or personnel to see their day plan.
          </p>
        </div>
      ) : timed.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="relative flex" style={{ height: timelineHeight }}>
            <div className="relative w-20 shrink-0 border-r bg-muted/40">
              {hours.map((hour) => {
                const isFirst = hour === startHour
                return (
                  <div
                    key={hour}
                    className="absolute right-0 left-0 pr-3 text-right"
                    style={{ top: (hour - startHour) * PX_PER_HOUR }}
                  >
                    <span
                      className={cn(
                        'inline-block font-mono text-sm font-medium tabular-nums text-muted-foreground',
                        isFirst ? 'translate-y-1' : '-translate-y-1/2',
                      )}
                    >
                      {formatHourLabel(hour)}
                    </span>
                  </div>
                )
              })}
              <div
                className="absolute right-0 left-0 pr-3 text-right"
                style={{ top: timelineHeight }}
              >
                <span className="inline-block -translate-y-[calc(100%+2px)] font-mono text-sm font-medium tabular-nums text-muted-foreground">
                  {formatHourLabel(endHour)}
                </span>
              </div>
            </div>

            <div className="relative min-w-0 flex-1">
              {hours.map((hour, index) => (
                <div
                  key={hour}
                  className={cn(
                    'absolute right-0 left-0 border-t',
                    index % 2 === 0 ? 'bg-muted/15' : 'bg-transparent',
                  )}
                  style={{
                    top: (hour - startHour) * PX_PER_HOUR,
                    height: PX_PER_HOUR,
                  }}
                >
                  <div
                    className="absolute right-0 left-0 border-t border-dashed border-border/70"
                    style={{ top: PX_PER_HOUR / 2 }}
                  />
                </div>
              ))}
              <div
                className="absolute right-0 left-0 border-t"
                style={{ top: timelineHeight }}
              />

              {timed.map((event) => {
                const top =
                  ((event.startMs - rangeStartMs) / 60000 / 60) * PX_PER_HOUR
                const height =
                  ((event.endMs - event.startMs) / 60000 / 60) * PX_PER_HOUR
                const widthPercent = 100 / event.columns
                const leftPercent = (event.column / event.columns) * 100

                return (
                  <div
                    key={event.item.id}
                    className="absolute z-10"
                    style={{
                      top: top + BLOCK_GAP_PX,
                      height: Math.max(40, height - BLOCK_GAP_PX * 2),
                      left: `calc(${leftPercent}% + ${GUTTER_PX}px)`,
                      width: `calc(${widthPercent}% - ${GUTTER_PX * 2}px)`,
                    }}
                  >
                    <ScheduleCard schedule={event.item} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ScheduleCard({ schedule }: { schedule: TScheduleListItem }) {
  const missionTypeId = schedule.mission?.missionType
  const eventType = missionTypeId
    ? (getMissionType(missionTypeId)?.name ?? missionTypeId)
    : '—'
  const accent = isMissionStatus(schedule.status)
    ? BLOCK_ACCENT[schedule.status]
    : BLOCK_ACCENT.draft

  return (
    <Link
      to="/schedules/$id/view"
      params={{ id: String(schedule.id) }}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block h-full min-h-0 overflow-hidden rounded-md border border-l-[3px] px-2.5 py-1.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
        accent,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-xs font-semibold tabular-nums">
          {formatClock(schedule.startDateTime)}
          <span className="px-1 font-normal text-muted-foreground">–</span>
          {formatClock(schedule.endDateTime)}
        </p>
        <MissionStatusBadge status={schedule.status} size="sm" />
      </div>
      <p className="mt-0.5 truncate text-sm font-medium leading-tight">
        {schedule.name || 'Untitled schedule'}
      </p>
      <p className="truncate text-[11px] leading-tight text-muted-foreground">
        {schedule.scheduleNumber || '—'}
        {' · '}
        {schedule.mission?.name || '—'}
        {' · '}
        {eventType}
        {' · '}
        {schedule.assignmentsCount || 0} pilots
      </p>
    </Link>
  )
}
