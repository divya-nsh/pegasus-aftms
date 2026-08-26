import { RefreshCwIcon } from 'lucide-react'

import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

export default function RefreshButton({
  onClick,
  className,
  disabled,
  isPending,
}: {
  onClick: () => void
  className?: string
  isPending?: boolean
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      title="Refresh Table"
      className={cn(' shadow-none', className)}
      disabled={disabled || isPending}
    >
      <RefreshCwIcon className={cn('h-4 w-4', isPending && 'animate-spin')} />
    </Button>
  )
}
