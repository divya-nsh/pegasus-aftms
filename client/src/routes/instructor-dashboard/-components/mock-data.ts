import type { MissionStatus } from '@/routes/schedules/-components/mission-stage-bar'

export type InstructorMission = {
  id: number
  scheduleNumber: string
  name: string
  missionName: string
  startDateTime: string
  endDateTime: string
  status: MissionStatus
  aircraftName: string
  aircraftTailNumber: string
  areaName: string
  traineeNames: string[]
}

export type InstructorTrainee = {
  id: number
  firstName: string
  lastName: string
  code: string
  missionsCompleted: number
  missionsAssigned: number
  lastMissionDate: string
  status: 'active' | 'on_leave'
}

export const instructorStats = {
  missionsToday: 3,
  missionsParticipated: 47,
  trainees: 12,
  inProgress: 2,
  completedThisMonth: 8,
  hoursThisMonth: 18.4,
}

export const todayMissions: InstructorMission[] = [
  {
    id: 101,
    scheduleNumber: 'SCH-2026-084',
    name: 'Morning dual circuit',
    missionName: 'Circuit training — dual',
    startDateTime: '2026-08-26T07:30:00',
    endDateTime: '2026-08-26T09:00:00',
    status: 'completed',
    aircraftName: 'Cessna 172',
    aircraftTailNumber: 'VT-PEX',
    areaName: 'Circuit A',
    traineeNames: ['Aarav Mehta'],
  },
  {
    id: 102,
    scheduleNumber: 'SCH-2026-085',
    name: 'Nav exercise 04',
    missionName: 'VFR navigation',
    startDateTime: '2026-08-26T10:15:00',
    endDateTime: '2026-08-26T12:00:00',
    status: 'in_progress',
    aircraftName: 'Piper PA-28',
    aircraftTailNumber: 'VT-PGL',
    areaName: 'Sector North',
    traineeNames: ['Diya Kapoor', 'Rohan Iyer'],
  },
  {
    id: 103,
    scheduleNumber: 'SCH-2026-086',
    name: 'Night dual briefing + sortie',
    missionName: 'Night flying — dual',
    startDateTime: '2026-08-26T18:30:00',
    endDateTime: '2026-08-26T20:15:00',
    status: 'published',
    aircraftName: 'Cessna 172',
    aircraftTailNumber: 'VT-PEX',
    areaName: 'Circuit B',
    traineeNames: ['Kabir Singh'],
  },
]

export const upcomingMissions: InstructorMission[] = [
  {
    id: 104,
    scheduleNumber: 'SCH-2026-091',
    name: 'Instrument approaches',
    missionName: 'IFR approach training',
    startDateTime: '2026-08-27T08:00:00',
    endDateTime: '2026-08-27T10:00:00',
    status: 'published',
    aircraftName: 'Diamond DA40',
    aircraftTailNumber: 'VT-PDA',
    areaName: 'Approach East',
    traineeNames: ['Meera Nair'],
  },
  {
    id: 105,
    scheduleNumber: 'SCH-2026-094',
    name: 'Emergency procedures',
    missionName: 'Simulated engine failure',
    startDateTime: '2026-08-28T11:00:00',
    endDateTime: '2026-08-28T12:30:00',
    status: 'published',
    aircraftName: 'Cessna 172',
    aircraftTailNumber: 'VT-PFT',
    areaName: 'Practice area 2',
    traineeNames: ['Aarav Mehta', 'Zoya Khan'],
  },
  {
    id: 106,
    scheduleNumber: 'SCH-2026-099',
    name: 'Solo check ride prep',
    missionName: 'Pre-solo assessment',
    startDateTime: '2026-08-29T09:30:00',
    endDateTime: '2026-08-29T11:00:00',
    status: 'published',
    aircraftName: 'Piper PA-28',
    aircraftTailNumber: 'VT-PGL',
    areaName: 'Circuit A',
    traineeNames: ['Rohan Iyer'],
  },
]

export const assignedTrainees: InstructorTrainee[] = [
  {
    id: 1,
    firstName: 'Aarav',
    lastName: 'Mehta',
    code: 'TR-1042',
    missionsCompleted: 14,
    missionsAssigned: 16,
    lastMissionDate: '2026-08-26T07:30:00',
    status: 'active',
  },
  {
    id: 2,
    firstName: 'Diya',
    lastName: 'Kapoor',
    code: 'TR-1108',
    missionsCompleted: 9,
    missionsAssigned: 11,
    lastMissionDate: '2026-08-26T10:15:00',
    status: 'active',
  },
  {
    id: 3,
    firstName: 'Rohan',
    lastName: 'Iyer',
    code: 'TR-1115',
    missionsCompleted: 7,
    missionsAssigned: 10,
    lastMissionDate: '2026-08-26T10:15:00',
    status: 'active',
  },
  {
    id: 4,
    firstName: 'Kabir',
    lastName: 'Singh',
    code: 'TR-1180',
    missionsCompleted: 4,
    missionsAssigned: 6,
    lastMissionDate: '2026-08-24T16:00:00',
    status: 'active',
  },
  {
    id: 5,
    firstName: 'Meera',
    lastName: 'Nair',
    code: 'TR-1201',
    missionsCompleted: 11,
    missionsAssigned: 12,
    lastMissionDate: '2026-08-25T08:45:00',
    status: 'active',
  },
  {
    id: 6,
    firstName: 'Zoya',
    lastName: 'Khan',
    code: 'TR-1214',
    missionsCompleted: 3,
    missionsAssigned: 5,
    lastMissionDate: '2026-08-22T13:00:00',
    status: 'on_leave',
  },
]
