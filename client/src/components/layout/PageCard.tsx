import { cn } from '@/lib/utils'

export default function PageCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'shadow-none px-4 py-4 lg:px-6 rounded-sm min-h-full max-w-6xl mx-auto0',
        className,
      )}
    >
      {children}
    </div>
  )
}
