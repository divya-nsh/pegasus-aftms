import { useAuth } from '@/context/auth-context'
import { formatDate } from '@/lib/date'
import { makeFullName } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

const today = new Date()

function Home() {
  const { user, profile } = useAuth()

  const displayName =
    (profile ? makeFullName(profile) : null) || user!.name || user!.username

  return (
    <div className="pt-6 px-6">
      <div className="space-y-2">
        <h2 className="text-lg text-muted-foreground">Hello, {displayName}</h2>
        <p className="text-lg font-bold tracking-tight sm:text-4xl">
          Welcome to the Flight Training Management System
        </p>
        <p className="pt-2 text-muted-foreground">
          Today:{' '}
          <span className="font-medium text-foreground ml-2">
            {formatDate(today, false, true)}
          </span>
        </p>
      </div>
    </div>
  )
}
