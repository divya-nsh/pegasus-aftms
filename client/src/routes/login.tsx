import {
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import ErrorAlert from '@/components/errors/ErrorAlert'
import { trpcClient } from '@/trpc'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: z.object({
    redirectTo: z.string().default('/'),
  }),
})

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
})

type LoginFormData = z.infer<typeof schema>

function LoginPage() {
  const { redirectTo } = Route.useSearch()

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => trpcClient.auth.login.mutate(data),
    onSuccess: async () => {
      window.location.href = redirectTo
    },
  })

  const form = useAppForm({
    defaultValues: defaultFormData,
    validators: {
      onSubmit: schema,
    },
    onSubmit: ({ value }) => loginMutation.mutateAsync(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-200 p-4">
      <div className="w-full max-w-sm border space-y-5 bg-card rounded-lg p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">Pegasus AFTMS</p>
        </div>

        <ErrorAlert error={loginMutation.error} />

        <form.AppField
          name="username"
          children={(f) => (
            <f.CTextField required label="Username" autoComplete="username" />
          )}
        />
        <form.AppField
          name="password"
          children={(f) => (
            <f.CTextField
              required
              label="Password"
              type="password"
              autoComplete="current-password"
            />
          )}
        />

        <form.AppForm>
          <form.SubscribeButton label="Sign in" className="w-full" />
        </form.AppForm>
      </div>
    </div>
  )
}

const defaultFormData: LoginFormData = {
  username: 'admin',
  password: 'admin',
}
