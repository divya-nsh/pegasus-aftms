import type { ReactTable, RowData } from '@tanstack/react-table'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { TTableFeatures } from './table'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50, 100]

export function TablePagination<TData extends RowData>({
  table,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: {
  table: ReactTable<TTableFeatures, TData>
  pageSizeOptions?: number[]
  className?: string
}) {
  return (
    <table.Subscribe source={table.atoms.pagination}>
      {(pagination) => {
        const { pageIndex, pageSize } = pagination
        const pageCount = table.getPageCount()
        const rowCount = table.getRowCount()
        const from = rowCount === 0 ? 0 : pageIndex * pageSize + 1
        const to = Math.min(rowCount, (pageIndex + 1) * pageSize)
        const canPreviousPage = table.getCanPreviousPage()
        const canNextPage = table.getCanNextPage()
        const canLastPage = table.getCanLastPage()

        return (
          <div
            className={cn(
              'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1',
              className,
            )}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <label htmlFor="rowPerPage">Rows per page: </label>
              <Select
                id={'rowPerPage'}
                value={String(pageSize)}
                onValueChange={(value) => {
                  if (value != null) table.setPageSize(Number(value))
                }}
                items={pageSizeOptions.map((size) => ({
                  label: String(size),
                  value: String(size),
                }))}
              >
                <SelectTrigger size="sm" className="w-20 py-1 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground tabular-nums">
                {rowCount === 0
                  ? '0 of 0'
                  : `${from}–${to} of ${rowCount.toLocaleString()}`}
                {pageCount > 0 && (
                  <span className="ml-2">
                    · Page {pageIndex + 1} of {pageCount.toLocaleString()}
                  </span>
                )}
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="First page"
                  disabled={!canPreviousPage}
                  onClick={() => table.firstPage()}
                >
                  <ChevronsLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Previous page"
                  disabled={!canPreviousPage}
                  onClick={() => table.previousPage()}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Next page"
                  disabled={!canNextPage}
                  onClick={() => table.nextPage()}
                >
                  <ChevronRightIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Last page"
                  disabled={!canLastPage}
                  onClick={() => table.lastPage()}
                >
                  <ChevronsRightIcon />
                </Button>
              </div>
            </div>
          </div>
        )
      }}
    </table.Subscribe>
  )
}
