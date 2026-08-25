import ErrorAlert from '@/components/errors/ErrorAlert'
import BasicSelect from '@/components/inputs/basic-select'
import TextField from '@/components/inputs/TextField'
import { SearchInput } from '@/components/inputs/searchInput'
import PageCard from '@/components/layout/PageCard'
import FullPageSpinner from '@/components/loaders/page-loader'
import { ActionMenu } from '@/components/table/action-menu'
import { ColumnVisibility } from '@/components/table/column-visibility'
import { TablePagination } from '@/components/table/table-pagination'
import {
  AppTable,
  baseTableOptions,
  // eslint-disable-next-line import/consistent-type-specifier-style
  type TTableFeatures,
} from '@/components/table/table.tsx'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/date'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { EyeIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TrpcRouterOutputs } from 'server/router'
import MissionStatusBadge, {
  MISSION_STATUS_LABELS,
} from '@/routes/schedules/-components/mission-stage-bar'
import { personName } from '@/routes/schedules/-components/trainee-picker'

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
      <ActionMenu
        actions={[
          {
            label: 'View',
            icon: <EyeIcon className="h-4 w-4" />,
            onClick: () => {
              info.table.options.meta?.onRowAction?.('view', info.row.id)
            },
          },
        ]}
      />
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
  ch.accessor('attendanceStatus', {
    header: 'Attendance',
    size: 120,
    cell: (info) => ATTENDANCE_LABELS[info.getValue()] ?? info.getValue(),
  }),
  ch.accessor('result', {
    header: 'Result',
    size: 110,
    cell: (info) => RESULT_LABELS[info.getValue()] ?? info.getValue(),
  }),
  ch.accessor('score', {
    header: 'Score',
    size: 90,
    cell: (info) => info.getValue() ?? '-',
  }),
])

function RouteComponent() {
  const navigate = useNavigate()
  const [personId, setPersonId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [columnFilters, setColumnFilters] = useState('')

  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())
  const assignedQ = useSuspenseQuery(
    trpc.schedules.getAssigned.queryOptions({
      personId: personId ? Number(personId) : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      status: toAssignedStatus(statusFilter),
    }),
  )

  const traineeOptions = useMemo(() => {
    const trainees = personnelQ.data.items.filter(
      (person) => person.personnelType === 'trainee',
    )
    const list = trainees.length ? trainees : personnelQ.data.items
    return list.map((person) => ({
      value: String(person.id),
      label: `${personName(person)}${person.code ? ` (${person.code})` : ''}`,
    }))
  }, [personnelQ.data.items])

  const table = useTable({
    ...baseTableOptions<TAssignedMission>(),
    data: assignedQ.data.items,
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
        const row = assignedQ.data.items.find(
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
    <PageCard className="space-y-4">
      <div className="mb-4 flex items-center justify-between gap-1 border-b pb-1">
        <h1 className="text-xl font-bold">Trainee Dashboard</h1>
      </div>
      <ErrorAlert error={assignedQ.error} />
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <SearchInput
            value={table.state.globalFilter ?? ''}
            onValueChange={(value) => table.setGlobalFilter(value)}
            placeholder="Search..."
            className="max-w-75 shadow-none"
          />
          <div className="flex w-56 flex-col gap-2">
            <span className="text-sm font-medium">Trainee</span>
            <BasicSelect
              value={personId}
              onValueChange={(value) => setPersonId(String(value ?? ''))}
              placeholder="All"
              options={traineeOptions}
            />
          </div>
          <div className="flex w-44 flex-col gap-2">
            <span className="text-sm font-medium">Status</span>
            <BasicSelect
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(String(value ?? ''))}
              placeholder="All"
              options={statusFilterOptions}
            />
          </div>
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
          {fromDate || toDate || personId || statusFilter ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPersonId('')
                setStatusFilter('')
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
      <AppTable table={table} />
      <TablePagination table={table} />
    </PageCard>
  )
}
