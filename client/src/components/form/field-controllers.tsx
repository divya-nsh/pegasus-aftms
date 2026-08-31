import TextField, {
  BasicSelectField,
  TextAreaField,
} from '@/components/inputs/TextField'
import type {
  BasicSelectFieldProps,
  TextAreaFieldProps,
  TextFieldProps,
} from '@/components/inputs/TextField'
import { Checkbox } from '@/components/ui/checkbox'
import { useId } from 'react'
import { useFieldContext } from './form-context'
import { Field, FieldLabel } from '../ui/field'

// C = Controller, All are Binded Form Fields

export function CTextField({
  valueAsUppercase,
  valueAsNumber,
  ...props
}: Omit<TextFieldProps, 'value' | 'onValueChange' | 'errors'> & {
  valueAsUppercase?: boolean
  valueAsNumber?: boolean
}) {
  const field = useFieldContext<string | number | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <TextField
      {...props}
      value={field.state.value?.toString() ?? ''}
      onValueChange={(value) => {
        if (valueAsNumber) {
          if (value.trim() === '') {
            field.handleChange(null)
          } else {
            field.handleChange(Number(value))
          }
        } else {
          field.handleChange(
            valueAsUppercase ? (value + '').toUpperCase() : value,
          )
        }
      }}
      errors={isInvalid ? field.state.meta.errors : undefined}
      onBlur={() => field.handleBlur()}
    />
  )
}

export function CBasicSelect({
  emptyAsNull = false,
  valueAsNumber = false,
  ...props
}: Omit<BasicSelectFieldProps, 'value' | 'onValueChange' | 'errors'> & {
  emptyAsNull?: boolean
  valueAsNumber?: boolean
}) {
  const field = useFieldContext<string | number | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <BasicSelectField
      {...props}
      value={field.state.value?.toString() ?? ''}
      onValueChange={(value) => {
        const _value = value?.toString() ?? ''
        if (valueAsNumber) {
          if (_value.trim() === '') {
            field.handleChange(null)
          } else {
            field.handleChange(Number(_value))
          }
        } else {
          field.handleChange(_value)
        }
      }}
      errors={isInvalid ? field.state.meta.errors : undefined}
      onBlur={() => field.handleBlur()}
    />
  )
}

export function CTextAreaField({
  ...props
}: Omit<TextAreaFieldProps, 'value' | 'onValueChange' | 'errors'>) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <TextAreaField
      {...props}
      value={field.state.value}
      onValueChange={field.handleChange}
      errors={isInvalid ? field.state.meta.errors : undefined}
      onBlur={() => field.handleBlur()}
    />
  )
}

export function CCheckbox({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  const id = useId()

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field className="flex items-center gap-2" orientation={'horizontal'}>
      <Checkbox
        aria-invalid={isInvalid}
        id={id}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        onBlur={() => field.handleBlur()}
      />
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
    </Field>
  )
}
