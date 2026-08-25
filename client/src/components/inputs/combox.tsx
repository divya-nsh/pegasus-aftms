import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox'
import { startTransition } from 'react'

type Option<T extends string | number = string> = {
  label: string
  value: T
}

export type ComboboxWrapperProps<T extends string | number = string> = {
  options: Option<T>[] | T[]
  value?: T | null
  onValueChange?: (value: T | null) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  autoFocus?: boolean
  showTrigger?: boolean
  showClear?: boolean
  id?: string
}

function ComboboxWrapper<T extends string | number = string>({
  options,
  value,
  onValueChange,
  ...rest
}: ComboboxWrapperProps<T>) {
  return (
    <Combobox<T>
      items={options}
      value={value}
      onValueChange={(_v) => {
        startTransition(() => {
          onValueChange?.(_v)
        })
      }}
    >
      <ComboboxInput {...rest} />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: Option<T> | T) => (
            <ComboboxItem
              key={typeof item === 'object' ? item.value : item}
              value={typeof item === 'object' ? item.value : item}
            >
              {typeof item === 'object' ? item.label : item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export default ComboboxWrapper
