import ErrorAlert from '@/components/errors/ErrorAlert'
import { SearchInput } from '@/components/inputs/searchInput'
import { ColumnVisibility } from '@/components/table/column-visibility'
import { TablePagination } from '@/components/table/table-pagination'
import {
  AppTable,
  baseTableOptions,
  createTableActionHandler,
  // eslint-disable-next-line import/consistent-type-specifier-style
  type TTableFeatures,
} from '@/components/table/table.tsx'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { TrashIcon } from 'lucide-react'
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
import PageCard, {
  ListTitle,
  PageCardContent,
  PageCardHeader,
} from '@/components/layout/PageCard'
import NewButton from '@/components/buttons/new-button'
import UserForm from './-components/user-form'
import type { UserFormData } from './-components/user-form'
import { protectRouteBeforeLoad } from '@/lib/utils'
import { AccessControl } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/users/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  beforeLoad: protectRouteBeforeLoad('user.read'),
  errorComponent: ({ error }: { error: unknown }) => (
    <ErrorAlert error={error} title="Failed to Load Users" />
  ),
  loader({ context }) {
    context.queryClient.prefetchQuery(trpc.users.getAll.queryOptions())
    context.queryClient.prefetchQuery(trpc.rolesV2.getAll.queryOptions())
  },
})

type TUserListItem = TrpcRouterOutputs['users']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TUserListItem>()

const columns: ColumnDef<TTableFeatures, TUserListItem>[] = ch.columns([
  ch.display({
    header: '-',
    cell: (info) => {
      const handleAction = createTableActionHandler(info)
      return (
        <ActionMenu
          actions={[
            {
              type: 'view',
              onClick: handleAction('view'),
              // If User can't update then lable edit as view
            },
            {
              type: 'edit',
              onClick: handleAction('edit'),
              permissionKey: 'user.update',
            },
            {
              label: 'Delete',
              isDestructive: true,
              icon: <TrashIcon className="h-4 w-4" />,
              onClick: () => {
                info.table.options.meta?.onRowAction?.('delete', info.row.id)
              },
              permissionKey: 'user.delete',
            },
          ]}
        />
      )
    },
    size: 70,
    id: 'actions',
    meta: {
      align: 'center',
      preventDefaultRowClick: true,
    },
    minSize: 70,
  }),
  ch.accessor('username', {
    header: 'Username',
  }),
  ch.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue() ?? '-',
  }),
  ch.accessor('role.name', {
    header: 'Role',
    cell: (info) => (
      <Badge variant="outline" size="sm">
        {info.getValue() ?? '-'}
      </Badge>
    ),
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

function toUserFormData(row: TUserListItem): UserFormData {
  return {
    username: row.username,
    password: '',
    isActive: row.isActive,
    name: row.name ?? '',
    roleId: row.roleId,
  }
}

function RouteComponent() {
  const [modal, setModal] = useState<{
    mode: 'create' | 'edit' | 'view'
    rowId?: number
  } | null>(null)
  const usersQ = useSuspenseQuery(trpc.users.getAll.queryOptions())
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState<string>('')

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

  const closeModal = () => {
    setModal(null)
  }

  const openModal = (rowId?: string, mode?: 'create' | 'edit' | 'view') => {
    if (rowId) {
      setModal({
        mode: mode ?? 'edit',
        rowId: Number(rowId),
      })
      return
    } else {
      setModal({
        mode: mode ?? 'create',
      })
    }
  }

  const editUser = modal?.rowId
    ? usersQ.data.items.find((item) => item.id === modal.rowId)
    : undefined

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
          openModal(rowId)
        } else if (action === 'view') {
          openModal(rowId, 'view')
        } else if (action === 'delete') {
          const confirm = window.confirm(
            'Are you sure you want to delete this user?',
          )
          if (confirm) {
            deleteMutation.mutate({ toDeleteId: Number(rowId) })
          }
        }
      },
      onRowDoubleClick: openModal,
    },
    state: {
      globalFilter: searchText,
    },
    onGlobalFilterChange: setSearchText,
    globalFilterFn: 'includesString',
  })

  return (
    <PageCard>
      <PageCardHeader>
        <ListTitle>Users</ListTitle>
        <div className="flex items-center gap-4">
          <RefreshButton query={usersQ} />
          <AccessControl permissionKey="user.create">
            <NewButton onClick={() => openModal()} />
          </AccessControl>
        </div>
      </PageCardHeader>

      <PageCardContent className="flex items-center justify-between">
        <SearchInput
          value={searchText}
          onValueChange={setSearchText}
          placeholder="Search..."
          className="shadow-none max-w-75"
        />
        <div className="flex items-center gap-4">
          <ColumnVisibility table={table} />
        </div>
      </PageCardContent>

      <AppTable
        table={table}
        rounded={false}
        className="border-l-0 border-r-0"
      />

      <PageCardContent>
        <TablePagination table={table} />
      </PageCardContent>

      {modal?.mode === 'create' && (
        <UserForm mode="create" onClose={closeModal} />
      )}
      {(modal?.mode === 'edit' || modal?.mode === 'view') && editUser && (
        <UserForm
          mode={modal.mode}
          initialFormData={toUserFormData(editUser)}
          toEditId={editUser.id}
          linkedPersonnel={editUser.personnel[0] ?? null}
          onClose={closeModal}
        />
      )}
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
