import {
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import ErrorAlert from '@/components/errors/ErrorAlert'
import { trpcClient } from '@/trpc'
import { revalidateLogic } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Plane, ShieldCheck } from 'lucide-react'
import { z } from 'zod'
import { APP_PRODUCT_CODE, APP_VERSION, RELEASE_DATE } from '@/config/constants'

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
      // Trick to keep mutation in pending state until the page is redirected
      return new Promise(() => {})
    },
  })

  const form = useAppForm({
    defaultValues: defaultFormData,
    validationLogic: revalidateLogic(),
    validators: {
      onSubmit: schema,
      onDynamic: schema,
    },
    onSubmit: ({ value }) => loginMutation.mutateAsync(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Gradient glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 size-[28rem] rounded-full bg-sky-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-32 size-[26rem] rounded-full bg-indigo-500/30 blur-3xl" />
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Plane className="size-5 -rotate-45" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Pegasus</span>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            Pegasus
            <br />
            <span className="bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Flight Training Management
            </span>
          </h2>
          <p className="max-w-md text-base text-slate-300">
            Sign in with your assigned credentials to continue.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="size-4" />
          Secure, authorised access only
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-white p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Plane className="size-5 -rotate-45" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Pegasus
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to Pegasus Flight Training Management.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-5"
          >
            <ErrorAlert error={loginMutation.error} />

            <form.AppField
              name="username"
              children={(f) => (
                <f.CTextField
                  required
                  label="Username"
                  autoComplete="username"
                  placeholder="Your UserId or Email"
                  autoFocus
                />
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
              <form.SubscribeButton
                label="Sign in"
                className="h-11 w-full"
                noSubmit
              />
            </form.AppForm>
          </form>

          <div className="space-y-3">
            <p className="text-center text-xs text-muted-foreground">
              Having trouble signing in? Contact your administrator.
            </p>

            {/* Version info */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t pt-3 text-[11px] text-muted-foreground">
              <span>V{APP_VERSION}</span>
              <span aria-hidden="true">•</span>
              <span>Release Date: {RELEASE_DATE}</span>
              <span aria-hidden="true">•</span>
              <span>Code: {APP_PRODUCT_CODE}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const defaultFormData: LoginFormData = {
  username: '',
  password: '',
}
