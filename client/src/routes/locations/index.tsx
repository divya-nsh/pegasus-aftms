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
import LocationForm from './-components/location-form'
import type { LocationFormData as FormData } from './-components/location-form'
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
import PageCard from '@/components/layout/PageCard'
import { protectRouteBeforeLoad } from '@/lib/utils'
import NewButton from '@/components/buttons/new-button'
import RefreshButton from '@/components/table/refresh-button'
import { AccessControl, useUserCan } from '@/context/auth-context'
import { useModalForm } from '@/hooks/use-form-modal'

export const Route = createFileRoute('/locations/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  beforeLoad: protectRouteBeforeLoad('location.read'),
  errorComponent: ({ error }: { error: unknown }) => (
    <ErrorAlert error={error} title="Failed to Load Locations" />
  ),
  loader({ context }) {
    context.queryClient.prefetchQuery(trpc.locations.getAll.queryOptions())
  },
})

type TLocationListItem =
  TrpcRouterOutputs['locations']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TLocationListItem>()

const columns: ColumnDef<TTableFeatures, TLocationListItem>[] = ch.columns([
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
              permissionKey: ({ isUserCan }) => !isUserCan('location.update'),
            },
            {
              type: 'edit',
              onClick: handleAction('edit'),
              permissionKey: 'location.update',
            },
            {
              type: 'delete',
              onClick: handleAction('delete'),
              permissionKey: 'location.delete',
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
  // ch.display({
  //   header: 'S.No',
  //   cell: ({ row }) => {
  //     const displayIndex = row.getDisplayIndex()
  //     return displayIndex === -1 ? '' : displayIndex + 1
  //   },
  //   size: 70,
  //   id: 'index',
  //   meta: {
  //     align: 'center',
  //   },
  // }),
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
  // ch.accessor('phone', {
  //   header: 'Phone',
  // }),
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
  const canUpdate = useUserCan('location.update')
  const locationsQ = useSuspenseQuery(trpc.locations.getAll.queryOptions())
  const queryClient = useQueryClient()

  const {
    modalState,
    openModal: _openModal,
    closeModal,
  } = useModalForm<FormData>()

  const [columnFilters, setColumnFilters] = useState<string>('')

  const deleteMutation = useMutation({
    mutationFn: ({ toDeleteId }: { toDeleteId: number }) => {
      return trpcClient.locations.delete.mutate({ toDeleteId })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.locations.pathFilter())
      toast.add({
        type: 'success',
        title: 'Location Deleted Successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'Error',
        title: 'Failed to Delete Location',
        description: error.message,
      })
    },
  })

  const openModal = (row?: TLocationListItem) => {
    if (row) {
      _openModal(
        {
          id: row.id,
          name: row.name,
          code: row.code,
          address: row.address ?? '',
          phone: row.phone ?? '',
          description: row.description ?? '',
        },
        !canUpdate,
      )
    } else {
      _openModal()
    }
  }

  const table = useTable({
    ...baseTableOptions<TLocationListItem>(),
    data: locationsQ.data.items,
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
            'Are you sure you want to delete this location?',
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
  })

  return (
    <PageCard className="space-y-4 bg-slate-100 px-0 m-0 border md:px-4">
      <div className="bg-card rounded-lg border">
        <div className="items-center gap-4 border-b px-5 pt-4 mb-4 pb-2 flex justify-between">
          {/* <SidebarTrigger /> */}
          {/* <Separator orientation="vertical" className="mx-2" /> */}
          <h1 className="text-xl font-bold mr-auto">Locations</h1>
          <RefreshButton query={locationsQ} />
          <AccessControl permissionKey={'location.create'}>
            <NewButton onClick={() => openModal()} />
          </AccessControl>
        </div>
        <ErrorAlert error={locationsQ.error} />
        <div className=" mb-3 flex items-center justify-between px-5">
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
        <AppTable
          table={table}
          className="mt-4 rounded-none border-l-0 border-r-0"
        />
        <TablePagination table={table} className="px-4 p-4" />
      </div>

      {/* Form Modal */}
      {modalState.open && (
        <LocationForm
          mode={modalState.mode}
          initialFormData={modalState.data}
          onClose={closeModal}
        />
      )}
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
