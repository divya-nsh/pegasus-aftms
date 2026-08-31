// components/BlockingLoader.tsx
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export function BlockingLoaderOverlay({
  show,
  message = 'Processing...',
  variant = 'normal',
}: {
  show?: boolean
  message?: string
  variant?: 'destructive' | 'normal'
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (show && e.key === 'Escape') e.preventDefault()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [show])

  if (!show) return null

  return (
    <div
      inert={show}
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span
          className={cn(
            'text-sm font-medium text-card-foreground',
            variant === 'destructive' && 'text-destructive',
          )}
        >
          {message}
        </span>
      </div>
    </div>
  )
}
