import type { RouterContext } from '@/routes/__root'
import { redirect } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import type { ModuleAction, RoleModule } from 'server/types/role'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export function protectRouteBeforeLoad(
  module: RoleModule,
  action: ModuleAction,
  redirectOptions: Parameters<typeof redirect>[0] = { to: '/' },
) {
  return ({ context }: { context: RouterContext }) => {
    const { isUserCan } = context.auth!
    if (!isUserCan(module, action)) {
      throw redirect(redirectOptions)
    }
  }
}

export function calcDurationMinutes(
  startDateTime: string,
  endDateTime: string,
) {
  if (!startDateTime || !endDateTime) return null
  return Math.floor(
    (new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) /
      1000 /
      60,
  )
}

function parseLocalDate(value: Date | string) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export const calcAge = (birthDate: Date | string) => {
  const parsed = parseLocalDate(birthDate)
  if (!parsed) return null

  const today = new Date()

  let years = today.getFullYear() - parsed.getFullYear()
  let months = today.getMonth() - parsed.getMonth()

  if (today.getDate() < parsed.getDate()) {
    months--
  }

  if (months < 0) {
    years--
    months += 12
  }

  if (years < 0) return null

  return { years, months }
}
