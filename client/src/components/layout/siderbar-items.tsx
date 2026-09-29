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
  ClipboardCheckIcon,
  ShieldIcon,
} from 'lucide-react'
import type { NavItems } from './sidebar.types'

export const navItems: NavItems[] = [
  {
    title: 'Operations',
    items: [
      {
        title: 'Instructor Dashboard',
        url: '/instructor-dashboard',
        icon: ShieldCheckIcon,
      },
      {
        title: 'Event Schedule',
        url: '/schedules',
        icon: CalendarClockIcon,
        matchUrlMode: 'exact',
      },
      {
        title: 'Evaluate Schedule',
        url: '/schedules/evaluate-list',
        icon: ClipboardCheckIcon,
      },
      {
        title: 'Trainee Dashboard',
        url: '/trainee-dashboard',
        icon: GraduationCapIcon,
      },
    ],
  },
  {
    title: 'Masters',
    items: [
      {
        title: 'Event / Mission',
        url: '/events',
        icon: TargetIcon,
        permissionKey: 'events.view',
      },
      {
        title: 'Personnel',
        url: '/personnel',
        icon: UsersIcon,
        permissionKey: 'personnel.view',
      },
      {
        title: 'Aircraft',
        url: '/aircraft',
        icon: PlaneIcon,
        permissionKey: 'aircraft.view',
      },
      {
        title: 'Area',
        url: '/area',
        icon: MapPinnedIcon,
        permissionKey: 'area.view',
      },
      {
        title: 'Location',
        url: '/locations',
        icon: MapPinIcon,
        permissionKey: 'location.view',
      },
      {
        title: 'Gradding',
        url: '#',
        icon: GraduationCapIcon,
        items: [
          {
            title: 'Template',
            url: '/grading-template',
            permissionKey: 'grading-template.view',
          },
          {
            title: 'Scale',
            url: '/grading-scale',
            permissionKey: 'grading-scale.view',
          },
          {
            title: 'Attribute',
            url: '/grading-attribute',
            permissionKey: 'grading-attribute.view',
          },
        ],
      },
      {
        title: 'User',
        url: '/users',
        icon: UserIcon,
        permissionKey: 'user.view',
      },
      {
        title: 'Roles',
        url: '/roles',
        icon: ShieldIcon,
        permissionKey: 'role.view',
      },
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
        url: '#',
        icon: FileTextIcon,
      },
      {
        title: 'Shift Report',
        url: '#',
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

export const traineeNavItems: NavItems[] = [
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
