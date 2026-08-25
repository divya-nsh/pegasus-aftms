import React, { useId } from 'react'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils.ts'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { Textarea } from '../ui/textarea'
import BasicSelect from './basic-select'
import ComboboxWrapper from './combox'
import type { ComboboxWrapperProps } from './combox'

export default function TextField({
  label,
  value,
  onValueChange = () => {},
  className,
  error,
  id,
  ...rest
}: {
  label: string
  onValueChange?: (value: string) => void
  error?: string
} & React.ComponentProps<'input'>) {
  const generatedId = useId()
  const _id = id ?? generatedId

  return (
    <Field className={cn(className)} data-invalid={!!error}>
      <FieldLabel htmlFor={_id}>{label}</FieldLabel>
      <Input
        aria-invalid={!!error}
        className={cn('w-full')}
        id={_id}
        value={value}
        onChange={(e) =>
          !rest.disabled && !rest.readOnly && onValueChange(e.target.value)
        }
        {...rest}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

export function BasicSelectField({
  label,
  options,
  onValueChange = () => {},
  className,
  error,
  value,
  disabled,
  placeholder = 'Select...',
  required = false,
}: {
  label: string
  value?: string | undefined | null | number
  onValueChange?: (value: string | undefined | null | number) => void
  error?: string
  options: { label: string; value: string }[]
  className?: string
  disabled?: boolean
  placeholder?: string
  required?: boolean
}) {
  const id = useId()

  return (
    <Field className={cn(className)} data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <BasicSelect
        options={options}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

export function TextAreaField({
  label,
  value,
  onValueChange = () => {},
  className,
  error,
  id,
  ...rest
}: {
  label: string
  onValueChange?: (value: string) => void
  error?: string
} & React.ComponentProps<'textarea'>) {
  const generatedId = useId()
  const _id = id ?? generatedId

  return (
    <Field className={cn(className)} data-invalid={!!error}>
      <FieldLabel htmlFor={_id}>{label}</FieldLabel>
      <Textarea
        aria-invalid={!!error}
        className={cn('w-full')}
        id={_id}
        value={value}
        onChange={(e) =>
          !rest.disabled && !rest.readOnly && onValueChange(e.target.value)
        }
        {...rest}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

export function ComboboxField<T extends string | number = string>({
  label,
  className,
  error,
  ...rest
}: {
  label: string
  error?: string
} & ComboboxWrapperProps<T>) {
  const id = useId()

  return (
    <Field className={cn(className)} data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <ComboboxWrapper {...rest} />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
