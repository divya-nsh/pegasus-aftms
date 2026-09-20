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

const CLEAR_VALUE = '$$CLEAR_VALUE$$'

export type SelectValue = string | number | null

export type BasicSelectOption = {
  label: string
  value: number | string
  subLabel?: string
}

export type BasicSelectProps = {
  options: BasicSelectOption[]
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
  ['aria-invalid']?: boolean
}

export default function BasicSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select',
  required,
  disabled,
  className,
  allowClear = true,
  readOnly = false,
  onBlur,
  ['aria-invalid']: isInvalid,
}: BasicSelectProps) {
  const [open, setOpen] = useState(false)

  const items = useMemo(() => {
    return options.map((item) => ({
      label: item.label,
      value: item.value.toString(),
    }))
  }, [options])

  console.log({
    value,
  })

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
      value={value ? value.toString() : undefined}
      onValueChange={(_value) => {
        if (readOnly) return
        setOpen(false)
        if (disabled) return
        // Keep parent updates (and any Suspense refetch) off the urgent path
        // so this popup can unmount instead of staying portaled open.
        const nextValue = _value === CLEAR_VALUE ? null : _value
        onValueChange?.(nextValue)
      }}
      items={items}
    >
      <SelectTrigger
        className={cn('w-full', className)}
        aria-invalid={isInvalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {allowClear && value !== null && options.length > 0 && (
            <SelectItem
              value={null}
              className="hover:text-muted-foreground focus:text-muted-foreground"
              showIndicator={false}
            >
              <span className="text-muted-foreground text-center hover:text-muted-foreground focus:text-muted-foreground">
                -- Unselect --
              </span>
            </SelectItem>
          )}

          {options.length === 0 && (
            <p className="text-muted-foreground text-center text-sm py-2">
              No options found
            </p>
          )}

          {options.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value.toString()}
              className={cn(item.subLabel ? '' : '')}
            >
              <span>{item.label}</span>
              {item.subLabel ? (
                <span className="text-muted-foreground font-normal">
                  {item.subLabel}
                </span>
              ) : null}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
