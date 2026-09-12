import ErrorAlert from '@/components/errors/ErrorAlert'
import {
  BasicSelectField,
  DateField,
} from '@/components/inputs/TextField'
import PageCard from '@/components/layout/PageCard'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import FullPageSpinner from '@/components/loaders/page-loader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { toast } from '@/components/ui/toast'
import { formatDate } from '@/lib/date'
import trpc from '@/trpc'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { endOfDay, parseISO, startOfDay } from 'date-fns'
import { PrinterIcon } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
  MISSION_STATUS_LABELS,
  type MissionStatus,
} from '../schedules/-components/mission-stage-bar'
import {
  SchedulePrintReportDocument,
  type PrintScheduleListItem,
  type PrintScheduleReportMeta,
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
  const groupByDateId = useId()
  const printRef = useRef<HTMLDivElement>(null)

  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] =
    useState<PrintableStatusFilter>('all')
  const [personnelId, setPersonnelId] = useState<number | null>(null)
  const [groupByDate, setGroupByDate] = useState(false)
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
          }
        : {
            status: [...PRINTABLE_STATUSES],
          },
    [applied],
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
        PRINTABLE_STATUSES.includes(item.status as (typeof PRINTABLE_STATUSES)[number]),
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
      endDate: applied.endDate
        ? formatDate(parseISO(applied.endDate))
        : null,
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
    pageStyle: `@page { margin: 12mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`,
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
    <PageCard className="space-y-4 max-w-6xl">
      <div className="items-center gap-1 border-b mb-4 pb-1 flex justify-between">
        <h1 className="text-xl font-bold">Print Schedule</h1>
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

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 px-3 py-3">
        <DateField
          label="Start date"
          className="w-52"
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
          className="w-52"
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
          className="min-w-64 max-w-96 flex-1"
          placeholder="All"
          allowClear={false}
          options={personnelOptions}
          value={personnelId?.toString() ?? 'all'}
          onValueChange={(value) => {
            setPersonnelId(
              value && value !== 'all' ? Number(value) : null,
            )
          }}
        />
        <BasicSelectField
          label="Status"
          className="w-48"
          allowClear={false}
          options={statusFilterOptions}
          value={statusFilter}
          onValueChange={(value) => {
            if (!value) return
            setStatusFilter(value as PrintableStatusFilter)
          }}
        />
        <Field className="flex items-center gap-2 pb-2" orientation="horizontal">
          <Checkbox
            id={groupByDateId}
            checked={groupByDate}
            onCheckedChange={(checked) => setGroupByDate(checked === true)}
          />
          <FieldLabel htmlFor={groupByDateId}>Group by date</FieldLabel>
        </Field>
        <Button type="button" className="mb-px" onClick={handleGenerate}>
          Generate
        </Button>
      </div>

      <ErrorAlert error={schedulesQ.error} />

      {!applied ? (
        <div className="rounded-lg border px-6 py-16 text-center text-sm text-muted-foreground">
          Select filters and generate to preview the print report.
        </div>
      ) : schedulesQ.isFetching ? null : (
        <div className="rounded-lg border bg-background">
          <div ref={printRef}>
            {reportMeta ? (
              <SchedulePrintReportDocument
                items={items}
                groupByDate={groupByDate}
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
