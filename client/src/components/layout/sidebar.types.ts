import type { FileRouteTypes } from '@/routeTree.gen'
import type { LucideIcon } from 'lucide-react'

export type NavItems = {
  title: string
  items: NavMenuItem[]
}

export type NavSubItem = {
  title: string
  url: FileRouteTypes['to'] | '#'
  matchUrlMode?: 'exact' | 'prefix'
}

export type NavMenuItem = {
  title: string
  url: FileRouteTypes['to'] | '#'
  icon?: LucideIcon
  items?: Array<NavSubItem>
  matchUrlMode?: 'exact' | 'prefix'
}
