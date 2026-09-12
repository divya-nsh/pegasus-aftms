import ErrorAlert from '@/components/errors/ErrorAlert'
import { SearchInput } from '@/components/inputs/searchInput'
import { ColumnVisibility } from '@/components/table/column-visibility'
import { TablePagination } from '@/components/table/table-pagination'
import {
  AppTable,
  baseTableOptions,
  // eslint-disable-next-line import/consistent-type-specifier-style
  type TTableFeatures,
} from '@/components/table/table.tsx'
import LinkButton from '@/components/ui/link-button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import {
  CalendarClockIcon,
  EyeIcon,
  PencilIcon,
  PrinterIcon,
  TrashIcon,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import { ActionMenu } from '@/components/table/action-menu'
import trpc, { trpcClient } from '@/trpc'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { TrpcRouterOutputs } from 'server/router'
import { formatDate } from '@/lib/date'
import FullPageSpinner from '@/components/loaders/page-loader'
import { toast } from '@/components/ui/toast'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import MissionStatusBadge, {
  MISSION_STATUS_LABELS,
} from './-components/mission-stage-bar'
import PageCard from '@/components/layout/PageCard'
import RefetchButton from '@/components/table/refresh-button'
import { AccessControl } from '@/context/auth-context'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  EventSchedulePrintDocument,
  fetchScheduleForPrint,
} from './-components/print-schedule'
import type { PrintableSchedule } from './-components/print-schedule'

export const Route = createFileRoute('/schedules/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Event Schedules" />
  ),
})

type TScheduleListItem =
  TrpcRouterOutputs['schedules']['getAll']['items'][number]

const statusFilterOptions = [
  { label: 'All statuses', value: 'all' },
  { label: MISSION_STATUS_LABELS.draft, value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: MISSION_STATUS_LABELS.in_progress, value: 'in_progress' },
  { label: MISSION_STATUS_LABELS.completed, value: 'completed' },
  { label: MISSION_STATUS_LABELS.cancelled, value: 'cancelled' },
]

const ch = createColumnHelper<TTableFeatures, TScheduleListItem>()

const columns: ColumnDef<TTableFeatures, TScheduleListItem>[] = ch.columns([
  ch.display({
    header: '-',
    cell: (info) => {
      const handleClick =
        (action: 'edit' | 'view' | 'delete' | 'print') => () => {
          info.table.options.meta?.onRowAction?.(action, info.row.id)
        }
      return (
        <ActionMenu>
          <AccessControl module="schedule" action="view">
            <DropdownMenuItem onClick={handleClick('view')}>
              <EyeIcon className="h-4 w-4" />
              View
            </DropdownMenuItem>
          </AccessControl>
          <AccessControl module="schedule" action="view">
            <DropdownMenuItem onClick={handleClick('print')}>
              <PrinterIcon className="h-4 w-4" />
              Print
            </DropdownMenuItem>
          </AccessControl>
          <AccessControl module="schedule" action="edit">
            <DropdownMenuItem onClick={handleClick('edit')}>
              <PencilIcon className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </AccessControl>

          <AccessControl module="schedule" action="delete">
            <DropdownMenuItem
              variant="destructive"
              onClick={handleClick('delete')}
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </AccessControl>
        </ActionMenu>
      )
    },
    size: 70,
    id: 'actions',
    meta: {
      align: 'center',
    },
    minSize: 70,
  }),
  ch.accessor('scheduleNumber', {
    header: 'Number',
    size: 140,
    cell: (info) => {
      const original = info.row.original
      const value = info.getValue()
      return value ? (
        <Link
          to={`/schedules/$id/edit`}
          params={{ id: original.id.toString() }}
          className="text-sm hover:text-primary hover:underline"
        >
          {value}
        </Link>
      ) : (
        '-'
      )
    },
  }),
  ch.accessor('name', {
    header: 'Schedule Name',
  }),
  ch.accessor('status', {
    header: 'Status',
    size: 130,
    cell: (info) => <MissionStatusBadge status={info.getValue()} size="sm" />,
  }),

  ch.accessor('startDateTime', {
    header: 'Start Date',
    cell: (info) => {
      const value = info.getValue()
      return value ? formatDate(value, true) : '-'
    },
  }),
  ch.accessor('endDateTime', {
    header: 'End Date',
    cell: (info) => {
      const value = info.getValue()
      return value ? formatDate(value, true) : '-'
    },
  }),

  ch.accessor('mission.name', {
    header: 'Event',
    cell: (info) => (
      <Link
        to={`/events`}
        // params={{ id: info.row.original.missionId.toString() }}
        className="text-sm hover:text-primary hover:underline"
      >
        {info.getValue() || '-'}
      </Link>
    ),
  }),

  ch.accessor('assignmentsCount', {
    header: 'Total Pilots',
    cell: (info) => info.getValue() || 0,
  }),

  ch.accessor('area.name', {
    header: 'Area',
    cell: (info) => info.getValue() || '-',
  }),

  ch.accessor('createdAt', {
    header: 'Created At',
    size: 130,
    cell: (info) => {
      const value = info.getValue()
      return (
        <span className="text-sm" title={formatDate(value, true)}>
          {formatDate(value, false)}
        </span>
      )
    },
  }),
])

function RouteComponent() {
  const schedulesQ = useSuspenseQuery(trpc.schedules.getAll.queryOptions({}))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [columnFilters, setColumnFilters] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isPrinting, setIsPrinting] = useState(false)
  const [printSchedule, setPrintSchedule] = useState<PrintableSchedule | null>(
    null,
  )
  const printRef = useRef<HTMLDivElement>(null)
  const printScheduleRef = useRef<PrintableSchedule | null>(null)

  const printFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: () =>
      `Event Schedule ${printScheduleRef.current?.scheduleNumber || printScheduleRef.current?.name || ''}`.trim(),
    pageStyle: `@page { margin: 12mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`,
    onAfterPrint: () => {
      printScheduleRef.current = null
      setPrintSchedule(null)
    },
  })

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return schedulesQ.data.items
    return schedulesQ.data.items.filter((item) => item.status === statusFilter)
  }, [schedulesQ.data.items, statusFilter])

  const deleteMutation = useMutation({
    mutationFn: ({ toDeleteId }: { toDeleteId: number }) => {
      return trpcClient.schedules.delete.mutate({ toDeleteId })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.schedules.pathFilter())
      toast.add({
        type: 'success',
        title: 'Event schedule deleted successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to delete event schedule',
        description: error.message,
      })
    },
  })

  const handlePrint = async (id: number) => {
    setIsPrinting(true)
    try {
      const schedule = await fetchScheduleForPrint(id)
      printScheduleRef.current = schedule
      flushSync(() => {
        setPrintSchedule(schedule)
      })
      await printFn()
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Failed to print event schedule',
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsPrinting(false)
    }
  }

  const table = useTable({
    ...baseTableOptions<TScheduleListItem>(),
    data: filteredItems,
    getRowId: (row) => row.id.toString(),
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 50,
      },
    },
    meta: {
      onRowAction: (action, rowId) => {
        switch (action) {
          case 'edit':
            navigate({ to: '/schedules/$id/edit', params: { id: rowId } })
            break
          case 'view':
            navigate({ to: '/schedules/$id/view', params: { id: rowId } })
            break
          case 'print':
            void handlePrint(Number(rowId))
            break
          case 'delete': {
            const confirm = window.confirm(
              'Are you sure you want to delete this event schedule?',
            )
            if (confirm) {
              deleteMutation.mutate({ toDeleteId: Number(rowId) })
            }
            break
          }
        }
      },
    },
    state: {
      globalFilter: columnFilters,
    },
    onGlobalFilterChange: setColumnFilters,
    globalFilterFn: 'includesString',
  })

  return (
    <PageCard className="space-y-4">
      <div className="items-center gap-1 border-b mb-4 pb-1 flex justify-between">
        <h1 className="text-xl font-bold">Event Schedules</h1>
        <div className="flex items-center gap-2">
          <RefetchButton
            onClick={() => schedulesQ.refetch()}
            isPending={schedulesQ.isFetching}
            disabled={schedulesQ.isFetching}
          />
          <LinkButton to="/schedules/timeline-view" variant="outline">
            <CalendarClockIcon />
            Day timeline
          </LinkButton>
          <AccessControl module="schedule" action="create">
            <LinkButton to="/schedules/create" newButton />
          </AccessControl>
        </div>
      </div>
      <ErrorAlert error={schedulesQ.error} />
      <div className=" mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SearchInput
            value={table.state.globalFilter ?? ''}
            onValueChange={(value) => table.setGlobalFilter(value)}
            placeholder="Search..."
            className="shadow-none max-w-75"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(String(value ?? 'all'))}
            items={statusFilterOptions}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {statusFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ColumnVisibility table={table} />
        </div>
      </div>
      <AppTable table={table} />
      <TablePagination table={table} />
      {printSchedule ? (
        <div aria-hidden className="absolute top-0 -left-[10000px] w-[210mm]">
          <div ref={printRef}>
            <EventSchedulePrintDocument schedule={printSchedule} />
          </div>
        </div>
      ) : null}
      <BlockingLoaderOverlay show={deleteMutation.isPending || isPrinting} />
    </PageCard>
  )
}
