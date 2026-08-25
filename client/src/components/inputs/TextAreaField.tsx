import { useId } from 'react'
import { Label } from '../ui/label'
import { cn } from '@/lib/utils.ts'
import { Textarea } from '../ui/textarea'

export default function TextField({
  label,
  value,
  onChange = () => {},
  className,
  required,
  placeholder,
  disabled,
}: {
  label: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'number' | 'email' | 'password'
  className?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}) {
  const id = useId()

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  )
}
