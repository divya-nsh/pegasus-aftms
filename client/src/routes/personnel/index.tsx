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
import { PencilIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
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
import { getMedicalDisplayStatus } from './-components/personnel-form'
import { getMediaUrl } from '@/lib/media'
import PageCard from '@/components/layout/PageCard'

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

  const table = useTable({
    ...baseTableOptions<TPersonnelListItem>(),
    data: personnelQ.data.items,
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
    <PageCard>
      <div className="bg-white rounded-sm">
        <div className="items-center gap-1 mb-4 pb-1 flex justify-between border-b">
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
              onValueChange={(value) =>
                setTypeFilter(
                  String(value ?? 'all') as
                    'all' | 'trainee' | 'instructor' | 'pilot',
                )
              }
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
            <ColumnVisibility table={table} />
          </div>
        </div>
        <AppTable table={table} rounded={false} />
        <TablePagination table={table} className="py-2 pb-4" />
      </div>

      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
