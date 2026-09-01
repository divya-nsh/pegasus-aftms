import FullPageSpinner from '@/components/loaders/page-loader'
import { trpc } from '@/trpc'
import type { TrpcRouterOutputs } from '@/trpc'
import { useQuery } from '@tanstack/react-query'
import { createContext, useCallback, useContext } from 'react'
import type { RoleModule, ModuleAction } from 'server/types/role'

type AuthUser = TrpcRouterOutputs['users']['getMyProfile']

export type AuthContextType = {
  user?: AuthUser | null
  profile?: AuthUser['personnel'][number]
  isAuthenticated: boolean
  refetch: () => void
  isUserCan: (module: RoleModule, action: ModuleAction) => boolean
}
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: user,
    refetch,
    isPending,
  } = useQuery(trpc.users.getMyProfile.queryOptions())

  const isUserCan = useCallback(
    (module: RoleModule, action: ModuleAction) => {
      if (user?.role?.isAdmin) return true
      return (
        user?.role?.permissions.some(
          (permission) =>
            permission.module === module && permission.actions.includes(action),
        ) ?? false
      )
    },
    [user],
  )

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isPending)
    return (
      <div className="flex min-h-svh items-center justify-center">
        <FullPageSpinner />
      </div>
    )

  const profile = user?.personnel[0]

  return (
    <AuthContext.Provider
      value={{ user, profile, refetch, isAuthenticated: !!user, isUserCan }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const PermissionController = ({
  children,
  module,
  action,
  fallback = null,
}: {
  children: React.ReactNode
  module: RoleModule
  action: ModuleAction
  fallback?: React.ReactNode
}) => {
  const { isUserCan } = useAuth()

  return isUserCan(module, action) ? children : fallback
}
