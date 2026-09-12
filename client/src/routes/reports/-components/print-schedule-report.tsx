import { DATE_FORMAT, TIME_FORMAT } from '@/config/constants'
import { formatDate } from '@/lib/date'
import { format, isSameDay, startOfDay } from 'date-fns'
import { Fragment } from 'react'
import type { TrpcRouterOutputs } from 'server/router'

export type PrintScheduleListItem =
  TrpcRouterOutputs['schedules']['getAll']['items'][number]

export type PrintScheduleReportMeta = {
  startDate: string
  endDate: string | null
  statusLabel: string
  pilotLabel: string
}

function dash(value: string | number | null | undefined) {
  if (value == null || value === '') return '—'
  return String(value)
}

function formatTimeRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  timesOnly: boolean,
) {
  if (!start && !end) return '—'

  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null
  const startValid = startDate && !Number.isNaN(startDate.getTime())
  const endValid = endDate && !Number.isNaN(endDate.getTime())
  const sameDay = startValid && endValid && isSameDay(startDate, endDate)

  if (timesOnly) {
    const startLabel = startValid ? format(startDate, TIME_FORMAT) : '—'
    const endLabel = endValid
      ? sameDay
        ? format(endDate, TIME_FORMAT)
        : formatDate(endDate, true)
      : '—'
    return `${startLabel} – ${endLabel}`
  }

  if (startValid && endValid && sameDay) {
    return `${formatDate(startDate, true)} – ${format(endDate, TIME_FORMAT)}`
  }

  return `${formatDate(start ?? null, true) || '—'} – ${formatDate(end ?? null, true) || '—'}`
}

function groupKey(item: PrintScheduleListItem) {
  if (!item.startDateTime) return 'no-date'
  const date = new Date(item.startDateTime)
  if (Number.isNaN(date.getTime())) return 'no-date'
  return format(startOfDay(date), 'yyyy-MM-dd')
}

function groupLabel(key: string) {
  if (key === 'no-date') return 'No date'
  return format(new Date(`${key}T00:00:00`), DATE_FORMAT)
}

function Head({ children }: { children: string }) {
  return (
    <th className="border border-border bg-muted px-2 py-1.5 text-left font-semibold">
      {children}
    </th>
  )
}

function Cell({ children }: { children: string | number }) {
  return (
    <td className="border border-border px-2 py-1.5 align-top">{children}</td>
  )
}

function ScheduleRows({
  items,
  timesOnly,
}: {
  items: PrintScheduleListItem[]
  timesOnly: boolean
}) {
  if (items.length === 0) {
    return (
      <tr>
        <td
          className="border border-border px-2 py-6 text-center text-muted-foreground"
          colSpan={6}
        >
          No schedules match the selected filters.
        </td>
      </tr>
    )
  }

  return (
    <>
      {items.map((item) => (
        <tr key={item.id}>
          <Cell>
            {formatTimeRange(item.startDateTime, item.endDateTime, timesOnly)}
          </Cell>
          <Cell>{dash(item.scheduleNumber)}</Cell>
          <Cell>{dash(item.name)}</Cell>
          <Cell>{dash(item.mission?.name)}</Cell>
          <Cell>{dash(item.area?.name)}</Cell>
          <Cell>{item.assignmentsCount || 0}</Cell>
        </tr>
      ))}
    </>
  )
}

export function SchedulePrintReportDocument({
  items,
  groupByDate,
  meta,
}: {
  items: PrintScheduleListItem[]
  groupByDate: boolean
  meta: PrintScheduleReportMeta
}) {
  const sorted = [...items].sort((a, b) => {
    const aTime = a.startDateTime ? new Date(a.startDateTime).getTime() : 0
    const bTime = b.startDateTime ? new Date(b.startDateTime).getTime() : 0
    return aTime - bTime || a.id - b.id
  })

  const groups = groupByDate
    ? Object.entries(
        sorted.reduce<Record<string, PrintScheduleListItem[]>>((acc, item) => {
          const key = groupKey(item)
          acc[key] ??= []
          acc[key].push(item)
          return acc
        }, {}),
      ).sort(([a], [b]) => {
        if (a === 'no-date') return 1
        if (b === 'no-date') return -1
        return a.localeCompare(b)
      })
    : null

  return (
    <div className="bg-background p-2 text-xs leading-snug text-foreground print:text-black">
      <h1 className="mb-1 text-lg font-bold">Event Schedule Print</h1>
      <p className="mb-4 text-muted-foreground">
        {meta.endDate
          ? `${meta.startDate} – ${meta.endDate}`
          : `From ${meta.startDate}`}{' '}
        · {meta.statusLabel} · {meta.pilotLabel}
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <Head>Start time – End time</Head>
            <Head>Number</Head>
            <Head>Schedule name</Head>
            <Head>Event</Head>
            <Head>Area</Head>
            <Head>Total pilots</Head>
          </tr>
        </thead>
        <tbody>
          {groups && groups.length > 0 ? (
            groups.map(([key, groupItems]) => (
              <Fragment key={key}>
                <tr>
                  <td
                    className="border border-border bg-muted px-2 py-1.5 font-semibold"
                    colSpan={6}
                  >
                    {groupLabel(key)}
                  </td>
                </tr>
                <ScheduleRows items={groupItems} timesOnly />
              </Fragment>
            ))
          ) : (
            <ScheduleRows items={sorted} timesOnly={false} />
          )}
        </tbody>
      </table>
    </div>
  )
}
