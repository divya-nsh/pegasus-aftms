import type { FileRouteTypes } from '@/routeTree.gen'
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  UsersIcon,
  TargetIcon,
  PlaneIcon,
  MapPinnedIcon,
  MapPinIcon,
  UserIcon,
  FileTextIcon,
  PrinterIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavGroup = {
  title: string
  items: NavItem[]
}

export type NavItem = {
  title: string
  url: FileRouteTypes['to']
  icon?: LucideIcon
}

export const navItems: NavGroup[] = [
  {
    title: 'Operations',
    items: [
      {
        title: 'Event Schedule',
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
      { title: 'Event / Mission', url: '/events', icon: TargetIcon },
      { title: 'Personnel', url: '/personnel', icon: UsersIcon },
      { title: 'Aircraft', url: '/aircraft', icon: PlaneIcon },
      { title: 'Area', url: '/area', icon: MapPinnedIcon },
      { title: 'User', url: '/users', icon: UserIcon },
      { title: 'Location', url: '/locations', icon: MapPinIcon },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        title: 'Print Schedule',
        url: '/reports/print-schedule',
        icon: PrinterIcon,
      },
      {
        title: 'Flight Log',
        url: '/',
        icon: FileTextIcon,
      },
      {
        title: 'Shift Report',
        url: '/',
        icon: CalendarDaysIcon,
      },
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

export const traineeNavItems: NavGroup[] = [
  {
    title: 'Training',
    items: [
      {
        title: 'Dashboard',
        url: '/trainee-dashboard',
        icon: GraduationCapIcon,
      },
      {
        title: 'My Profile',
        url: '/my-personnel',
        icon: UserIcon,
      },
      { title: 'My Shedules', url: '/schedules', icon: CalendarClockIcon },
      {
        title: 'Day Timeline',
        url: '/schedules/timeline-view',
        icon: CalendarDaysIcon,
      },
    ],
  },
]
