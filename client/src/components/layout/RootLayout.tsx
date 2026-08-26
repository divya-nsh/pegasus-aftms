import { Link, useRouterState } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/trpc'
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
} from '@/components/ui/sidebar'
import {
  CalendarClockIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  MapPinIcon,
  MapPinnedIcon,
  PlaneIcon,
  TargetIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FileRouteTypes } from '@/routeTree.gen'
import { useAuth } from '@/context/auth-context'
import { NavUser } from './nav-user'

type NavGroup = {
  title: string
  items: NavItem[]
}

type NavItem = {
  title: string
  url: FileRouteTypes['to']
  icon: LucideIcon
}

const navItems: NavGroup[] = [
  {
    title: 'Operations',
    items: [
      {
        title: 'Mission Schedules',
        url: '/schedules',
        icon: CalendarClockIcon,
      },
      {
        title: 'Trainee Dashboard',
        url: '/trainee-dashboard',
        icon: GraduationCapIcon,
      },
      {
        title: 'Instructor Dashboard',
        url: '/instructor-dashboard',
        icon: ShieldCheckIcon,
      },
    ],
  },
  {
    title: 'Masters',
    items: [
      { title: 'Personnel', url: '/personnel', icon: UsersIcon },
      { title: 'Missions', url: '/missions', icon: TargetIcon },
      { title: 'Aircraft', url: '/aircraft', icon: PlaneIcon },
      { title: 'Area', url: '/area', icon: MapPinnedIcon },
      { title: 'Users', url: '/users', icon: UserIcon },
      { title: 'Location', url: '/locations', icon: MapPinIcon },
    ],
  },
  // {
  //   title: 'Future Modules',
  //   items: [
  //     { title: 'Aircraft Type', url: '/aircraft-type' },
  //     { title: 'Flight Log ', url: '/flight-log' },
  //     { title: 'User', url: '/user' },
  //     { title: 'Squadron', url: '/' },
  //   ],
  // }
]

const traineeNavItems: NavGroup[] = [
  {
    title: 'Training',
    items: [
      {
        title: 'Missions',
        url: '/trainee-dashboard',
        icon: TargetIcon,
      },
      {
        title: 'My Profile',
        url: '/my-personnel',
        icon: UserIcon,
      },
    ],
  },
]

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
        <div className="min-w-0 flex-1 overflow-x-hidden p-4 lg:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { user } = useAuth()

  const isTrainee = user?.role === 'trainee'

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
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isNavActive(pathname, item.url)}
                      tooltip={item.title}
                      render={<Link to={item.url} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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

// function SideBarFooterContent() {
//   const { user } = useAuth()

//   return (
//     <SidebarMenu>
//       <SidebarMenuItem>
//         <SidebarMenuButton>
//           <User2Icon /> {user!.name || user!.username || 'Unknown'}
//         </SidebarMenuButton>
//       </SidebarMenuItem>
//     </SidebarMenu>
//   )
// }

// function LogoutButton() {
//   const queryClient = useQueryClient()

//   const logoutMutation = useMutation({
//     mutationFn: () => trpcClient.auth.logout.mutate(),
//     onSuccess: async () => {
//       queryClient.clear()
//       window.location.reload()
//     },
//   })

//   return (
//     <SidebarMenuButton
//       tooltip="Sign out"
//       disabled={logoutMutation.isPending}
//       onClick={() => logoutMutation.mutate()}
//     >
//       <LogOutIcon />
//       <span>{logoutMutation.isPending ? 'Signing out…' : 'Sign out'}</span>
//     </SidebarMenuButton>
//   )
// }
