import { DATE_FORMAT, TIME_FORMAT, WEEKDAY_FORMAT } from '@/config/constants'
import { format } from 'date-fns'

export const formatDate = (
  date: Date | string,
  includeTime = false,
  addWeekDay = false,
): string => {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }
  const pattern = [
    addWeekDay ? WEEKDAY_FORMAT : null,
    DATE_FORMAT,
    includeTime ? TIME_FORMAT : null,
  ]
    .filter(Boolean)
    .join(', ')
  return format(dateObj, pattern)
}

export const toDateTimeLocal = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return ''
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`
}

export const addMinutesToDateTimeLocal = (
  value: string,
  minutes: number,
): string => {
  if (!value || !minutes) return value
  const dateObj = new Date(value)
  if (isNaN(dateObj.getTime())) return value
  dateObj.setMinutes(dateObj.getMinutes() + minutes)
  return toDateTimeLocal(dateObj)
}

export function formatDateDifference(
  date1: string | Date | null | undefined,
  date2: string | Date | null | undefined,
): string | null {
  if (date1 == null || date2 == null) {
    return '0'
  }

  const time1 =
    date1 instanceof Date ? date1.getTime() : new Date(date1).getTime()

  const time2 =
    date2 instanceof Date ? date2.getTime() : new Date(date2).getTime()

  // Invalid date
  if (Number.isNaN(time1) || Number.isNaN(time2)) {
    return null
  }

  const diff = Math.abs(time2 - time1)

  if (diff === 0) {
    return '0'
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`)
  }

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)
  }

  return parts.join(' ')
}
