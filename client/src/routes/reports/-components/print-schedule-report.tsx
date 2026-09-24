import { DATE_FORMAT, TIME_FORMAT, WEEKDAY_FORMAT } from '@/config/constants'
import { formatDate } from '@/lib/date'
import { getMissionType } from '@repo/shared'
import { format, isSameDay, startOfDay } from 'date-fns'
import type { ReactNode } from 'react'
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

const TABLE_COLUMNS = 7

function dash(value: string | number | null | undefined) {
  if (value == null || value === '') return '—'
  return String(value)
}

function personName(person: {
  firstName: string
  lastName?: string | null
  code?: string | null
}) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ')
  if (name && person.code) return `${name} (${person.code})`
  return name || person.code || 'Personnel'
}

function eventTypeLabel(item: PrintScheduleListItem) {
  const typeId = item.mission?.missionType ?? ''
  return getMissionType(typeId)?.name ?? typeId
}

function participantNames(item: PrintScheduleListItem) {
  if (!('assignments' in item) || !Array.isArray(item.assignments)) return []
  return item.assignments.flatMap((assignment) => {
    if (
      !assignment ||
      typeof assignment !== 'object' ||
      !('personnel' in assignment) ||
      !assignment.personnel
    ) {
      return []
    }
    return [personName(assignment.personnel)]
  })
}

function formatTimeRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
) {
  if (!start && !end) return '—'

  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null
  const startValid = startDate && !Number.isNaN(startDate.getTime())
  const endValid = endDate && !Number.isNaN(endDate.getTime())
  const sameDay = startValid && endValid && isSameDay(startDate, endDate)

  const startLabel = startValid ? format(startDate, TIME_FORMAT) : '—'
  const endLabel = endValid
    ? sameDay
      ? format(endDate, TIME_FORMAT)
      : formatDate(endDate, true)
    : '—'
  return `${startLabel} – ${endLabel}`
}

function groupKey(item: PrintScheduleListItem) {
  if (!item.startDateTime) return 'no-date'
  const date = new Date(item.startDateTime)
  if (Number.isNaN(date.getTime())) return 'no-date'
  return format(startOfDay(date), 'yyyy-MM-dd')
}

function groupLabel(key: string) {
  if (key === 'no-date') return 'No date'
  return format(
    new Date(`${key}T00:00:00`),
    `${WEEKDAY_FORMAT}, ${DATE_FORMAT}`,
  )
}

function Head({ children }: { children: string }) {
  return (
    <th className="border border-[#1f2f27] bg-[#1f2f27] px-2 py-1.5 text-left font-semibold text-white print:bg-[#1f2f27] print:text-white">
      {children}
    </th>
  )
}

function Cell({ children }: { children: ReactNode }) {
  return <td className="border-border px-2 py-2 align-top">{children}</td>
}

function ScheduleRows({
  items,
  includeParticipants,
}: {
  items: PrintScheduleListItem[]
  includeParticipants: boolean
}) {
  if (items.length === 0) {
    return (
      <tr>
        <td
          className="border border-border px-2 py-6 text-center text-muted-foreground"
          colSpan={TABLE_COLUMNS}
        >
          No schedules match the selected filters.
        </td>
      </tr>
    )
  }

  return (
    <>
      {items.map((item) => {
        const names = includeParticipants ? participantNames(item) : []
        return (
          <Fragment key={item.id}>
            <tr>
              <Cell>{dash(item.scheduleNumber)}</Cell>
              <Cell>
                {formatTimeRange(item.startDateTime, item.endDateTime)}
              </Cell>
              <Cell>{dash(item.name)}</Cell>
              <Cell>{dash(item.mission?.name)}</Cell>
              <Cell>{dash(eventTypeLabel(item))}</Cell>
              <Cell>{dash(item.area?.name)}</Cell>
              <Cell>{item.assignmentsCount || 0}</Cell>
            </tr>
            {includeParticipants ? (
              <tr>
                <td
                  className="border border-border bg-muted/30 px-2 py-1.5 align-top text-[11px] leading-relaxed"
                  colSpan={TABLE_COLUMNS}
                >
                  <p className="mb-1 font-semibold">Participants</p>
                  {names.length > 0 ? (
                    <ol className="grid grid-cols-3 gap-x-4 gap-y-0.5">
                      {names.map((name, index) => (
                        <li key={`${name}-${index}`}>
                          {index + 1}. {name}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ) : null}
          </Fragment>
        )
      })}
    </>
  )
}

export function SchedulePrintReportDocument({
  items,
  includeParticipants,
  meta,
}: {
  items: PrintScheduleListItem[]
  includeParticipants: boolean
  meta: PrintScheduleReportMeta
}) {
  const sorted = [...items].sort((a, b) => {
    const aTime = a.startDateTime ? new Date(a.startDateTime).getTime() : 0
    const bTime = b.startDateTime ? new Date(b.startDateTime).getTime() : 0
    return aTime - bTime || a.id - b.id
  })

  const groups = Object.entries(
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

  return (
    <div className="bg-background p-6 text-xs leading-snug text-foreground print:bg-white print:p-0 print:text-black [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
      <div className="mb-4 border-b pb-3">
        <h1 className="text-lg font-bold tracking-tight">Event Schedule</h1>
        <p className="mt-1 text-muted-foreground">
          {meta.endDate
            ? `${meta.startDate} – ${meta.endDate}`
            : `From ${meta.startDate}`}
          {' · '}
          {meta.statusLabel}
          {' · '}
          {meta.pilotLabel}
          {includeParticipants ? ' · Participants included' : ''}
        </p>
      </div>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <Head>Number</Head>
            <Head>Time</Head>
            <Head>Schedule</Head>
            <Head>Event</Head>
            <Head>Event type</Head>
            <Head>Area</Head>
            <Head>Pilots</Head>
          </tr>
        </thead>
        <tbody>
          {groups.length > 0 ? (
            groups.map(([key, groupItems]) => (
              <Fragment key={key}>
                <tr>
                  <td
                    className="bg-[#1f2f27]/15 px-2 py-1.5 font-semibold print:bg-[#d8ddd9]"
                    colSpan={TABLE_COLUMNS}
                  >
                    {groupLabel(key)}
                  </td>
                </tr>
                <ScheduleRows
                  items={groupItems}
                  includeParticipants={includeParticipants}
                />
              </Fragment>
            ))
          ) : (
            <ScheduleRows
              items={sorted}
              includeParticipants={includeParticipants}
            />
          )}
        </tbody>
      </table>
    </div>
  )
}
