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
        'shadow-none px-4 py-6 lg:px-8 rounded-sm min-h-full max-w-6xl mx-auto',
        className,
      )}
    >
      {children}
    </div>
  )
}
