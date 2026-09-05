import {
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createPaginatedRowModel,
  createFilteredRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  metaHelper,
  tableFeatures,
  tableOptions,
  filterFn_inNumberRange,
  filterFn_includesString,
  columnFilteringFeature,
  globalFilteringFeature,
} from '@tanstack/react-table'
import type { ReactTable, RowData } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'

type MyColumnMeta = {
  align?: 'left' | 'center' | 'right'
}

type MyTableMeta = {
  onRowAction?: (actionType: 'edit' | 'delete' | 'view', rowId: string) => void
}

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(), // if using client-side filtering
  // manualFiltering: true, // if using manual server-side filtering
  filterFns: {
    includesString: filterFn_includesString,
    inNumberRange: filterFn_inNumberRange,
  },

  columnMeta: metaHelper<MyColumnMeta>(),
  tableMeta: metaHelper<MyTableMeta>(),
})

export type TTableFeatures = typeof features

export function baseTableOptions<TData extends RowData>() {
  return tableOptions<typeof features, TData>({
    features,
    // columnResizeMode: 'onChange',
    columnResizeMode: 'onEnd',
    defaultColumn: {
      size: 200, // starting column size
      minSize: 50, // enforced during column resizing
      maxSize: 600, // enforced during column resizing
    },
    globalFilterFn: 'includesString',
    // renderFallbackValue: <span>---</span>,
  })
}

export function AppTable<TData extends RowData>({
  table,
  className,
  rounded = true,
}: {
  table: ReactTable<typeof features, TData>
  className?: string
  rounded?: boolean
}) {
  return (
    <div
      className={cn(
        'min-w-0 w-full overflow-hidden border',
        rounded && 'rounded-md',
        className,
      )}
    >
      <Table
        className="border-separate border-spacing-0"
        maxHeight={400}
        style={{ tableLayout: 'fixed', width: table.getCenterTotalSize() }}
      >
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="top-0 z-10 sticky">
              {group.headers.map((header) => {
                const isSorted = header.column.getIsSorted()
                const canSort = header.column.getCanSort()

                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'font-medium text-sm text-neutral-800 bg-muted/70 backdrop-blur-lg top-0 relative min-w-0 overflow-visible border-b first:border-l-0 border-l border-r last:border-r-0',
                    )}
                    style={{
                      width: header.getSize(),
                      textAlign: header.column.columnDef.meta?.align,
                      // Each th is a stacking context (position + backdrop-blur).
                      // A child z-index cannot paint over the next header, so
                      // earlier columns must sit above later ones or the
                      // -right-2 handle goes behind the neighboring header.
                      zIndex: header.column.getIsResizing()
                        ? 30
                        : group.headers.length - header.index,
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <>
                        {canSort ? (
                          <button
                            className="font-medium hover:font-bold hover:text-primary flex w-full min-w-0 items-center overflow-hidden py-1"
                            style={{
                              justifyContent:
                                header.column.columnDef.meta?.align === 'center'
                                  ? 'center'
                                  : header.column.columnDef.meta?.align ===
                                      'right'
                                    ? 'flex-end'
                                    : 'flex-start',
                            }}
                            title={
                              isSorted === false
                                ? 'Sort Descending'
                                : isSorted === 'asc'
                                  ? 'Sort Ascending'
                                  : 'UnSort It'
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="block min-w-0 truncate">
                              <table.FlexRender header={header} />
                            </span>
                            {isSorted === false ? (
                              <ArrowUpDownIcon className="ml-2 shrink-0 h-4 w-4 text-muted-foreground/60" />
                            ) : isSorted === 'asc' ? (
                              <ArrowUpIcon className="ml-2 shrink-0 h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="ml-2 shrink-0 h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="block min-w-0 truncate">
                            <table.FlexRender header={header} />
                          </span>
                        )}
                      </>
                    )}

                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => {
                          header.column.resetSize()
                        }}
                        className={cn(
                          // -right-2 straddles the column border for a better hit target, but
                          // on the last column it sticks past the table and creates a tiny x-scrollbar.
                          'absolute select-none top-0 bottom-0 z-20 w-2 cursor-col-resize hover:bg-primary',
                          header.index === group.headers.length - 1
                            ? 'right-0'
                            : '-right-1',
                          header.column.getIsResizing() && 'z-30 bg-primary',
                        )}
                        style={{
                          transform: header.column.getIsResizing()
                            ? `translateX(${
                                table.state.columnResizing.deltaOffset ?? 0
                              }px)`
                            : undefined,
                        }}
                      />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className=" pl-6 min-h-25 py-8 text-muted-foreground text-center"
              >
                No data available
              </TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={''}
              data-state={row.getIsSelected() && 'selected'}
            >
              {row.getVisibleCells().map((cell) => {
                const value = cell.getValue()
                const isEmpty = value === ''

                return (
                  <TableCell
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(),
                      textAlign: cell.column.columnDef.meta?.align,
                    }}
                    className={cn(
                      'align-middle relative truncate',
                      cell.column.getIsResizing() &&
                        'z-20 overflow-visible border-r border-dotted border-ring/60',
                    )}
                  >
                    {<table.FlexRender cell={cell} />}
                    {isEmpty && (
                      <span className="text-muted-foreground pl-1 text-sm">
                        ---
                      </span>
                    )}
                    {cell.column.getIsResizing() && (
                      <div
                        style={{
                          transform: `translateX(${
                            table.state.columnResizing.deltaOffset ?? 0
                          }px)`,
                        }}
                        className="absolute -right-1 select-none top-0 bottom-0 z-20 border-2 border-dotted w-1 cursor-col-resize h-full border-primary/60"
                      ></div>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
