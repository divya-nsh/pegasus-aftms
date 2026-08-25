import { ArrowLeftIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import LinkButton from '../ui/link-button'

function PageHeader({
  title,
  backTo,
  extra,
}: {
  title: string
  backTo?: ComponentProps<typeof Link>['to']
  extra?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 mb-6 border-b pb-1">
      {backTo ? (
        <LinkButton to={backTo} variant="ghost" size="icon" aria-label="Go back">
          <ArrowLeftIcon />
        </LinkButton>
      ) : null}
      <h1 className="text-xl font-bold min-w-0 truncate">{title}</h1>
      {extra ? <div className="ml-auto shrink-0">{extra}</div> : null}
    </div>
  )
}

export default PageHeader
