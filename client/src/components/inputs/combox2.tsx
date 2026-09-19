import * as ShadcnCombobox from '@/components/ui/combobox'

export type ComboOption = {
  label: string
  value: string | number
}

export type AppComboboxProps<T extends ComboOption> = {
  value?: T | null | undefined
  onValueChange?: (value: T | null) => void
  items: T[] | undefined
  itemToStringLabel?: (item: T) => string
  isItemEqualToValue?: ((itemValue: T, value: T) => boolean) | undefined
  itemToStringValue?: (item: T) => string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  invalid?: boolean
  inputId?: string
  className?: string
  renderItem?: (item: T) => React.ReactNode
  allowClear?: boolean
  icon?: React.ReactNode
  inputRef?: React.RefObject<HTMLInputElement | null>
  autoFocus?: boolean
}

function AppCombobox<T extends ComboOption>({
  autoFocus,
  className,
  value,
  onValueChange,
  items,
  itemToStringLabel,
  isItemEqualToValue,
  itemToStringValue,
  placeholder = 'Select....',
  required,
  disabled,
  invalid,
  renderItem,
  inputId,
  allowClear = true,
  icon,
  inputRef,
}: AppComboboxProps<T>) {
  return (
    <ShadcnCombobox.Combobox
      disabled={disabled}
      required={required}
      itemToStringLabel={itemToStringLabel}
      items={items}
      value={value ?? null}
      onValueChange={onValueChange}
      isItemEqualToValue={isItemEqualToValue}
      itemToStringValue={itemToStringValue}
      //   limit={limitOptions}
    >
      <ShadcnCombobox.ComboboxInput
        autoFocus={autoFocus}
        showClear={required ? false : allowClear}
        className={className}
        id={inputId}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        icon={icon}
        ref={inputRef}
      />
      <ShadcnCombobox.ComboboxContent>
        <ShadcnCombobox.ComboboxEmpty>
          No Options found.
        </ShadcnCombobox.ComboboxEmpty>
        <ShadcnCombobox.ComboboxList>
          {(item: T) => (
            <ShadcnCombobox.ComboboxItem key={item.value} value={item}>
              {renderItem
                ? renderItem(item)
                : itemToStringLabel
                  ? itemToStringLabel(item)
                  : item.label}
            </ShadcnCombobox.ComboboxItem>
          )}
        </ShadcnCombobox.ComboboxList>
      </ShadcnCombobox.ComboboxContent>
    </ShadcnCombobox.Combobox>
  )
}

export default AppCombobox
