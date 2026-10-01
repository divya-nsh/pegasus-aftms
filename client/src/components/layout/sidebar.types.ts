import type { FileRouteTypes } from '@/routeTree.gen'
import type { LucideIcon } from 'lucide-react'
import type { PermissionRequirement } from '@/lib/permission'

export type NavNode = {
  title: string
  url?: FileRouteTypes['to'] | '#'
  icon?: LucideIcon
  children?: NavNode[]
  matchUrlMode?: 'exact' | 'prefix'
  permissionKey?: PermissionRequirement
}
