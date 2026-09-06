import React, { useId } from 'react'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils.ts'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { Textarea } from '../ui/textarea'
import BasicSelect from './basic-select'
import type { BasicSelectProps } from './basic-select'
import ComboboxWrapper from './combox'
import type { ComboboxWrapperProps } from './combox'
import type { DatePickerProps } from './date-picker'
import DatePicker from './date-picker'

export type TextFieldProps = {
  label: string
  onValueChange?: (value: string) => void
  errors?: Array<{ message?: string } | undefined>
  value?: string
} & React.ComponentProps<'input'>

export default function TextField({
  label,
  value,
  onValueChange = () => {},
  className,
  errors,
  id,
  ...rest
}: TextFieldProps) {
  const generatedId = useId()
  const _id = id ?? generatedId

  return (
    <Field className={cn(className)} data-invalid={!!errors}>
      <FieldLabel htmlFor={_id} required={rest.required}>
        {label}
      </FieldLabel>
      <Input
        aria-invalid={!!errors}
        className={cn('w-full')}
        id={_id}
        value={value ?? ''}
        onChange={(e) => {
          if (rest.disabled || rest.readOnly) return
          onValueChange(e.target.value)
        }}
        {...rest}
      />
      {errors && <FieldError errors={errors} />}
    </Field>
  )
}

export type BasicSelectFieldProps = {
  label: string
  errors?: Array<{ message?: string } | undefined>
} & BasicSelectProps

export function BasicSelectField({
  label,
  className,
  errors,
  ...rest
}: BasicSelectFieldProps) {
  const id = useId()

  return (
    <Field className={cn(className)} data-invalid={!!errors}>
      <FieldLabel htmlFor={id} required={rest.required}>
        {label}
      </FieldLabel>
      <BasicSelect {...rest} aria-invalid={!!errors} />
      {errors && <FieldError errors={errors} />}
    </Field>
  )
}

export type TextAreaFieldProps = {
  label: string
  onValueChange?: (value: string) => void
  errors?: Array<{ message?: string } | undefined>
} & React.ComponentProps<'textarea'>

export function TextAreaField({
  label,
  value,
  onValueChange = () => {},
  className,
  errors,
  id,
  ...rest
}: TextAreaFieldProps) {
  const generatedId = useId()
  const _id = id ?? generatedId

  return (
    <Field className={cn(className)} data-invalid={!!errors}>
      <FieldLabel htmlFor={_id} required={rest.required}>
        {label}
      </FieldLabel>
      <Textarea
        aria-invalid={!!errors}
        className={cn('w-full')}
        id={_id}
        value={value ?? ''}
        onChange={(e) =>
          !rest.disabled && !rest.readOnly && onValueChange(e.target.value)
        }
        {...rest}
      />
      {errors && <FieldError errors={errors} />}
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
      <FieldLabel htmlFor={id} required={rest.required}>
        {label}
      </FieldLabel>
      <ComboboxWrapper {...rest} />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

export type DateFieldProps = {
  label: string
  errors?: Array<{ message?: string } | undefined>
  required?: boolean
} & DatePickerProps

export function DateField({
  label,
  className,
  errors,
  ...rest
}: DateFieldProps) {
  const id = useId()
  return (
    <Field className={cn(className)} data-invalid={!!errors}>
      <FieldLabel htmlFor={id} required={rest.required}>
        {label}
      </FieldLabel>
      <DatePicker {...rest} />
      {errors && <FieldError errors={errors} />}
    </Field>
  )
}
