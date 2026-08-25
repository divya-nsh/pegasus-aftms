import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router'
// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
// import { TanStackDevtools } from '@tanstack/react-devtools'
import '../styles.css'
import Layout from '@/components/layout/RootLayout.tsx'
import { Toaster } from '@/components/ui/toast'
import type { QueryClient } from '@tanstack/react-query'
import { trpc } from '@/trpc'
import FullPageSpinner from '@/components/loaders/page-loader'
import type { AuthContextType } from '@/context/auth-context'

export type RouterContext = {
  queryClient: QueryClient
  auth?: AuthContextType | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context, location }) => {
    const isLoginRoute = location.pathname === '/login'
    const auth = context.auth

    if (!auth?.isAuthenticated && !isLoginRoute) {
      throw redirect({ to: '/login' })
    }

    if (auth?.isAuthenticated && isLoginRoute) {
      throw redirect({ to: '/' })
    }
    return { auth }
  },
  pendingComponent: () => (
    <div className="flex min-h-svh items-center justify-center">
      <FullPageSpinner />
    </div>
  ),
  component: RootComponent,
})

function RootComponent() {
  const { auth } = Route.useRouteContext()

  if (!auth?.isAuthenticated) {
    return <Outlet />
  }

  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      <Toaster />
      {/* 
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      /> */}
    </>
  )
}
