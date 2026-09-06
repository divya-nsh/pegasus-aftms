import ErrorAlert from '@/components/errors/ErrorAlert'
import { SearchInput } from '@/components/inputs/searchInput'
import { ColumnVisibility } from '@/components/table/column-visibility'
import { TablePagination } from '@/components/table/table-pagination'
import { AppTable, baseTableOptions } from '@/components/table/table.tsx'
import { createFileRoute } from '@tanstack/react-router'
import { useTable } from '@tanstack/react-table'
import { useState } from 'react'
import MissionForm from './-components/mission-form'
import type { MissionFormData } from './-components/mission-form'
import trpc, { trpcClient } from '@/trpc'
import {
  useQueryClient,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { TrpcRouterOutputs } from 'server/router'
import FullPageSpinner from '@/components/loaders/page-loader'
import { toast } from '@/components/ui/toast'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import PageCard from '@/components/layout/PageCard'
import NewButton from '@/components/buttons/new-button'
import columns from './-components/columns'

export const Route = createFileRoute('/events/')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Events" />
  ),
})

type TMissionListItem = TrpcRouterOutputs['missions']['getAll']['items'][number]

function RouteComponent() {
  const missionsQ = useSuspenseQuery(trpc.missions.getAll.queryOptions())
  const queryClient = useQueryClient()

  const [formModel, setFormModel] = useState<{
    data?: MissionFormData
    open: boolean
    editItemId?: number
  } | null>({
    open: false,
  })

  const [columnFilters, setColumnFilters] = useState<string>('')

  const deleteMutation = useMutation({
    mutationFn: ({ toDeleteId }: { toDeleteId: number }) => {
      return trpcClient.missions.delete.mutate({ toDeleteId })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.missions.pathFilter())
      toast.add({
        type: 'success',
        title: 'Event deleted successfully',
      })
    },
    onError: (error) => {
      toast.add({
        type: 'Error',
        title: 'Failed to delete event',
        description: error.message,
      })
    },
  })

  const table = useTable({
    ...baseTableOptions<TMissionListItem>(),
    data: missionsQ.data.items,
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
              description: row.description ?? '',
              aircraftId: row.aircraftId ? Number(row.aircraftId) : null,
              durationMinutes: row.durationMinutes
                ? Number(row.durationMinutes)
                : null,
              missionType: row.missionType,
            },
          })
        } else if (action === 'delete') {
          const confirm = window.confirm(
            'Are you sure you want to delete this event?',
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
      <div className="items-center gap-1 mt-1 border-b mb-4 pb-2 flex justify-between">
        <div>
          <h2 className="text-xl font-bold">Events</h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Events are here precreated list of mission, event or activity which
            will be used while creating event shedule
          </p>
        </div>
        <NewButton onClick={() => setFormModel({ open: true })} />
      </div>
      <ErrorAlert error={missionsQ.error} />
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
      <AppTable table={table} className="mt-4" />
      <TablePagination table={table} />

      {formModel?.open && (
        <MissionForm
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
