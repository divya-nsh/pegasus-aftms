import FullPageSpinner from '@/components/loaders/page-loader'
import { trpc } from '@/trpc'
import type { TrpcRouterOutputs } from '@/trpc'
import { useQuery } from '@tanstack/react-query'
import { createContext, useCallback, useContext } from 'react'
import type { RoleModule, ModuleAction } from 'server/types/role'
import type { TPermissionKeys } from 'server/types/shared'

type AuthUser = TrpcRouterOutputs['users']['getMyProfile']

export type AuthContextType = {
  user?: AuthUser | null
  /** profile means the first personnel in the user's personnel array */
  profile?: AuthUser['personnel'][number]
  // Alias of profile
  linkedPersonnel?: AuthUser['personnel'][number]
  isAuthenticated: boolean
  refetch: () => void
  isUserCan: (permissionKey: TPermissionKeys) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: user,
    refetch,
    isPending,
  } = useQuery(trpc.users.getMyProfile.queryOptions())

  const isUserCan = useCallback(
    (permissionKey: TPermissionKeys) => {
      return user?.role?.permissions.includes(permissionKey) ?? false
    },
    [user],
  )

  if (isPending)
    return (
      <div className="flex min-h-svh items-center justify-center">
        <FullPageSpinner />
      </div>
    )

  const profile = user?.personnel[0]

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        refetch,
        isAuthenticated: !!user,
        isUserCan,
        linkedPersonnel: profile,
      }}
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

export const AccessControl = ({
  children,
  permissionKey,
  fallback = null,
}: {
  children: React.ReactNode
  permissionKey: TPermissionKeys
  fallback?: React.ReactNode
}) => {
  const { isUserCan } = useAuth()

  return isUserCan(permissionKey) ? children : fallback
}
