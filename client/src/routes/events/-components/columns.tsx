import type { TTableFeatures } from '@/components/table/table.tsx'
import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { PencilIcon, TrashIcon } from 'lucide-react'
import type { TrpcRouterOutputs } from 'server/router'
import { formatDate } from '@/lib/date'
import { getMissionType } from '@repo/shared'
import { ActionMenu } from '@/components/table/action-menu'

type TMissionListItem = TrpcRouterOutputs['missions']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TMissionListItem>()

const columns: ColumnDef<TTableFeatures, TMissionListItem>[] = ch.columns([
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
    size: 300,
  }),
  ch.accessor('missionType', {
    header: 'Type',
    size: 140,
    cell: (info) => getMissionType(info.getValue())?.name ?? info.getValue(),
  }),
  ch.accessor('durationMinutes', {
    header: 'Duration',
    size: 120,
    cell: (info) => `${info.getValue()} min`,
  }),
  ch.accessor('aircraftName', {
    header: 'Aircraft',
    cell: (info) => {
      const row = info.row.original
      if (!row.aircraftName) return '-'
      return row.aircraftTailNumber
        ? `${row.aircraftName} (${row.aircraftTailNumber})`
        : row.aircraftName
    },
  }),
  ch.accessor('description', {
    header: 'Description',
  }),
])

export default columns
