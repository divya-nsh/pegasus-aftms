import type { AuthContextType } from '@/context/auth-context'
import type { TPermissionKeys } from 'server/types/shared'

/** A permission key, or a predicate that receives the full auth context. */
export type PermissionRequirement =
  | TPermissionKeys
  | ((auth: AuthContextType) => boolean)

export function isPermitted(
  auth: AuthContextType,
  permission: PermissionRequirement,
) {
  if (typeof permission === 'function') return permission(auth)
  return auth.isUserCan(permission)
}
