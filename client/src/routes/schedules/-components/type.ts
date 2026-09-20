// Label Represent Display Lable here for UI Select boxes

export type AssignmentGradingAttribute = {
  templateAttributeId: number
  gradeId: number | null
  weight: number
  status: 'pending' | 'scored' | 'exempt'
}

export type ScheduleFormAssignment = {
  personnel: {
    label: string
    value: number
    type: string
    qualification: string | null
  } | null
  aircraft: {
    label: string
    value: number
  } | null
  attendanceStatus: 'present' | 'absent' | 'excused' | null
  result: 'passed' | 'failed' | null
  remarks: string
  takeoffTime: string | null
  landingTime: string | null
  aircraftTime: string | null
  briefingTime: string | null
  obtainedGrade: {
    label: string
    value: number
  } | null
  obtainedScoreValue: number | null
  obtainedScorePercentage: number | null
  gradingAttributes: AssignmentGradingAttribute[]
}

export type ScheduleFormData = {
  id: number | null
  status?: string
  mission: {
    label: string
    value: number
    gradingTemplateId: number
    durationMinutes: number
  }
  scheduleNumber: string
  name: string
  description: string
  startDateTime: string
  endDateTime: string
  area: {
    label: string
    value: number
  } | null
  remarks: string
  assignments: Array<ScheduleFormAssignment>
}
