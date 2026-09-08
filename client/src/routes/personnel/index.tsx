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
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { LayoutGridIcon, PencilIcon, TableIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { ActionMenu } from '@/components/table/action-menu'
import { Button } from '@/components/ui/button'
import trpc, { trpcClient } from '@/trpc'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { TrpcRouterOutputs } from 'server/router'
import { getPilotQualification } from '@repo/shared'
import { formatDate } from '@/lib/date'
import FullPageSpinner from '@/components/loaders/page-loader'
import { toast } from '@/components/ui/toast'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import { getMedicalDisplayStatus } from './-components/personnel-form'
import { PersonnelCard } from './-components/personnel-card'
import { getMediaUrl } from '@/lib/media'
import PageCard from '@/components/layout/PageCard'
import { useLocalStorage } from '@/hooks/use-local-storage'

export const Route = createFileRoute('/personnel/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Personnel" />
  ),
})

type TPersonnelListItem =
  TrpcRouterOutputs['personnel']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TPersonnelListItem>()

const columns: ColumnDef<TTableFeatures, TPersonnelListItem>[] = ch.columns([
  ch.display({
    header: '-',
    cell: (info) => {
      return (
        <ActionMenu
          actions={[
            {
              label: 'Edit',
              icon: <PencilIcon className="h-4 w-4" />,
              onClick: () => {
                info.table.options.meta?.onRowAction?.('edit', info.row.id)
              },
            },
            {
              label: 'Delete',
              isDestructive: true,
              icon: <TrashIcon className="h-4 w-4" />,
              onClick: () => {
                info.table.options.meta?.onRowAction?.('delete', info.row.id)
              },
            },
          ]}
        />
      )
    },
    size: 70,
    id: 'actions',
    meta: {
      align: 'center',
    },
    minSize: 70,
  }),
  ch.display({
    id: 'photo',
    header: 'Photo',
    size: 72,
    cell: (info) => {
      const imageId = info.row.original.imageId
      if (!imageId) {
        return <span className="text-muted-foreground">-</span>
      }
      return (
        <img
          src={getMediaUrl(imageId)}
          alt=""
          className="size-8 rounded-full object-cover"
        />
      )
    },
  }),
  ch.accessor('personnelType', {
    header: 'Type',
    size: 120,
  }),
  ch.accessor('code', {
    header: 'Personnel ID',
    size: 120,
  }),
  ch.accessor(
    (row) => [row.firstName, row.lastName].filter(Boolean).join(' '),
    {
      id: 'fullName',
      header: 'Full Name',
    },
  ),
  // ch.accessor('gender', {
  //   header: 'Gender',
  //   size: 110,
  // }),
  ch.accessor('rank', {
    header: 'Rank',
  }),
  ch.accessor('qualification', {
    header: 'Qualification',
    cell: (info) => getPilotQualification(info.getValue() ?? '')?.name ?? '—',
  }),
  ch.accessor('batchNo', {
    header: 'Batch No',
  }),
  // ch.accessor('phone', {
  //   header: 'Phone',
  // }),
  // ch.accessor('email', {
  //   header: 'Email',
  // }),
  ch.accessor(
    (row) =>
      getMedicalDisplayStatus({
        medicalStatus: row.medicalStatus,
        medicalValidUntil: row.medicalValidUntil,
      }),
    {
      id: 'medicalStatus',
      header: 'Medical Status',
    },
  ),
  ch.accessor('dateOfJoin', {
    header: 'Date of Joining',
    cell: (info) => {
      const value = info.getValue()
      return value ? formatDate(value) : '-'
    },
  }),
  ch.accessor('createdAt', {
    header: 'Created At',
    cell: (info) => formatDate(info.getValue<Date>(), true),
  }),
])

function RouteComponent() {
  const personnelQ = useSuspenseQuery(trpc.personnel.getAll.queryOptions())
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [columnFilters, setColumnFilters] = useState<string>('')
  const [viewMode, setViewMode] = useLocalStorage<'table' | 'cards'>(
    'personnel-view-mode',
    'table',
  )
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'trainee' | 'instructor' | 'pilot'
  >('all')

  const typeFilterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Trainee', value: 'trainee' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Pilot', value: 'pilot' },
  ] as const

  const deleteMutation = useMutation({
    mutationFn: ({ toDeleteId }: { toDeleteId: number }) => {
      return trpcClient.personnel.delete.mutate({ toDeleteId })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.personnel.pathFilter())
      toast.add({
        type: 'success',
        title: 'Personnel Deleted Successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to Delete Personnel',
        description: error.message,
      })
    },
  })

  const items =
    typeFilter === 'all'
      ? personnelQ.data.items
      : personnelQ.data.items.filter(
          (item) => item.personnelType === typeFilter,
        )

  const table = useTable({
    ...baseTableOptions<TPersonnelListItem>(),
    data: items,
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
        if (action === 'edit') {
          navigate({ to: '/personnel/$id/edit', params: { id: rowId } })
        } else if (action === 'delete') {
          const confirm = window.confirm(
            'Are you sure you want to delete this person?',
          )
          if (confirm) {
            deleteMutation.mutate({ toDeleteId: Number(rowId) })
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
        <h1 className="text-xl font-bold">Personnel</h1>
        <LinkButton to="/personnel/create" newButton />
      </div>
      <ErrorAlert error={personnelQ.error} />
      <div className=" mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SearchInput
            value={table.state.globalFilter ?? ''}
            onValueChange={(value) => table.setGlobalFilter(value)}
            placeholder="Search..."
            className="shadow-none max-w-75"
          />
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(
                String(value ?? 'all') as
                  'all' | 'trainee' | 'instructor' | 'pilot',
              )
              table.setPageIndex(0)
            }}
            items={[...typeFilterOptions]}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {typeFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border p-0.5">
            <Button
              type="button"
              size="icon-sm"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            >
              <TableIcon />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              aria-label="Card view"
              aria-pressed={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGridIcon />
            </Button>
          </div>
          {viewMode === 'table' ? <ColumnVisibility table={table} /> : null}
        </div>
      </div>
      {viewMode === 'table' ? (
        <AppTable table={table} />
      ) : (
        <div className="min-h-40">
          {table.getRowModel().rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No personnel found
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {table.getRowModel().rows.map((row) => (
                <PersonnelCard
                  key={row.id}
                  person={row.original}
                  onEdit={() =>
                    table.options.meta?.onRowAction?.('edit', row.id)
                  }
                  onDelete={() =>
                    table.options.meta?.onRowAction?.('delete', row.id)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
      <TablePagination table={table} />
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
