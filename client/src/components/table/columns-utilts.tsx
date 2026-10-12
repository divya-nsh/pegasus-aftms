import { formatDate } from '@/lib/date'
import type { ColumnDef } from '@tanstack/react-table'
import type { TTableFeatures } from './table'

export const metaColumns = <
  T extends {
    id: number
    createdById: number | null
    updatedById: number | null
    createdAt: string
    updatedAt: string
    createdBy?: { name: string | null; username: string | null } | null
    updatedBy?: { name: string | null; username: string | null } | null
  },
>(): ColumnDef<TTableFeatures, T>[] => {
  return [
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      cell: (info) => formatDate(info.getValue() as string, true),
    },
    {
      header: 'Created By',
      accessorKey: 'createdById',
      cell: (info) => {
        const row = info.row.original
        return (
          row.createdBy?.name ??
          row.createdBy?.username ??
          info.getValue() ??
          '-'
        )
      },
    },
    {
      header: 'Updated At',
      accessorKey: 'updatedAt',
      cell: (info) => formatDate(info.getValue() as string, true),
    },

    {
      header: 'Updated By',
      accessorKey: 'updatedById',
      cell: (info) => {
        const row = info.row.original
        return (
          row.updatedBy?.name ??
          row.updatedBy?.username ??
          info.getValue() ??
          '-'
        )
      },
    },
    {
      header: 'Row ID',
      accessorKey: 'id',
    },
  ]
}

export const metaHiddenColumns = {
  id: false,
  createdById: false,
  updatedById: false,
  createdAt: false,
  updatedAt: false,
}
