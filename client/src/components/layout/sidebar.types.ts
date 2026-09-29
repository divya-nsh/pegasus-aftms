import type { FileRouteTypes } from '@/routeTree.gen'
import type { LucideIcon } from 'lucide-react'
import type { TPermissionKeys } from 'server/types/shared'

export type NavNode = {
  title: string
  url?: FileRouteTypes['to'] | '#'
  icon?: LucideIcon
  children?: NavNode[]
  matchUrlMode?: 'exact' | 'prefix'
  permissionKey?: TPermissionKeys
}
