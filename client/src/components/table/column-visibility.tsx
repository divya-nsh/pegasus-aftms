import type { ReactTable, RowData } from '@tanstack/react-table'
import { Settings2Icon } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import type { TTableFeatures } from './table'

function camelToLabel(key: string): string {
  return (
    key
      // Insert space before uppercase letters
      .replace(/([A-Z])/g, ' $1')
      // Handle consecutive uppercase (e.g., "HTMLParser" → "HTML Parser")
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      // Capitalize first letter
      .replace(/^./, (c) => c.toUpperCase())
      .trim()
  )
}

export function ColumnVisibility<TData extends RowData>({
  table,
}: {
  table: ReactTable<TTableFeatures, TData>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="shadow-none text-sm" size="sm" />
        }
      >
        <Settings2Icon /> Views
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-max">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              if (column.id === 'actions') return null
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : camelToLabel(column.id)}
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
