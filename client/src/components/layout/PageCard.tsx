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
        'shadow-xs rounded-xl bg-card border max-w-7xl mx-auto',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageCardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b px-4 md:px-6 py-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageCardContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('px-4 py-4 md:px-6', className)}>{children}</div>
}

export function ListTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold flex items-center gap-2">{children}</h2>
  )
}
