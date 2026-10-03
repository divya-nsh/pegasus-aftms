/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { formatDate } from '@/lib/date'
import { makeFullName } from '@/lib/utils'
import trpc from '@/trpc'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({ component: Home })

const today = new Date()

function Home() {
  const [enable, setEnable] = useState(false)
  const queryClient = useQueryClient()
  const { isPending } = useQuery({
    ...trpc.rolesV2.getPermissions.queryOptions(),
  })
  const { user, profile } = useAuth()

  const displayName =
    (profile ? makeFullName(profile) : null) || user!.name || user!.username

  const resetPermissions = () => {
    queryClient.resetQueries(trpc.rolesV2.getPermissions.queryOptions())
  }

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
      <div className="py-6 space-y-6">
        {isPending && enable && <p className="text-xl">Pending......</p>}
        <Button
          onClick={() => {
            setEnable((prev) => !prev)
            resetPermissions()
          }}
        >
          Fetch Permissions
        </Button>
      </div>
    </div>
  )
}
