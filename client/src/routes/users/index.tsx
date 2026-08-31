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
import RefreshButton from '@/components/table/refresh-button'

export const Route = createFileRoute('/users/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Users" />
  ),
})

type TUserListItem = TrpcRouterOutputs['users']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TUserListItem>()

const columns: ColumnDef<TTableFeatures, TUserListItem>[] = ch.columns([
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
  ch.accessor('username', {
    header: 'Username',
  }),
  ch.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue() ?? '-',
    size: 100,
  }),
  ch.accessor('role', {
    header: 'Role',
    cell: (info) => info.getValue() ?? '-',
    size: 100,
  }),
  ch.accessor('isActive', {
    header: 'Active',
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
    size: 100,
  }),
  ch.accessor('lastLoginAt', {
    header: 'Last Login',
    cell: (info) => {
      const value = info.getValue()
      return value ? formatDate(value, true) : '-'
    },
  }),
  ch.accessor('createdAt', {
    header: 'Created At',
    cell: (info) => formatDate(info.getValue<Date>(), true),
  }),
])

function RouteComponent() {
  const usersQ = useSuspenseQuery(trpc.users.getAll.queryOptions())
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [columnFilters, setColumnFilters] = useState<string>('')

  const deleteMutation = useMutation({
    mutationFn: ({ toDeleteId }: { toDeleteId: number }) => {
      return trpcClient.users.delete.mutate({ toDeleteId })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.users.pathFilter())
      toast.add({
        type: 'success',
        title: 'User Deleted Successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to Delete User',
        description: error.message,
      })
    },
  })

  const table = useTable({
    ...baseTableOptions<TUserListItem>(),
    data: usersQ.data.items,
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
          navigate({ to: '/users/$id/edit', params: { id: rowId } })
        } else if (action === 'delete') {
          const confirm = window.confirm(
            'Are you sure you want to delete this user?',
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
    <div className="px-6 max-w-6xl mx-auto space-y-4">
      <div className="items-center gap-1 border-b mb-4 pb-1 flex justify-between">
        <h1 className="text-xl font-bold">Users</h1>
        <div className="flex items-center gap-2">
          <LinkButton to="/users/create" newButton />
          <RefreshButton
            isPending={usersQ.isRefetching}
            onClick={() => queryClient.refetchQueries(trpc.users.pathFilter())}
          />
        </div>
      </div>
      <ErrorAlert error={usersQ.error} />
      <div className=" mb-3 flex items-center justify-between">
        <SearchInput
          value={table.state.globalFilter ?? ''}
          onValueChange={(value) => table.setGlobalFilter(value)}
          placeholder="Search..."
          className="shadow-none max-w-75"
        />
        <div className="flex items-center gap-2">
          <ColumnVisibility table={table} />
        </div>
      </div>
      <AppTable table={table} />
      <TablePagination table={table} />
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </div>
  )
}
