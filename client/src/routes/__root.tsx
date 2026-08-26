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
import FullPageSpinner from '@/components/loaders/page-loader'
import type { AuthContextType } from '@/context/auth-context'
import { Toaster as HotToaster } from 'react-hot-toast'

export type RouterContext = {
  queryClient: QueryClient
  auth?: AuthContextType | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context, location }) => {
    const isLoginRoute = location.pathname === '/login'
    const auth = context.auth

    if (!auth?.isAuthenticated && !isLoginRoute) {
      throw redirect({
        to: '/login',
        search: { redirectTo: location.pathname },
      })
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
      <HotToaster
        toastOptions={{
          style: {
            fontSize: '0.870rem',
          },
        }}
      />
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
