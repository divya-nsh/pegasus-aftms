import { Link, useRouterState } from '@tanstack/react-router'
import {
  SidebarProvider,
  Sidebar,
  SidebarGroup,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
  SidebarSeparator,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/auth-context'
import { NavUser } from './nav-user'
import { traineeNavItems, navItems } from './siderbar-items'
import type { NavMenuItem } from './sidebar.types'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '../ui/collapsible'
import { ChevronRight } from 'lucide-react'
import type { FileRouteTypes } from '@/routeTree.gen'

function isNavActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`)
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 md:hidden shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <span className="text-sm font-semibold md:hidden">Pegasus AFTMS</span>
        </header>
        <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AppSidebar() {
  const { user } = useAuth()

  const isTrainee = user!.role?.id === 'trainee'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Pegasus AFTMS"
              className="pointer-events-none"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                P
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">
                  Pegasus AFTMS
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Flight training
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {(isTrainee ? traineeNavItems : navItems).map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <RenderSidebarMenuItem key={item.title} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function RenderSidebarMenuItem({ item }: { item: NavMenuItem }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isActive = isNavActive(pathname, item.url)

  if (!item.items) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={isActive}
          render={
            <Link to={item.url as FileRouteTypes['to']}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          }
        />
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible key={item.title} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton tooltip={item.title} isActive={isActive}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          }
        />
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  isActive={isNavActive(pathname, subItem.url)}
                  render={
                    <Link to={subItem.url as FileRouteTypes['to']}>
                      {subItem.title}
                    </Link>
                  }
                />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
