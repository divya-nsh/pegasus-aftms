import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import * as ShadcnCombobox from '@/components/ui/combobox'

export const Route = createFileRoute('/combox')({
  component: RouteComponent,
})

const countries = [
  //   { code: '', value: '', continent: '', label: 'Select country' },
  {
    code: 'ar',
    value: 'argentina',
    label: 'Argentina',
    continent: 'South America',
  },
  { code: 'au', value: 'australia', label: 'Australia', continent: 'Oceania' },
  { code: 'br', value: 'brazil', label: 'Brazil', continent: 'South America' },
  { code: 'ca', value: 'canada', label: 'Canada', continent: 'North America' },
  { code: 'cn', value: 'china', label: 'China', continent: 'Asia' },
  {
    code: 'co',
    value: 'colombia',
    label: 'Colombia',
    continent: 'South America',
  },
  { code: 'eg', value: 'egypt', label: 'Egypt', continent: 'Africa' },
  { code: 'fr', value: 'france', label: 'France', continent: 'Europe' },
  { code: 'de', value: 'germany', label: 'Germany', continent: 'Europe' },
  { code: 'it', value: 'italy', label: 'Italy', continent: 'Europe' },
  { code: 'jp', value: 'japan', label: 'Japan', continent: 'Asia' },
  { code: 'ke', value: 'kenya', label: 'Kenya', continent: 'Africa' },
  { code: 'mx', value: 'mexico', label: 'Mexico', continent: 'North America' },
  {
    code: 'nz',
    value: 'new-zealand',
    label: 'New Zealand',
    continent: 'Oceania',
  },
  { code: 'ng', value: 'nigeria', label: 'Nigeria', continent: 'Africa' },
  {
    code: 'za',
    value: 'south-africa',
    label: 'South Africa',
    continent: 'Africa',
  },
  { code: 'kr', value: 'south-korea', label: 'South Korea', continent: 'Asia' },
  {
    code: 'gb',
    value: 'united-kingdom',
    label: 'United Kingdom',
    continent: 'Europe',
  },
  {
    code: 'us',
    value: 'united-states',
    label: 'United States',
    continent: 'North America',
  },
]

function RouteComponent() {
  const [value, setValue] = useState<(typeof countries)[0] | null>(null)

  return (
    <div className="p-6 space-y-6">
      <AppCombobox
        value={value}
        onValueChange={setValue}
        items={countries}
        // renderItem={(item) => (
        //   <div className="grid items-center gap-1">
        //     <span>{item.label}</span>
        //     <span className="text-xs text-muted-foreground">
        //       {item.continent} ({item.code})
        //     </span>
        //   </div>
        // )}
        itemToStringLabel={(item) => `${item.label} - ${item.continent}`}
      />
      {/* <Combobox.Root
        items={fruits}
        onValueChange={(_value: Fruit | null) => {
          setValue(_value)
        }}
        itemToStringLabel={(item: Fruit) => `${item.label} - ${item.value}`}
        value={value}
      >
        <Combobox.InputGroup
          className={
            'flex border px-4 py-2 text-sm rounded-md focus-within:ring focus-within:ring-primary'
          }
        >
          <Combobox.Input
            placeholder="e.g. Apple"
            className={' outline-none w-full'}
          />
          <div className={'flex items-center gap-4'}>
            <Combobox.Clear className={''} aria-label="Clear selection">
              <XIcon />
            </Combobox.Clear>
            <Combobox.Trigger
              className={'text-muted-foreground'}
              aria-label="Open popup"
            >
              <CaretDownIcon className="size-4" />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner className={''} sideOffset={4}>
            <Combobox.Popup
              className={`border bg-background rounded-md py-1 shadow-sm w-(--anchor-width) max-w-(--available-width)`}
            >
              <Combobox.Empty>
                <div className={''}>No fruits found.</div>
              </Combobox.Empty>
              <Combobox.List className={'text-sm'}>
                {(item: Fruit) => (
                  <Combobox.Item
                    key={item.value}
                    value={item}
                    className={
                      'flex items-center gap-2 py-2 px-4 data-highlighted:bg-accent data-highlighted:text-accent-foreground'
                    }
                  >
                    <div className="w-3.5 flex justify-start">
                      <Combobox.ItemIndicator className={''}>
                        <CheckIcon weight="bold" size={12} />
                      </Combobox.ItemIndicator>
                    </div>

                    <span className={''}>{item.label}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root> */}
    </div>
  )
}

type AppComboboxProps<T extends { label: string; value: string }> = {
  value: T | null | undefined
  onValueChange: (value: T | null) => void
  items: T[] | undefined
  itemToStringLabel?: (item: T) => string
  isItemEqualToValue?: ((itemValue: T, value: T) => boolean) | undefined
  itemToStringValue?: (item: T) => string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  invalid?: boolean
  renderItem?: (item: T) => React.ReactNode
}

function AppCombobox<T extends { label: string; value: string }>({
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
}: AppComboboxProps<T>) {
  return (
    <ShadcnCombobox.Combobox
      disabled={disabled}
      required={required}
      itemToStringLabel={itemToStringLabel}
      items={items}
      value={value}
      onValueChange={onValueChange}
      isItemEqualToValue={isItemEqualToValue}
      itemToStringValue={itemToStringValue}
      //   limit={limitOptions}
    >
      <ShadcnCombobox.ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
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
