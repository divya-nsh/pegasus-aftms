import { format } from 'date-fns'

export const formatDate = (
  date: Date | string,
  includeTime = false,
): string => {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }
  return format(dateObj, includeTime ? 'dd MMM yyyy, hh:mm a' : 'dd MMM yyyy')
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
