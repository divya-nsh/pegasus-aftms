import { Spinner } from '../ui/spinner'
import { cn } from '@/lib/utils'

export default function FullPageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center h-full', className)}>
      <Spinner className="size-10" />
    </div>
  )
}
