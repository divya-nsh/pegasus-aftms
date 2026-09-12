import { formatDate, formatDateDifference } from '@/lib/date'
import { trpcClient } from '@/trpc'
import { getMissionType, getPersonnelType } from '@repo/shared'
import type { ReactNode } from 'react'
import type { TrpcRouterOutputs } from 'server/router'

export type PrintableSchedule = TrpcRouterOutputs['schedules']['getById']

function display(value: string | number | null | undefined) {
  if (value == null || value === '') return '—'
  return String(value)
}

function personName(
  person: PrintableSchedule['assignments'][number]['personnel'],
) {
  if (!person) return '—'
  return display([person.firstName, person.lastName].filter(Boolean).join(' '))
}

function aircraftLabel(
  aircraft: PrintableSchedule['assignments'][number]['aircraft'],
) {
  if (!aircraft) return '—'
  const name = aircraft.name.trim()
  const tail = aircraft.tailNumber.trim()
  if (name && tail) return `${name} (${tail})`
  return name || tail || '—'
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <tr>
      <th className="w-44 border border-border bg-muted px-2 py-1.5 text-left align-top font-semibold">
        {label}
      </th>
      <td className="border border-border px-2 py-1.5 align-top">{children}</td>
    </tr>
  )
}

function PilotHead({ children }: { children: ReactNode }) {
  return (
    <th className="border border-border bg-muted px-2 py-1.5 text-left font-semibold">
      {children}
    </th>
  )
}

function PilotCell({ children }: { children: ReactNode }) {
  return (
    <td className="border border-border px-2 py-1.5 align-top">{children}</td>
  )
}

export async function fetchScheduleForPrint(id: number) {
  return trpcClient.schedules.getById.query({ id })
}

export function EventSchedulePrintDocument({
  schedule,
}: {
  schedule: PrintableSchedule
}) {
  const eventType =
    getMissionType(schedule.mission?.missionType ?? '')?.name ??
    schedule.mission?.missionType
  const duration =
    schedule.startDateTime && schedule.endDateTime
      ? formatDateDifference(schedule.startDateTime, schedule.endDateTime)
      : null
  const dateRange = [
    formatDate(schedule.startDateTime, true) || '—',
    formatDate(schedule.endDateTime, true) || '—',
  ].join(' – ')

  return (
    <div className="bg-background p-2 text-xs leading-snug text-foreground print:text-black">
      <h1 className="mb-1 text-lg font-bold">Event Schedule</h1>
      <p className="mb-4 text-muted-foreground">
        {display(schedule.scheduleNumber)} · {display(schedule.name)}
      </p>
      <table className="mb-5 w-full border-collapse">
        <tbody>
          <DetailRow label="Name">{display(schedule.name)}</DetailRow>
          <DetailRow label="Number">
            {display(schedule.scheduleNumber)}
          </DetailRow>
          <DetailRow label="Start – End">{dateRange}</DetailRow>
          <DetailRow label="Mission / Event name">
            {display(schedule.mission?.name)}
          </DetailRow>
          <DetailRow label="Mission / Event type">
            {display(eventType)}
          </DetailRow>
          <DetailRow label="Area name">{display(schedule.area?.name)}</DetailRow>
          <DetailRow label="Duration">{display(duration)}</DetailRow>
          <DetailRow label="Description">
            <span className="whitespace-pre-wrap">
              {display(schedule.description)}
            </span>
          </DetailRow>
        </tbody>
      </table>
      <h2 className="mb-2 text-sm font-semibold">
        Pilots ({schedule.assignments.length})
      </h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <PilotHead>#</PilotHead>
            <PilotHead>Pilot name</PilotHead>
            <PilotHead>ID</PilotHead>
            <PilotHead>Type</PilotHead>
            <PilotHead>Aircraft</PilotHead>
          </tr>
        </thead>
        <tbody>
          {schedule.assignments.length === 0 ? (
            <tr>
              <td
                className="border border-border px-2 py-4 text-center text-muted-foreground"
                colSpan={5}
              >
                No pilots assigned.
              </td>
            </tr>
          ) : (
            schedule.assignments.map((assignment, index) => {
              const personnel = assignment.personnel
              const typeName =
                getPersonnelType(personnel?.personnelType ?? '')?.name ??
                personnel?.personnelType
              return (
                <tr key={assignment.id}>
                  <PilotCell>{index + 1}</PilotCell>
                  <PilotCell>{personName(personnel)}</PilotCell>
                  <PilotCell>
                    {display(personnel?.code || personnel?.id)}
                  </PilotCell>
                  <PilotCell>{display(typeName)}</PilotCell>
                  <PilotCell>{aircraftLabel(assignment.aircraft)}</PilotCell>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
