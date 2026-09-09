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
