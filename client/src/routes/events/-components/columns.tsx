import { createTableActionHandler } from '@/components/table/table.tsx'
import type { TTableFeatures } from '@/components/table/table.tsx'
import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarIcon } from 'lucide-react'
import type { TrpcRouterOutputs } from 'server/router'
import { getMissionType } from '@repo/shared'
import { ActionMenu } from '@/components/table/action-menu'
import { linkOptions } from '@tanstack/react-router'

type TMissionListItem = TrpcRouterOutputs['missions']['getAll']['items'][number]

const ch = createColumnHelper<TTableFeatures, TMissionListItem>()

const columns: ColumnDef<TTableFeatures, TMissionListItem>[] = ch.columns([
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
              permissionKey: ({ isUserCan }) => !isUserCan('event.update'),
            },
            {
              label: 'Shedule it',
              icon: <CalendarIcon className="h-4 w-4" />,
              redirectTo: linkOptions({
                to: '/schedules/create',
                search: {
                  missionId: info.row.original.id,
                },
              }),
            },
            {
              type: 'edit',
              onClick: handleAction('edit'),
              permissionKey: 'event.update',
            },
            { type: 'separator' },
            {
              type: 'delete',
              onClick: handleAction('delete'),
              permissionKey: 'event.delete',
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
    size: 300,
  }),
  ch.accessor('missionType', {
    header: 'Type',
    size: 140,
    cell: (info) => getMissionType(info.getValue())?.name ?? info.getValue(),
  }),
  ch.accessor('durationMinutes', {
    header: 'Duration Hours',
    size: 120,
    cell: (info) => {
      const hours = info.getValue() / 60

      return `${hours} hr`
    },
  }),
  // ch.accessor('aircraftName', {
  //   header: 'Aircraft',
  //   cell: (info) => {
  //     const row = info.row.original
  //     if (!row.aircraftName) return '-'
  //     return row.aircraftTailNumber
  //       ? `${row.aircraftName} (${row.aircraftTailNumber})`
  //       : row.aircraftName
  //   },
  // }),
  ch.accessor('description', {
    header: 'Description',
  }),
])

export default columns
