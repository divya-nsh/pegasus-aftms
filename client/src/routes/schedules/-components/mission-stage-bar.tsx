import { cn } from '@/lib/utils'

export const MISSION_STATUSES = [
  'draft',
  'published',
  'in_progress',
  'completed',
  'cancelled',
] as const

export type MissionStatus = (typeof MISSION_STATUSES)[number]

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  in_progress: 'Started',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_STYLES: Record<MissionStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-sky-600/10 text-sky-700 dark:text-sky-400',
  in_progress: 'bg-amber-500/15 text-amber-800 dark:text-amber-400',
  completed: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
}

export function isMissionStatus(value: string): value is MissionStatus {
  return (MISSION_STATUSES as readonly string[]).includes(value)
}

export default function MissionStatusBadge({
  status,
  size = 'sm',
}: {
  status: string
  size?: 'sm' | 'md'
}) {
  const style = isMissionStatus(status)
    ? STATUS_STYLES[status]
    : 'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-4 py-0.5 font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-4 py-1 text-xs',
        style,
      )}
    >
      {isMissionStatus(status) ? MISSION_STATUS_LABELS[status] : status}
    </span>
  )
}
