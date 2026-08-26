import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import TextField from '@/components/inputs/TextField'
import { Button } from '@/components/ui/button'
import ErrorAlert from '@/components/errors/ErrorAlert'
import { trpcClient } from '@/trpc'
import { z } from 'zod'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: z.object({
    redirectTo: z.string().default('/'),
  }),
})

function LoginPage() {
  const { redirectTo } = Route.useSearch()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')

  const loginMutation = useMutation({
    mutationFn: () => trpcClient.auth.login.mutate({ username, password }),
    onSuccess: async () => {
      window.location.href = redirectTo
    },
  })

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-200 p-4">
      <form
        className="w-full max-w-sm border space-y-5 bg-card rounded-lg p-6 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          loginMutation.mutate()
        }}
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">Pegasus AFTMS</p>
        </div>

        <ErrorAlert error={loginMutation.error} />

        <TextField
          label="Username"
          autoComplete="username"
          value={username}
          onValueChange={setUsername}
          required
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onValueChange={setPassword}
          required
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
