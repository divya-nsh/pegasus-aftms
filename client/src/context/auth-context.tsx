import FullPageSpinner from '@/components/loaders/page-loader'
import { trpc } from '@/trpc'
import type { TrpcRouterOutputs } from '@/trpc'
import { useQuery } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { isPermitted } from '@/lib/permission'
import type { PermissionRequirement } from '@/lib/permission'
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

  const permissionsSet = useMemo(() => {
    // For better performance, we use a set to check if a permission is in the user's permissions
    return new Set(user?.role?.permissions ?? [])
  }, [user])

  const isUserCan = useCallback(
    (permissionKey: TPermissionKeys) => {
      if (permissionsSet.has('*')) return true
      return permissionsSet.has(permissionKey)
    },
    [permissionsSet],
  )

  const profile = user?.personnel[0]

  const value = useMemo(
    (): AuthContextType => ({
      user,
      profile,
      refetch,
      isAuthenticated: !!user,
      isUserCan,
      linkedPersonnel: profile,
    }),
    [user, profile, refetch, isUserCan],
  )

  if (isPending)
    return (
      <div className="flex min-h-svh items-center justify-center">
        <FullPageSpinner />
      </div>
    )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const useUserCan = (permissionKey: TPermissionKeys) => {
  const { isUserCan } = useAuth()
  return isUserCan(permissionKey)
}

export const AccessControl = ({
  children,
  permissionKey,
  fallback = null,
}: {
  children: React.ReactNode
  permissionKey: PermissionRequirement
  fallback?: React.ReactNode
}) => {
  const auth = useAuth()

  return isPermitted(auth, permissionKey) ? children : fallback
}
