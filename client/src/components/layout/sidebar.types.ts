import type { FileRouteTypes } from '@/routeTree.gen'
import type { LucideIcon } from 'lucide-react'

export type NavItems = {
  title: string
  items: NavMenuItem[]
}

export type NavSubItem = {
  title: string
  url: FileRouteTypes['to'] | '#'
}

export type NavMenuItem = {
  title: string
  url: FileRouteTypes['to'] | '#'
  icon?: LucideIcon
  items?: Array<NavSubItem>
}
