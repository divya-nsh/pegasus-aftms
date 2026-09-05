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
