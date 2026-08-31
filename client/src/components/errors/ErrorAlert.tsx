import { cn } from '@/lib/utils'
import { TRPCClientError } from '@trpc/client'
import { CircleAlertIcon } from 'lucide-react'

type ErrorAlertProps = {
  error: unknown
  className?: string
  title?: string
}

type FlattenedZodError = {
  formErrors?: string[]
  fieldErrors?: Record<string, string[] | undefined>
}

function getZodMessages(zodError: FlattenedZodError | undefined): string[] {
  if (!zodError) return []

  const messages: string[] = [...(zodError.formErrors ?? [])]

  for (const [field, fieldMessages] of Object.entries(
    zodError.fieldErrors ?? {},
  )) {
    for (const message of fieldMessages ?? []) {
      messages.push(`${field}: ${message}`)
    }
  }

  return messages
}

function getZodIssueMessages(message: string): string[] {
  try {
    const parsed: unknown = JSON.parse(message)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((issue) => {
      if (
        typeof issue !== 'object' ||
        issue === null ||
        typeof (issue as { message?: unknown }).message !== 'string'
      ) {
        return []
      }

      const path = (issue as { path?: unknown }).path
      const label = Array.isArray(path) ? path.filter(Boolean).join('.') : ''
      const issueMessage = (issue as { message: string }).message

      return [label ? `${label}: ${issueMessage}` : issueMessage]
    })
  } catch {
    return []
  }
}

export function getErrorMessages(error: unknown): string[] {
  if (error == null || error === false) return []
  if (typeof error === 'string') return error ? [error] : []

  if (error instanceof TRPCClientError) {
    const data = error.data as { zodError?: FlattenedZodError } | undefined
    const fromZod = getZodMessages(data?.zodError)
    if (fromZod.length > 0) return fromZod

    const fromIssues = getZodIssueMessages(error.message)
    if (fromIssues.length > 0) return fromIssues

    if (error.message) return [error.message]
  }

  if (error instanceof Error && error.message) {
    return [error.message]
  }

  return ['Something went wrong']
}

export default function ErrorAlert({
  error,
  className,
  title,
}: ErrorAlertProps) {
  const messages = getErrorMessages(error)
  if (messages.length === 0) return null

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-4 text-sm text-destructive',
        className,
      )}
    >
      <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        {messages.length === 1 ? (
          <p>{messages[0]}</p>
        ) : (
          <ul className="list-disc space-y-0.5 pl-4">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
