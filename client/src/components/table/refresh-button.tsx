import { RefreshCwIcon } from 'lucide-react'

import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

export default function RefreshButton({
  onClick,
  className,
  disabled,
  isPending,
  query,
}: {
  onClick?: () => void
  className?: string
  isPending?: boolean
  disabled?: boolean
  query?: {
    refetch: () => void
    isPending: boolean
  }
}) {
  const _isPending = isPending || query?.isPending
  const _onClick = onClick || query?.refetch

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={_onClick}
      title="Refresh Table"
      className={cn(' shadow-none', className)}
      disabled={disabled || _isPending}
    >
      <RefreshCwIcon className={cn('h-4 w-4', _isPending && 'animate-spin')} />
    </Button>
  )
}
