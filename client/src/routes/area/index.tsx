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
import { useState } from 'react'
import AreaForm from './-components/area-form'
import type { AreaFormData } from './-components/area-form'
import trpc, { trpcClient } from '@/trpc'
import {
  useQueryClient,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { TrpcRouterOutputs } from 'server/router'
import FullPageSpinner from '@/components/loaders/page-loader'
import { ActionMenu } from '@/components/table/action-menu'
import { toast } from '@/components/ui/toast'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import PageCard, {
  ListTitle,
  PageCardHeader,
  PageCardContent,
} from '@/components/layout/PageCard'
import RefreshButton from '@/components/table/refresh-button'
import { protectRouteBeforeLoad } from '@/lib/utils'
import NewButton from '@/components/buttons/new-button'
import { AccessControl, useUserCan } from '@/context/auth-context'

export const Route = createFileRoute('/area/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }: { error: unknown }) => (
    <ErrorAlert error={error} title="Failed to Load Areas" />
  ),
  beforeLoad: protectRouteBeforeLoad('area.read'),
  loader({ context }) {
    context.queryClient.prefetchQuery(trpc.areas.getAll.queryOptions())
  },
})

type TAreaListItem = TrpcRouterOutputs['areas']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TAreaListItem>()

const columns: ColumnDef<TTableFeatures, TAreaListItem>[] = ch.columns([
  ch.display({
    header: '-',
    cell: (info) => {
      const handleAction = createTableActionHandler(info)
      return (
        <ActionMenu
          actions={[
            {
              type: 'view',
              onClick: handleAction('edit'),
              permissionKey: ({ isUserCan }) => !isUserCan('area.update'),
            },
            {
              type: 'edit',
              onClick: handleAction('edit'),
              permissionKey: 'area.update',
            },
            {
              type: 'delete',
              onClick: handleAction('delete'),
              permissionKey: 'area.delete',
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
  ch.accessor('code', {
    header: 'Code',
    size: 150,
  }),

  ch.accessor('name', {
    header: 'Name',
  }),
  ch.accessor('address', {
    header: 'Address',
  }),
  ch.accessor('description', {
    header: 'Description',
  }),

  // ch.accessor('createdAt', {
  //   header: 'Created At',
  //   cell: (info) => formatDate(info.getValue<Date>(), true),
  // }),

  // ch.accessor('updatedAt', {
  //   header: 'Updated At',
  //   cell: (info) => formatDate(info.getValue<Date>(), true),
  // }),
])

function RouteComponent() {
  const areasQ = useSuspenseQuery(trpc.areas.getAll.queryOptions())
  const queryClient = useQueryClient()
  const canUpdate = useUserCan('area.update')

  const [formModel, setFormModel] = useState<{
    data?: AreaFormData
    open: boolean
    editItemId?: number
  } | null>({
    open: false,
  })

  const [columnFilters, setColumnFilters] = useState<string>('')

  const openModal = (row?: TAreaListItem) => {
    if (row) {
      setFormModel({
        open: true,
        editItemId: row.id,
        data: {
          name: row.name,
          code: row.code,
          address: row.address ?? '',
          description: row.description ?? '',
        },
      })
    } else {
      setFormModel({
        open: true,
      })
    }
  }

  const deleteMutation = useMutation({
    mutationFn: ({ toDeleteId }: { toDeleteId: number }) => {
      return trpcClient.areas.delete.mutate({ toDeleteId })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.areas.pathFilter())
      toast.add({
        type: 'success',
        title: 'Area Deleted Successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'Error',
        title: 'Failed to Delete Area',
        description: error.message,
      })
    },
  })

  const table = useTable({
    ...baseTableOptions<TAreaListItem>(),
    data: areasQ.data.items,
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
        const row = table.getRow(rowId).original
        if (action === 'edit') {
          openModal(row)
        } else if (action === 'delete') {
          const confirm = window.confirm(
            'Are you sure you want to delete this area?',
          )
          if (confirm) {
            deleteMutation.mutate({ toDeleteId: Number(rowId) })
          }
        }
      },
      onRowDoubleClick: (rowId) => {
        const row = table.getRow(rowId).original
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (row) openModal(row)
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
      <PageCardHeader>
        <ListTitle>Areas</ListTitle>
        <div className="flex items-center gap-4">
          <RefreshButton query={areasQ} />
          <AccessControl permissionKey={'area.create'}>
            <NewButton onClick={() => openModal()} />
          </AccessControl>
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

      {formModel?.open && (
        <AreaForm
          mode={formModel.editItemId ? (canUpdate ? 'edit' : 'view') : 'create'}
          initialFormData={formModel.data}
          toEditId={formModel.editItemId}
          onClose={() => setFormModel({ open: false })}
        />
      )}
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
