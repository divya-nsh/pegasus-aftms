import ErrorAlert from '@/components/errors/ErrorAlert'
import BasicSelect from '@/components/inputs/basic-select'
import TextField from '@/components/inputs/TextField'
import { SearchInput } from '@/components/inputs/searchInput'
import PageCard from '@/components/layout/PageCard'
import FullPageSpinner from '@/components/loaders/page-loader'
import { ColumnVisibility } from '@/components/table/column-visibility'
import { TablePagination } from '@/components/table/table-pagination'
import {
  AppTable,
  baseTableOptions,
  // eslint-disable-next-line import/consistent-type-specifier-style
  type TTableFeatures,
} from '@/components/table/table.tsx'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { formatDate } from '@/lib/date'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  EyeIcon,
  ListTodoIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TrpcRouterOutputs } from 'server/router'
import MissionStatusBadge, {
  MISSION_STATUS_LABELS,
} from '@/routes/schedules/-components/mission-stage-bar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ASSIGNED_STATUSES = [
  'published',
  'in_progress',
  'completed',
  'cancelled',
] as const

type AssignedScheduleStatus = (typeof ASSIGNED_STATUSES)[number]

const statusFilterOptions: { label: string; value: AssignedScheduleStatus }[] =
  [
    { label: MISSION_STATUS_LABELS.published, value: 'published' },
    { label: MISSION_STATUS_LABELS.in_progress, value: 'in_progress' },
    { label: MISSION_STATUS_LABELS.completed, value: 'completed' },
    { label: MISSION_STATUS_LABELS.cancelled, value: 'cancelled' },
  ]

function toAssignedStatus(value: string): AssignedScheduleStatus | undefined {
  return ASSIGNED_STATUSES.find((status) => status === value)
}

export const Route = createFileRoute('/trainee-dashboard/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Trainee Dashboard" />
  ),
})

type TAssignedMission =
  TrpcRouterOutputs['schedules']['getAssigned']['items'][number]

const ATTENDANCE_LABELS: Record<string, string> = {
  pending: 'Pending',
  present: 'Present',
  absent: 'Absent',
  excused: 'Excused',
}

const RESULT_LABELS: Record<string, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
}

const ch = createColumnHelper<TTableFeatures, TAssignedMission>()

const columns: ColumnDef<TTableFeatures, TAssignedMission>[] = ch.columns([
  ch.display({
    header: '-',
    cell: (info) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          info.table.options.meta?.onRowAction?.('view', info.row.id)
        }}
      >
        <EyeIcon />
      </Button>
    ),
    size: 70,
    id: 'actions',
    meta: { align: 'center' },
    minSize: 70,
  }),
  ch.accessor('scheduleNumber', {
    header: 'Schedule No',
    size: 140,
    cell: (info) => info.getValue() || '-',
  }),
  ch.accessor('name', {
    header: 'Schedule',
    cell: (info) => {
      const row = info.row.original
      return (
        <Link
          to="/trainee-dashboard/$id"
          params={{ id: String(row.scheduleId) }}
          className="font-medium text-primary hover:underline"
        >
          {info.getValue() || row.missionName || 'View'}
        </Link>
      )
    },
  }),
  ch.accessor('missionName', {
    header: 'Mission',
    cell: (info) => info.getValue() || '-',
  }),
  ch.accessor(
    (row) =>
      [row.traineeFirstName, row.traineeLastName].filter(Boolean).join(' '),
    {
      id: 'trainee',
      header: 'Trainee',
      cell: (info) => {
        const row = info.row.original
        const name = info.getValue() || '-'
        return row.traineeCode ? `${name} (${row.traineeCode})` : name
      },
    },
  ),
  ch.accessor('status', {
    header: 'Status',
    size: 130,
    cell: (info) => <MissionStatusBadge status={info.getValue()} />,
  }),
  ch.accessor('startDateTime', {
    header: 'Start',
    cell: (info) => {
      const value = info.getValue()
      return value ? formatDate(value, true) : '-'
    },
  }),
  ch.accessor('endDateTime', {
    header: 'End',
    cell: (info) => {
      const value = info.getValue()
      return value ? formatDate(value, true) : '-'
    },
  }),
  ch.accessor(
    (row) =>
      [row.instructorFirstName, row.instructorLastName]
        .filter(Boolean)
        .join(' '),
    {
      id: 'instructor',
      header: 'Instructor',
      cell: (info) => info.getValue() || '-',
    },
  ),
  ch.accessor('aircraftName', {
    header: 'Aircraft',
    cell: (info) => {
      const row = info.row.original
      if (!row.aircraftName) return '-'
      return row.aircraftTailNumber
        ? `${row.aircraftName} (${row.aircraftTailNumber})`
        : row.aircraftName
    },
  }),
  ch.accessor('areaName', {
    header: 'Area',
    cell: (info) => info.getValue() || '-',
  }),
  // ch.accessor('attendanceStatus', {
  //   header: 'Attendance',
  //   size: 120,
  //   cell: (info) => ATTENDANCE_LABELS[info.getValue()] ?? info.getValue(),
  // }),
  ch.accessor('result', {
    header: 'Result',
    size: 110,
    cell: (info) => RESULT_LABELS[info.getValue()] ?? info.getValue(),
  }),
  ch.accessor('score', {
    header: 'Score',
    size: 90,
    cell: (info) => info.getValue() ?? '0',
  }),
])

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
}: {
  label: string
  hint: string
  value: number
  icon: React.ReactNode
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
  const navigate = useNavigate()
  const { user } = useAuth()
  const personId = user?.personnel[0]?.id
  const displayName = traineeDisplayName(user)

  const [statusFilter, setStatusFilter] = useState<
    'completed' | 'in_progress' | 'published' | 'all'
  >('published')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [columnFilters, setColumnFilters] = useState('')

  const assignedQ = useSuspenseQuery(
    trpc.schedules.getAssigned.queryOptions({
      personId: personId ?? -1,
    }),
  )

  const stats = useMemo(() => {
    const items = assignedQ.data.items
    return {
      total: items.length,
      notStarted: items.filter((item) => item.status === 'published').length,
      completed: items.filter((item) => item.status === 'completed').length,
    }
  }, [assignedQ.data.items])

  const tableItems = useMemo(() => {
    return assignedQ.data.items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (fromDate) {
        const start = item.startDateTime ? new Date(item.startDateTime) : null
        if (!start || start < new Date(`${fromDate}T00:00:00`)) return false
      }
      if (toDate) {
        const start = item.startDateTime ? new Date(item.startDateTime) : null
        if (!start || start > new Date(`${toDate}T23:59:59.999`)) return false
      }
      return true
    })
  }, [assignedQ.data.items, fromDate, statusFilter, toDate])

  const table = useTable({
    ...baseTableOptions<TAssignedMission>(),
    data: tableItems,
    getRowId: (row) => String(row.assignmentId),
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 50,
      },
    },
    meta: {
      onRowAction: (action, rowId) => {
        const row = tableItems.find(
          (item) => String(item.assignmentId) === rowId,
        )
        if (action === 'view' && row) {
          navigate({
            to: '/trainee-dashboard/$id',
            params: { id: String(row.scheduleId) },
          })
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
    <PageCard className="space-y-8">
      <section className="space-y-4">
        <div className="border-b pb-3">
          <p className="text-sm text-muted-foreground">Trainee Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Hey {displayName}
          </h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Not started"
            hint="Assigned, still pending"
            value={stats.notStarted}
            icon={<CalendarClockIcon className="size-4" />}
          />
          <StatCard
            label="Completed"
            hint="Missions you have done"
            value={stats.completed}
            icon={<CheckCircle2Icon className="size-4" />}
          />
          <StatCard
            label="Total assigned"
            hint="All missions assigned to you"
            value={stats.total}
            icon={<ListTodoIcon className="size-4" />}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-lg font-semibold">Missions</h2>
          <p className="text-sm text-muted-foreground">
            Filter and review your assigned missions
          </p>
        </div>
        <ErrorAlert error={assignedQ.error} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-end gap-3">
            {/* <div className="flex w-44 flex-col gap-2">
              <span className="text-sm font-medium">Status</span>
              <BasicSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(String(value ?? ''))}
                placeholder="All"
                options={statusFilterOptions}
              />
            </div> */}
            <TextField
              className="w-44"
              label="From date"
              type="date"
              value={fromDate}
              onValueChange={setFromDate}
            />
            <TextField
              className="w-44"
              label="To date"
              type="date"
              value={toDate}
              onValueChange={setToDate}
            />
            <SearchInput
              value={table.state.globalFilter ?? ''}
              onValueChange={(value) => table.setGlobalFilter(value)}
              placeholder="Search..."
              className="max-w-75 shadow-none"
            />
            {fromDate || toDate || statusFilter !== 'all' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatusFilter('all')
                  setFromDate('')
                  setToDate('')
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
          <ColumnVisibility table={table} />
        </div>
        <Tabs
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as 'completed' | 'in_progress' | 'published')
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">Started</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <AppTable table={table} />
        <TablePagination table={table} />
      </section>
    </PageCard>
  )
}
