import TextField, {
  BasicSelectField,
  ComboboxField2,
  DateField,
  TextAreaField,
} from '@/components/inputs/TextField'
import type {
  BasicSelectFieldProps,
  ComboboxFieldProps,
  DateFieldProps,
  TextAreaFieldProps,
  TextFieldProps,
} from '@/components/inputs/TextField'
import { Checkbox } from '@/components/ui/checkbox'
import { useId } from 'react'
import { useFieldContext } from './form-context'
import { Field, FieldLabel } from '../ui/field'
import type { ComboOption } from '../inputs/combox2'

// C = Controller, All are Binded Form Fields

export function CTextField({
  valueAsUppercase,
  valueAsNumber,
  onAfterCommit,
  ...props
}: Omit<TextFieldProps, 'value' | 'onValueChange' | 'errors'> & {
  valueAsUppercase?: boolean
  valueAsNumber?: boolean
  /**
   * A hook that is called after the value is changed and set to form state.
   */
  onAfterCommit?: (value: string | number | null) => void
}) {
  const field = useFieldContext<string | number | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <TextField
      {...props}
      value={field.state.value?.toString() ?? ''}
      onValueChange={(value) => {
        let _value: string | number | null = value.toString()
        if (valueAsNumber) {
          if (value.trim() === '') {
            _value = null
          } else {
            _value = Number(value)
          }
        } else {
          _value = valueAsUppercase ? (value + '').toUpperCase() : value
        }

        field.handleChange(_value)
        onAfterCommit?.(_value)
      }}
      errors={isInvalid ? field.state.meta.errors : undefined}
      onBlur={() => field.handleBlur()}
    />
  )
}

export function CBasicSelect({
  emptyAsNull = false,
  valueAsNumber = false,
  onCommited,
  ...props
}: Omit<BasicSelectFieldProps, 'errors' | 'onBlur'> & {
  emptyAsNull?: boolean
  valueAsNumber?: boolean
  /**
   * A hook that is called after the value is changed and set to form state.
   */
  onCommited?: (value: string | number | null) => void
}) {
  const field = useFieldContext<string | number | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <BasicSelectField
      value={field.state.value ?? null}
      onValueChange={(value) => {
        if (valueAsNumber) {
          if (!value) {
            field.handleChange(value)
          } else {
            field.handleChange(Number(value))
          }
        } else {
          field.handleChange(value)
        }
        onCommited?.(value)
      }}
      errors={isInvalid ? field.state.meta.errors : undefined}
      onBlur={() => field.handleBlur()}
      {...props}
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

export function CDateField({
  onAfterCommit,
  ...props
}: DateFieldProps & { onAfterCommit?: (value: string | null) => void }) {
  const field = useFieldContext<string | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <DateField
      {...props}
      value={field.state.value}
      onChange={(value) => {
        field.handleChange(value)
        onAfterCommit?.(value)
      }}
      errors={isInvalid ? field.state.meta.errors : undefined}
    />
  )
}

export function CComboboxField<T extends ComboOption>({
  ...rest
}: Omit<ComboboxFieldProps<T>, 'value' | 'errors'>) {
  const field = useFieldContext<T | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <ComboboxField2
      value={field.state.value}
      onValueChange={rest.disabled ? undefined : field.handleChange}
      errors={isInvalid ? field.state.meta.errors : undefined}
      {...rest}
    />
  )
}
