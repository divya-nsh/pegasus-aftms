import * as React from 'react'

import { cn } from '@/lib/utils'

type CellVerticalAlign = 'top' | 'middle' | 'bottom'

type TableStyleConfig = {
  fullGridLine: boolean
  cellVerticalAlign: CellVerticalAlign
}

const tableContext = React.createContext<TableStyleConfig>({
  fullGridLine: false,
  cellVerticalAlign: 'middle',
})

function Table({
  className,
  maxHeight,
  fullGridLine = false,
  ...props
}: React.ComponentProps<'table'> & {
  maxHeight?: number
  fullGridLine?: boolean
}) {
  return (
    <tableContext.Provider
      value={{
        fullGridLine: fullGridLine || false,
        cellVerticalAlign: 'middle',
      }}
    >
      <div
        data-slot="table-container"
        className="relative w-full min-w-0 overflow-auto scroll-thin"
        style={{
          maxHeight,
        }}
      >
        <table
          data-slot="table"
          className={cn(
            'w-full caption-bottom text-sm border-collapse',
            className,
          )}
          {...props}
        />
      </div>
    </tableContext.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  const { fullGridLine } = React.useContext(tableContext)
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', fullGridLine && 'border', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  const { fullGridLine } = React.useContext(tableContext)
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0',
        fullGridLine && 'border',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  const { fullGridLine } = React.useContext(tableContext)
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2 px-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 border-b',
        fullGridLine && 'border',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
