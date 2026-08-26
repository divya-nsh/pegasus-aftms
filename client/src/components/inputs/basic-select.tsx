import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { startTransition, useState } from 'react'

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
}: {
  options: { label: string; value: string }[]
  value?: string | undefined | null | number
  onValueChange?: (value: string | undefined | null | number) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  allowClear?: boolean
  readOnly?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Select
      open={readOnly ? false : open}
      onOpenChange={setOpen}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
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
      items={options}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {allowClear && (
            <SelectItem value="" className="" showIndicator={false}>
              <span className="text-muted-foreground text-center">
                -- Select --
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
