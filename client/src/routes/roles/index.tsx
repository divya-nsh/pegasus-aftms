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
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { ActionMenu } from '@/components/table/action-menu'
import trpc, { trpcClient } from '@/trpc'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { TrpcRouterOutputs } from 'server/router'
import FullPageSpinner from '@/components/loaders/page-loader'
import { toast } from '@/components/ui/toast'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import PageCard, {
  ListTitle,
  PageCardContent,
  PageCardHeader,
} from '@/components/layout/PageCard'
import RefreshButton from '@/components/table/refresh-button'
import NewButton from '@/components/buttons/new-button'
import { RoleModelForm } from './-role-model-form'
import type { RoleModelFormData } from './-role-model-form'
import { formatDate } from '@/lib/date'
import { protectRouteBeforeLoad } from '@/lib/utils'

export const Route = createFileRoute('/roles/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => <ErrorAlert error={error} />,
  // It require permission for Admin with all access
  beforeLoad: protectRouteBeforeLoad('*'),
  loader({ context }) {
    context.queryClient.prefetchQuery(trpc.rolesV2.getAll.queryOptions())
  },
})

type TRoleListItem = TrpcRouterOutputs['rolesV2']['getAll'][number]

const ch = createColumnHelper<TTableFeatures, TRoleListItem>()

const columns: ColumnDef<TTableFeatures, TRoleListItem>[] = ch.columns([
  ch.display({
    header: '-',
    cell: (info) => {
      if (info.row.original.isSystem) return null

      const triggerAction = (action: 'edit' | 'delete') => () => {
        info.table.options.meta?.onRowAction?.(action, info.row.id)
      }

      return (
        <ActionMenu
          actions={[
            {
              type: 'edit',
              onClick: triggerAction('edit'),
            },
            {
              type: 'delete',
              onClick: triggerAction('delete'),
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
  ch.accessor('name', {
    header: 'Name',
    size: 150,
    cell: (info) => (
      <span className="inline-flex items-center gap-2">
        {info.getValue()}
        {info.row.original.isSystem ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            System
          </span>
        ) : null}
      </span>
    ),
  }),
  ch.accessor('permissions', {
    header: 'Permissions',
    cell: (info) => {
      const value = info.getValue()
      return value ? value.join(', ') : '-'
    },
  }),
  ch.accessor('description', {
    header: 'Description',
    cell: (info) => info.getValue() ?? '-',
  }),
  ch.accessor('createdAt', {
    header: 'Created At',
    cell: (info) => formatDate(info.getValue(), true),
  }),
])

const moduleName = 'role'

function RouteComponent() {
  const listQuery = useSuspenseQuery(trpc.rolesV2.getAll.queryOptions())
  const queryClient = useQueryClient()

  const [formModelState, setFormModelState] = useState<{
    data?: RoleModelFormData
    open: boolean
  }>({
    open: false,
  })

  const [columnFilters, setColumnFilters] = useState<string>('')

  const openModal = (rowId?: string) => {
    const row = rowId ? table.getRow(rowId).original : undefined
    if (row?.isSystem) return
    if (row) {
      setFormModelState({
        open: true,
        data: {
          name: row.name,
          description: row.description ?? '',
          permissions: new Set(row.permissions),
        },
      })
    } else {
      setFormModelState({
        open: true,
      })
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return trpcClient.rolesV2.delete.mutate(id)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.rolesV2.pathFilter())
      toast.add({
        type: 'success',
        title: `${moduleName} Deleted Successfully`,
      })
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: `Failed to Delete ${moduleName}`,
        description: error.message,
      })
    },
  })

  const table = useTable({
    ...baseTableOptions<TRoleListItem>(),
    data: listQuery.data,
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
        } else if (action === 'delete') {
          const row = table.getRow(rowId).original
          if (row.isSystem) return
          const confirm = window.confirm(
            `Are you sure you want to delete this ${moduleName}?`,
          )
          if (confirm) {
            deleteMutation.mutate(Number(rowId))
          }
        }
      },
      onRowDoubleClick: openModal,
    },
    state: {
      globalFilter: columnFilters,
    },
    onGlobalFilterChange: setColumnFilters,
    globalFilterFn: 'includesString',
  })

  return (
    <PageCard>
      <PageCardHeader>
        <ListTitle>Roles</ListTitle>
        <div className="flex items-center gap-4">
          <RefreshButton query={listQuery} />
          <NewButton onClick={() => openModal()} />
        </div>
      </PageCardHeader>
      <PageCardContent className="flex items-center justify-between">
        <SearchInput
          value={table.state.globalFilter ?? ''}
          onValueChange={(value) => table.setGlobalFilter(value)}
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

      {formModelState.open && (
        <RoleModelForm
          mode={formModelState.data?.id ? 'edit' : 'create'}
          initialFormData={formModelState.data}
          onClose={() => setFormModelState({ open: false })}
        />
      )}
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
