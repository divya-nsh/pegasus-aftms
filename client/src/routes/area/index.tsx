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
import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
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
import { formatDate } from '@/lib/date'
import FullPageSpinner from '@/components/loaders/page-loader'
import { ActionMenu } from '@/components/table/action-menu'
import { toast } from '@/components/ui/toast'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import PageCard from '@/components/layout/PageCard'

export const Route = createFileRoute('/area/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Areas" />
  ),
})

type TAreaListItem = TrpcRouterOutputs['areas']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TAreaListItem>()

const columns: ColumnDef<TTableFeatures, TAreaListItem>[] = ch.columns([
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
    header: 'S.No',
    cell: (info) => info.row.index + 1,
    size: 70,
    id: 'index',
    meta: {
      align: 'center',
    },
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

  ch.accessor('createdAt', {
    header: 'Created At',
    cell: (info) => formatDate(info.getValue<Date>(), true),
  }),

  ch.accessor('updatedAt', {
    header: 'Updated At',
    cell: (info) => formatDate(info.getValue<Date>(), true),
  }),
])

function RouteComponent() {
  const areasQ = useSuspenseQuery(trpc.areas.getAll.queryOptions())
  const queryClient = useQueryClient()

  const [formModel, setFormModel] = useState<{
    data?: AreaFormData
    open: boolean
    editItemId?: number
  } | null>({
    open: false,
  })

  const [columnFilters, setColumnFilters] = useState<string>('')

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
        } else if (action === 'delete') {
          const confirm = window.confirm(
            'Are you sure you want to delete this area?',
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
        <h1 className="text-xl font-bold">Areas</h1>
        <Button onClick={() => setFormModel({ open: true })}>
          <PlusIcon />
          New
        </Button>
      </div>
      <ErrorAlert error={areasQ.error} />
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

      {formModel?.open && (
        <AreaForm
          mode={formModel.editItemId ? 'edit' : 'create'}
          initialFormData={formModel.data}
          toEditId={formModel.editItemId}
          onOpenChange={(open) => setFormModel({ ...formModel, open })}
        />
      )}
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
