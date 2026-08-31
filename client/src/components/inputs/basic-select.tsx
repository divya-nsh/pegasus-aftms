import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { startTransition, useMemo, useState } from 'react'

export type SelectValue = string | null

export type BasicSelectProps = {
  options: { label: string; value: number | string }[]
  value?: SelectValue
  onValueChange?: (value: SelectValue) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  allowClear?: boolean
  readOnly?: boolean
  valueAsNumber?: boolean
  onBlur?: () => void
}

export default function BasicSelect({
  options,
  value,
  onValueChange,
  placeholder,
  required,
  disabled,
  className,
  allowClear = true,
  readOnly = false,
  onBlur,
}: BasicSelectProps) {
  const [open, setOpen] = useState(false)

  const items = useMemo(() => {
    return options.map((item) => ({
      label: item.label,
      value: item.value.toString(),
    }))
  }, [options])

  return (
    <Select
      open={readOnly ? false : open}
      onOpenChange={(v) => {
        if (open === false) {
          onBlur?.()
        }
        setOpen(v)
      }}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value?.toString() ?? null}
      onValueChange={(nextValue) => {
        if (readOnly) return
        setOpen(false)
        if (disabled) return
        // Keep parent updates (and any Suspense refetch) off the urgent path
        // so this popup can unmount instead of staying portaled open.
        startTransition(() => {
          onValueChange?.(nextValue)
        })
      }}
      items={items}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {allowClear && (
            <SelectItem
              value=""
              className="hover:text-muted-foreground focus:text-muted-foreground"
              showIndicator={false}
            >
              <span className="text-muted-foreground text-center hover:text-muted-foreground focus:text-muted-foreground">
                -- Unselect --
              </span>
            </SelectItem>
          )}
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
