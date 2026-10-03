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
import GradingAttributeDialog from './-components/grading-attribute-form'
import type { GradingAttributeFormData } from './-components/grading-attribute-form'
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
import NewButton from '@/components/buttons/new-button'
import RefreshButton from '@/components/table/refresh-button'
import { AccessControl, useUserCan } from '@/context/auth-context'
import { protectRouteBeforeLoad } from '@/lib/utils'
import { useModalForm } from '@/hooks/use-form-modal'

export const Route = createFileRoute('/grading-attribute/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }: { error: unknown }) => (
    <ErrorAlert error={error} title="Failed to Load Grading Attributes" />
  ),
  beforeLoad: protectRouteBeforeLoad('gradingAttribute.read'),
  loader({ context }) {
    context.queryClient.prefetchQuery(
      trpc.gradingAttribute.getAll.queryOptions(),
    )
  },
})

type TGradingAttributeListItem =
  TrpcRouterOutputs['gradingAttribute']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TGradingAttributeListItem>()

const columns: ColumnDef<TTableFeatures, TGradingAttributeListItem>[] =
  ch.columns([
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
                permissionKey: ({ isUserCan }) =>
                  !isUserCan('gradingAttribute.update'),
              },
              {
                type: 'edit',
                onClick: handleAction('edit'),
                permissionKey: 'gradingAttribute.update',
              },
              {
                type: 'delete',
                onClick: handleAction('delete'),
                permissionKey: 'gradingAttribute.delete',
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
    }),
    ch.accessor('notes', {
      header: 'Description',
      cell: (info) => {
        return (
          info.getValue() ?? <span className="text-muted-foreground">N/A</span>
        )
      },
    }),
  ])

function RouteComponent() {
  const canUpdate = useUserCan('gradingAttribute.update')
  const gradingAttributeQ = useSuspenseQuery(
    trpc.gradingAttribute.getAll.queryOptions(),
  )
  const queryClient = useQueryClient()

  const {
    modalState,
    openModal: _openModal,
    closeModal,
  } = useModalForm<GradingAttributeFormData>()

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return trpcClient.gradingAttribute.delete.mutate({ id })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingAttribute.pathFilter())
      toast.add({
        type: 'success',
        title: 'Grading Attribute Deleted Successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'Error',
        title: 'Failed to Delete Grading Attribute',
        description: error.message,
      })
    },
  })

  const openModal = (rowId?: string) => {
    if (rowId) {
      const row = table.getRow(rowId).original
      _openModal(
        {
          id: row.id,
          name: row.name,
          notes: row.notes ?? '',
        },
        !canUpdate,
      )
    } else {
      _openModal()
    }
  }

  const table = useTable({
    ...baseTableOptions<TGradingAttributeListItem>(),
    data: gradingAttributeQ.data.items,
    getRowId: (row) => row.id.toString(),
    columns,
    meta: {
      onRowAction: (action, rowId) => {
        if (action === 'edit') {
          openModal(rowId)
        } else if (action === 'delete') {
          const confirm = window.confirm(
            'Are you sure you want to delete this grading attribute?',
          )
          if (confirm) {
            deleteMutation.mutate({ id: Number(rowId) })
          }
        }
      },
    },
    globalFilterFn: 'includesString',
  })

  return (
    <PageCard className="space-y-4">
      <div className="items-center gap-1 border-b mb-4 pb-1 flex justify-between">
        <h1 className="text-lg font-bold">
          Grading Attribute / Evaluation Categories
        </h1>
        <div className="flex items-center gap-4">
          <RefreshButton query={gradingAttributeQ} />
          <AccessControl permissionKey={'gradingAttribute.create'}>
            <NewButton onClick={() => openModal()} />
          </AccessControl>
        </div>
      </div>
      <ErrorAlert error={gradingAttributeQ.error} />
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
      <AppTable table={table} coverFullWidth />
      <TablePagination table={table} />

      {modalState.open && (
        <GradingAttributeDialog
          mode={modalState.mode}
          initialFormData={modalState.data}
          onClose={closeModal}
        />
      )}
      <BlockingLoaderOverlay show={deleteMutation.isPending} />
    </PageCard>
  )
}
