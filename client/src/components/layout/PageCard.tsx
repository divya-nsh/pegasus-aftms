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
        'shadow-none px-4 py-4 pt-5 md:px-8 rounded-sm min-h-full max-w-6xl mx-auto pb-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
