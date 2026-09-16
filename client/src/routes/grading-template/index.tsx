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
import GradingTemplateDialog from './-components/grading-template-form'
import type { GradingTemplateFormData } from './-components/grading-template-form'
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

export const Route = createFileRoute('/grading-template/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Grading Templates" />
  ),
})

type TGradingTemplateListItem =
  TrpcRouterOutputs['gradingTemplate']['getAll']['items'][number]

function toFormAttributes(
  attributes: TGradingTemplateListItem['gradingTemplateAttributes'],
): GradingTemplateFormData['attributes'] {
  return [...attributes]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((attribute) => ({
      attributeId: attribute.attributeId,
      weight: attribute.weight,
    }))
}

const ch = createColumnHelper<TTableFeatures, TGradingTemplateListItem>()

const columns: ColumnDef<TTableFeatures, TGradingTemplateListItem>[] =
  ch.columns([
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
    ch.accessor('gradingScale.name', {
      header: 'Grading Scale',
      id: 'gradingScale',
    }),
    ch.accessor((row) => row.gradingTemplateAttributes.length, {
      header: 'Total Attributes',
      id: 'attributesCount',
      size: 120,
      meta: {
        align: 'center',
      },
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
  const gradingTemplateQ = useSuspenseQuery(
    trpc.gradingTemplate.getAll.queryOptions(),
  )
  const queryClient = useQueryClient()

  const [formModel, setFormModel] = useState<{
    data?: GradingTemplateFormData
    open: boolean
    editItemId?: number
  } | null>({
    open: false,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return trpcClient.gradingTemplate.delete.mutate({ id })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.gradingTemplate.pathFilter())
      toast.add({
        type: 'success',
        title: 'Grading Template Deleted Successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'Error',
        title: 'Failed to Delete Grading Template',
        description: error.message,
      })
    },
  })

  const table = useTable({
    ...baseTableOptions<TGradingTemplateListItem>(),
    data: gradingTemplateQ.data.items,
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
              notes: row.notes ?? '',
              gradingScaleId: row.gradingScaleId,
              attributes: toFormAttributes(row.gradingTemplateAttributes),
            },
          })
        } else if (action === 'delete') {
          const confirm = window.confirm(
            'Are you sure you want to delete this grading template?',
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
        <h1 className="text-xl font-bold">Grading Template</h1>
        <div className="flex items-center gap-4">
          <RefreshButton query={gradingTemplateQ} />
          <NewButton onClick={() => setFormModel({ open: true })} />
        </div>
      </div>
      <ErrorAlert error={gradingTemplateQ.error} />
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
        <GradingTemplateDialog
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
