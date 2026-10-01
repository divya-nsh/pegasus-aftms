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
  PrinterIcon,
  ClipboardCheckIcon,
  ShieldIcon,
} from 'lucide-react'
import type { NavNode } from './sidebar.types'

export const navItems: NavNode[] = [
  {
    title: 'Operations',
    children: [
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
        permissionKey: 'eventSchedule.read',
      },
      {
        title: 'Evaluate Schedule',
        url: '/schedules/evaluate-list',
        icon: ClipboardCheckIcon,
        permissionKey: 'eventSchedule.read',
      },
      // {
      //   title: 'Trainee Dashboard',
      //   url: '/trainee-dashboard',
      //   icon: GraduationCapIcon,
      // },
    ],
  },
  {
    title: 'Masters',
    children: [
      {
        title: 'Event / Mission',
        url: '/events',
        icon: TargetIcon,
        permissionKey: 'event.read',
      },
      {
        title: 'Personnel',
        url: '/personnel',
        icon: UsersIcon,
        permissionKey: 'personnel.read',
      },
      {
        title: 'Aircraft',
        url: '/aircraft',
        icon: PlaneIcon,
        permissionKey: 'aircraft.read',
      },

      {
        title: 'Gradding',
        url: '#',
        icon: GraduationCapIcon,
        children: [
          {
            title: 'Template',
            url: '/grading-template',
            permissionKey: 'gradingTemplate.read',
          },
          {
            title: 'Scale',
            url: '/grading-scale',
            permissionKey: 'gradingScale.read',
          },
          {
            title: 'Attribute',
            url: '/grading-attribute',
            permissionKey: 'gradingAttribute.read',
          },
        ],
      },

      {
        title: 'Administration',
        icon: ShieldIcon,
        children: [
          {
            title: 'User',
            url: '/users',
            icon: UserIcon,
            permissionKey: 'user.read',
          },
          {
            title: 'Roles',
            url: '/roles',
            icon: ShieldIcon,
            // Only show to super admin
            permissionKey: '*',
          },
        ],
      },

      {
        title: 'Area',
        url: '/area',
        icon: MapPinnedIcon,
        permissionKey: 'area.read',
      },
      {
        title: 'Location',
        url: '/locations',
        icon: MapPinIcon,
        permissionKey: 'location.read',
      },
    ],
  },
  {
    title: 'Reports',
    children: [
      {
        title: 'Print Schedule',
        url: '/reports/print-schedule',
        permissionKey: 'eventSchedule.read',
        icon: PrinterIcon,
      },
    ],
  },
]

export const traineeNavItems: NavNode[] = [
  {
    title: 'Training',
    children: [
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
