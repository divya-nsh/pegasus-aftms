import FullPageSpinner from '@/components/loaders/page-loader'
import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/react-query'
import { createContext, useContext } from 'react'

type AuthUser = {
  id: number
  username: string
  name: string | null
  role: 'admin' | 'instructor' | 'trainee' | null
  personnel: {
    imageId: number | null
    code: string | null
    personnelType: 'instructor' | 'pilot' | 'trainee'
  }[]
}

export type AuthContextType = {
  user?: AuthUser | null
  isAuthenticated: boolean
  refetch: () => void
}
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: user,
    refetch,
    isPending,
  } = useQuery(trpc.users.getMyProfile.queryOptions())

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isPending)
    return (
      <div className="flex min-h-svh items-center justify-center">
        <FullPageSpinner />
      </div>
    )

  return (
    <AuthContext.Provider value={{ user, refetch, isAuthenticated: !!user }}>
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
