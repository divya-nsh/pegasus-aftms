import { cn } from '@/lib/utils'
import { Field, FieldLabel } from '@/components/ui/field'

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
  published: 'Scheduled',
  in_progress: 'In Progress',
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

const SELECTED_STYLES: Record<MissionStatus, string> = {
  draft: 'bg-muted text-foreground shadow-sm',
  published: 'bg-sky-600 text-white shadow-sm',
  in_progress: 'bg-amber-500 text-white shadow-sm',
  completed: 'bg-emerald-600 text-white shadow-sm',
  cancelled: 'bg-destructive text-white shadow-sm',
}

export function isMissionStatus(value: string): value is MissionStatus {
  return (MISSION_STATUSES as readonly string[]).includes(value)
}

export default function MissionStatusBadge({ status }: { status: string }) {
  const style = isMissionStatus(status)
    ? STATUS_STYLES[status]
    : 'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style,
      )}
    >
      {isMissionStatus(status) ? MISSION_STATUS_LABELS[status] : status}
    </span>
  )
}

export function MissionStatusPicker({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled?: boolean
  onChange: (status: MissionStatus) => void
}) {
  return (
    <Field className="gap-2">
      <FieldLabel>Status</FieldLabel>
      <div
        role="radiogroup"
        aria-label="Schedule status"
        className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
      >
        {MISSION_STATUSES.map((status) => {
          const selected = value === status
          return (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => {
                if (!selected) onChange(status)
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                selected
                  ? SELECTED_STYLES[status]
                  : 'text-muted-foreground hover:bg-background hover:text-foreground',
              )}
            >
              {MISSION_STATUS_LABELS[status]}
            </button>
          )
        })}
      </div>
    </Field>
  )
}
