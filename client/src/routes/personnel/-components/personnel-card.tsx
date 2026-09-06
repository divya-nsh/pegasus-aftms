import { ActionMenu } from '@/components/table/action-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getMediaUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { PencilIcon, TrashIcon } from 'lucide-react'
import type { TrpcRouterOutputs } from 'server/router'
import { getMedicalDisplayStatus } from './personnel-form'
import { getPilotQualification } from '@repo/shared'

type PersonnelCardPerson =
  TrpcRouterOutputs['personnel']['getAll']['items'][number]

function initialsFor(firstName: string, lastName?: string | null) {
  const first = firstName.trim().charAt(0)
  const last = lastName?.trim().charAt(0) ?? ''
  return (first + last).toUpperCase() || '?'
}

function typeLabel(type: string) {
  if (!type) return '—'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function medicalBadgeClass(label: string) {
  if (label === 'Fit') {
    return 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
  }
  if (label === 'Unfit' || label === 'Medical Expired') {
    return 'bg-destructive/10 text-destructive'
  }
  return 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
}

export function PersonnelCard({
  person,
  onEdit,
  onDelete,
}: {
  person: PersonnelCardPerson
  onEdit: () => void
  onDelete: () => void
}) {
  const fullName =
    [person.firstName, person.lastName].filter(Boolean).join(' ') || '—'
  const medical = getMedicalDisplayStatus({
    medicalStatus: person.medicalStatus,
    medicalValidUntil: person.medicalValidUntil,
  })

  return (
    <div className="relative flex flex-col items-center rounded-lg border bg-card p-4 pt-5 text-center shadow-none transition-shadow hover:shadow-sm">
      <div className="absolute top-1.5 right-1.5">
        <ActionMenu
          actions={[
            {
              label: 'Edit',
              icon: <PencilIcon className="h-4 w-4" />,
              onClick: onEdit,
            },
            {
              label: 'Delete',
              isDestructive: true,
              icon: <TrashIcon className="h-4 w-4" />,
              onClick: onDelete,
            },
          ]}
        />
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full min-w-0 flex-col items-center outline-none"
      >
        <Avatar className="size-20 after:rounded-full" size="lg">
          {person.imageId ? (
            <AvatarImage src={getMediaUrl(person.imageId)} alt={fullName} />
          ) : null}
          <AvatarFallback className="text-base font-medium">
            {initialsFor(person.firstName, person.lastName)}
          </AvatarFallback>
        </Avatar>
        <h2 className="mt-3 w-full truncate text-sm font-semibold leading-tight">
          {fullName}
        </h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {person.code || '—'}
        </p>
        {person.qualification ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {getPilotQualification(person.qualification)?.name ??
              person.qualification}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
            {typeLabel(person.personnelType)}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              medicalBadgeClass(medical),
            )}
          >
            {medical}
          </span>
        </div>
      </button>
    </div>
  )
}
