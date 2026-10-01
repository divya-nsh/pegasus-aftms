import {
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  PrinterIcon,
  TrashIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import type { linkOptions } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { useAuth } from '@/context/auth-context'
import { isPermitted } from '@/lib/permission'
import type { PermissionRequirement } from '@/lib/permission'

// Provide default icon and label for common actions types for convenience
const actionTypesMap = {
  edit: { icon: <PencilIcon />, label: 'Edit' },
  delete: { icon: <TrashIcon />, label: 'Delete' },
  print: { icon: <PrinterIcon />, label: 'Print' },
  view: { icon: <EyeIcon />, label: 'View' },
}

export type MenuAction =
  | {
      type?: keyof typeof actionTypesMap | 'separator'
      label?: string
      icon?: ReactNode
      onClick?: () => void
      isDestructive?: boolean
      redirectTo?: ReturnType<typeof linkOptions>
      permissionKey?: PermissionRequirement
    }
  | { type: 'separator'; hidden?: boolean }

type Props = {
  actions?: Array<MenuAction | false | null | undefined>
  className?: string
  children?: ReactNode
}

export function ActionMenu({ actions = [], className, children }: Props) {
  const router = useRouter()
  const auth = useAuth()

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      if (!action) return false
      if (action.type === 'separator') return true
      if (action.permissionKey && !isPermitted(auth, action.permissionKey))
        return false
      return true
    })
  }, [actions, auth])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className={cn('h-8 w-8 p-0', className)} />
        }
      >
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {children}
          {filteredActions.map((action, index) => {
            if (!action) return null
            if (action.type === 'separator') {
              // If the separator is not the first or last item, show it
              if (
                !!filteredActions[index + 1] &&
                !!filteredActions[index - 1]
              ) {
                return <DropdownMenuSeparator key={index} />
              }
              return null // If the separator is the first or last item, don't show it
            }

            const actionTypeConfig = action.type
              ? actionTypesMap[action.type]
              : undefined

            return (
              <DropdownMenuItem
                key={index}
                onClick={async () => {
                  await wait(200) // Hack to prevent problem with not closing menu when component suspends
                  action.onClick?.()
                  if (action.redirectTo) {
                    router.navigate(action.redirectTo)
                  }
                }}
                variant={
                  (action.isDestructive ?? action.type === 'delete')
                    ? 'destructive'
                    : 'default'
                }
              >
                {action.icon ?? actionTypeConfig?.icon}
                {action.label ?? actionTypeConfig?.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
