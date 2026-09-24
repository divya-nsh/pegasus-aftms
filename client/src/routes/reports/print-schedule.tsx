import ErrorAlert from '@/components/errors/ErrorAlert'
import { BasicSelectField, DateField } from '@/components/inputs/TextField'
import PageCard from '@/components/layout/PageCard'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import FullPageSpinner from '@/components/loaders/page-loader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { toast } from '@/components/ui/toast'
import { formatDate } from '@/lib/date'
import trpc from '@/trpc'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { endOfDay, parseISO, startOfDay } from 'date-fns'
import { CalendarDaysIcon, PrinterIcon } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { MISSION_STATUS_LABELS } from '../schedules/-components/mission-stage-bar'
import type { MissionStatus } from '../schedules/-components/mission-stage-bar'
import { SchedulePrintReportDocument } from './-components/print-schedule-report'
import type {
  PrintScheduleListItem,
  PrintScheduleReportMeta,
} from './-components/print-schedule-report'

export const Route = createFileRoute('/reports/print-schedule')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Print Schedule" />
  ),
})

const PRINTABLE_STATUSES = [
  'published',
  'in_progress',
  'completed',
] as const satisfies readonly MissionStatus[]

type PrintableStatusFilter = 'all' | (typeof PRINTABLE_STATUSES)[number]

const statusFilterOptions = [
  { label: 'All statuses', value: 'all' },
  ...PRINTABLE_STATUSES.map((status) => ({
    label: MISSION_STATUS_LABELS[status],
    value: status,
  })),
]

type AppliedFilters = {
  startDate: string
  endDate: string | null
  status: PrintableStatusFilter
  personnelId: number | null
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

function RouteComponent() {
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())
  const includeParticipantsId = useId()
  const printRef = useRef<HTMLDivElement>(null)

  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PrintableStatusFilter>('all')
  const [personnelId, setPersonnelId] = useState<number | null>(null)
  const [includeParticipants, setIncludeParticipants] = useState(false)
  const [applied, setApplied] = useState<AppliedFilters | null>(null)

  const queryInput = useMemo(
    () =>
      applied
        ? {
            startDateTime: startOfDay(parseISO(applied.startDate)),
            endDateTime: applied.endDate
              ? endOfDay(parseISO(applied.endDate))
              : undefined,
            status:
              applied.status === 'all'
                ? [...PRINTABLE_STATUSES]
                : [applied.status],
            personnelId: applied.personnelId ?? undefined,
            includeParticipants,
          }
        : {
            status: [...PRINTABLE_STATUSES],
          },
    [applied, includeParticipants],
  )

  const schedulesQ = useQuery(
    trpc.schedules.getAll.queryOptions(queryInput, {
      enabled: applied != null,
    }),
  )

  const personnelOptions = useMemo(
    () => [
      { label: 'All', value: 'all' },
      ...personnelQ.data.items.map((person) => ({
        value: person.id,
        label: personnelLabel(person),
      })),
    ],
    [personnelQ.data.items],
  )

  const items: PrintScheduleListItem[] = useMemo(
    () =>
      (schedulesQ.data?.items ?? []).filter((item) =>
        PRINTABLE_STATUSES.includes(
          item.status as (typeof PRINTABLE_STATUSES)[number],
        ),
      ),
    [schedulesQ.data?.items],
  )

  const reportMeta: PrintScheduleReportMeta | null = useMemo(() => {
    if (!applied) return null
    const selectedPerson = personnelQ.data.items.find(
      (person) => person.id === applied.personnelId,
    )
    return {
      startDate: formatDate(parseISO(applied.startDate)),
      endDate: applied.endDate ? formatDate(parseISO(applied.endDate)) : null,
      statusLabel:
        applied.status === 'all'
          ? 'All statuses'
          : MISSION_STATUS_LABELS[applied.status],
      pilotLabel: selectedPerson
        ? personnelLabel(selectedPerson)
        : 'All pilots',
    }
  }, [applied, personnelQ.data.items])

  const printFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Event Schedule Print',
    pageStyle: `
      @page {
        size: A4;
      }
      html, body {
        margin: 0;
        padding: 10px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    `,
  })

  const handleGenerate = () => {
    if (!startDate) {
      toast.add({
        type: 'error',
        title: 'Select a start date',
      })
      return
    }

    setApplied({
      startDate,
      endDate,
      status: statusFilter,
      personnelId,
    })
  }

  const handlePrint = () => {
    if (!applied || !reportMeta) {
      toast.add({
        type: 'error',
        title: 'Generate the report before printing',
      })
      return
    }
    void printFn()
  }

  return (
    <PageCard className="max-w-6xl space-y-5">
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">Print Schedule</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Preview and print events grouped by start date, including weekday
            and event type.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handlePrint}
          disabled={!applied || schedulesQ.isFetching}
        >
          <PrinterIcon />
          Print
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DateField
            label="Start date"
            required
            value={startDate}
            onChange={(value) => {
              setStartDate(value)
              if (value && endDate && value > endDate) {
                setEndDate(value)
              }
            }}
            placeholder="Start date"
          />
          <DateField
            label="End date"
            value={endDate}
            onChange={(value) => {
              setEndDate(value)
              if (value && startDate && value < startDate) {
                setStartDate(value)
              }
            }}
            placeholder="End date"
          />
          <BasicSelectField
            label="Pilot"
            placeholder="All"
            allowClear={false}
            options={personnelOptions}
            value={personnelId?.toString() ?? 'all'}
            onValueChange={(value) => {
              setPersonnelId(value && value !== 'all' ? Number(value) : null)
            }}
          />
          <BasicSelectField
            label="Status"
            allowClear={false}
            options={statusFilterOptions}
            value={statusFilter}
            onValueChange={(value) => {
              if (!value) return
              setStatusFilter(value as PrintableStatusFilter)
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <Field className="max-w-md gap-2" orientation="horizontal">
            <Checkbox
              id={includeParticipantsId}
              checked={includeParticipants}
              onCheckedChange={(checked) =>
                setIncludeParticipants(checked === true)
              }
            />
            <div className="space-y-0.5">
              <FieldLabel htmlFor={includeParticipantsId}>
                Include participants
              </FieldLabel>
              <FieldDescription>
                Print assigned names under each event
              </FieldDescription>
            </div>
          </Field>
          <Button type="button" onClick={handleGenerate}>
            Generate
          </Button>
        </div>
      </div>

      <ErrorAlert error={schedulesQ.error} />

      {!applied ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
          <CalendarDaysIcon className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No preview yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Choose a start date and generate the report to preview the printed
            schedule.
          </p>
        </div>
      ) : schedulesQ.isFetching ? null : (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div ref={printRef}>
            {reportMeta ? (
              <SchedulePrintReportDocument
                items={items}
                includeParticipants={includeParticipants}
                meta={reportMeta}
              />
            ) : null}
          </div>
        </div>
      )}

      <BlockingLoaderOverlay show={schedulesQ.isFetching} />
    </PageCard>
  )
}
