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
import { protectRouteBeforeLoad } from '@/lib/utils'
import PageCard from '@/components/layout/PageCard'
import RefreshButton from '@/components/table/refresh-button'
import NewButton from '@/components/buttons/new-button'
import AircraftForm from './-components/aircraft-form'
import type { AircraftFormData } from './-components/aircraft-form'

export const Route = createFileRoute('/aircraft/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  beforeLoad: protectRouteBeforeLoad('aircraft', 'view'),
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Aircraft" />
  ),
})

type TAircraftListItem =
  TrpcRouterOutputs['aircraft']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TAircraftListItem>()

const columns: ColumnDef<TTableFeatures, TAircraftListItem>[] = ch.columns([
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
      preventDefaultRowClick: true,
    },
    minSize: 70,
  }),
  ch.accessor('tailNumber', {
    header: 'Tail Number',
    size: 150,
  }),
  ch.accessor('name', {
    header: 'Name',
  }),
  ch.accessor('serialNumber', {
    header: 'Serial Number',
  }),
  ch.accessor('aircraftType', {
    header: 'Aircraft Type',
  }),
  ch.accessor('inductionDate', {
    header: 'Induction Date',
    cell: (info) => {
      const value = info.getValue()
      return value ? formatDate(value) : '-'
    },
  }),
  ch.accessor('status', {
    header: 'Status',
    size: 140,
  }),
  ch.accessor('createdAt', {
    header: 'Created At',
    cell: (info) => formatDate(info.getValue<Date>(), true),
  }),
])

function RouteComponent() {
  const aircraftQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())
  const queryClient = useQueryClient()

  const [formModel, setFormModel] = useState<{
    data?: AircraftFormData
    open: boolean
    editItemId?: number
  } | null>({
    open: false,
  })

  const [columnFilters, setColumnFilters] = useState<string>('')

  const openModal = (rowId?: string) => {
    const row = rowId ? table.getRow(rowId).original : undefined
    if (row) {
      setFormModel({
        open: true,
        editItemId: row.id,
        data: {
          name: row.name,
          tailNumber: row.tailNumber,
          serialNumber: row.serialNumber ?? '',
          aircraftType: row.aircraftType ?? '',
          inductionDate: row.inductionDate ?? '',
          remarks: row.remarks ?? '',
          status: row.status ?? '',
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
      return trpcClient.aircraft.delete.mutate({ toDeleteId })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.aircraft.pathFilter())
      toast.add({
        type: 'success',
        title: 'Aircraft Deleted Successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to Delete Aircraft',
        description: error.message,
      })
    },
  })

  const table = useTable({
    ...baseTableOptions<TAircraftListItem>(),
    data: aircraftQ.data.items,
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
          const confirm = window.confirm(
            'Are you sure you want to delete this aircraft?',
          )
          if (confirm) {
            deleteMutation.mutate({ toDeleteId: Number(rowId) })
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
      <div className="items-center gap-1 border-b mb-4 pb-1 flex justify-between">
        <h1 className="text-xl font-bold">Aircraft</h1>
        <div className="flex items-center gap-4">
          <RefreshButton query={aircraftQ} />
          <NewButton onClick={() => openModal()} />
        </div>
      </div>
      <ErrorAlert error={aircraftQ.error} />
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
        <AircraftForm
          mode={formModel.editItemId ? 'edit' : 'create'}
          initialFormData={formModel.data}
          toEditId={formModel.editItemId}
          onClose={() => setFormModel({ open: false })}
        />
      )}
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
