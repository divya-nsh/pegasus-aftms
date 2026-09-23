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
import GradingScaleDialog from './-components/grading-scale-form'
import type { GradingScaleFormData } from './-components/grading-scale-form'
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

export const Route = createFileRoute('/grading-scale/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Grading Scales" />
  ),
})

type TGradingScaleListItem =
  TrpcRouterOutputs['gradingScale']['getAll']['items'][number]

function toFormOptions(
  options: TGradingScaleListItem['options'],
): GradingScaleFormData['options'] {
  return options.map((option) => ({
    label: option.label,
    point: Number(option.point),
    lowerBound: Number(option.lowerBound),
    upperBound: Number(option.upperBound),
  }))
}

const ch = createColumnHelper<TTableFeatures, TGradingScaleListItem>()

const columns: ColumnDef<TTableFeatures, TGradingScaleListItem>[] = ch.columns([
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
  ch.accessor((row) => row.options.length, {
    header: 'Options',
    id: 'optionsCount',
    size: 100,
    meta: {
      align: 'center',
    },
  }),
])

function RouteComponent() {
  const gradingScaleQ = useSuspenseQuery(
    trpc.gradingScale.getAll.queryOptions(),
  )
  const queryClient = useQueryClient()

  const [formModel, setFormModel] = useState<{
    data?: GradingScaleFormData
    open: boolean
    editItemId?: number
  } | null>({
    open: false,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return trpcClient.gradingScale.delete.mutate({ id })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingScale.pathFilter())
      toast.add({
        type: 'success',
        title: 'Grading Scale Deleted Successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'Error',
        title: 'Failed to Delete Grading Scale',
        description: error.message,
      })
    },
  })

  const openModal = (rowId?: string) => {
    const row = rowId ? table.getRow(rowId).original : null
    if (!row) {
      setFormModel({ open: true })
    } else {
      setFormModel({
        open: true,
        editItemId: row.id,
        data: {
          name: row.name,
          notes: row.notes ?? '',
          options: row.options.map((option) => ({
            id: option.id,
            label: option.label,
            point: Number(option.point),
            lowerBound: Number(option.lowerBound),
            upperBound: Number(option.upperBound),
          })),
        },
      })
    }
  }

  const table = useTable({
    ...baseTableOptions<TGradingScaleListItem>(),
    data: gradingScaleQ.data.items,
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
            'Are you sure you want to delete this grading scale?',
          )
          if (confirm) {
            deleteMutation.mutate({ id: Number(rowId) })
          }
        }
      },
      onRowDoubleClick: (rowId) => openModal(rowId),
    },
    globalFilterFn: 'includesString',
  })

  return (
    <PageCard className="space-y-4">
      <div className="items-center gap-1 border-b mb-4 pb-1 flex justify-between">
        <h1 className="text-xl font-bold">Grading Scale</h1>
        <div className="flex items-center gap-4">
          <RefreshButton query={gradingScaleQ} />
          <NewButton onClick={() => setFormModel({ open: true })} />
        </div>
      </div>
      <ErrorAlert error={gradingScaleQ.error} />
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

      {formModel?.open && (
        <GradingScaleDialog
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
