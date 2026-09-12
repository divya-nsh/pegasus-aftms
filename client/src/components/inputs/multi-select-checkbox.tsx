import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { useState } from 'react'
import { CirclePlusIcon } from 'lucide-react'

type MultiSelectCheckboxProps = {
  label: string
  maxDisplay?: number
  options: {
    label: string
    value: string
  }[]
  value: string[]
  onChange: (value: string[]) => void
}

export const MultiSelectCheckbox = ({
  options,
  value,
  onChange,
  label,
  maxDisplay = 2,
}: MultiSelectCheckboxProps) => {
  const [open, setOpen] = useState(false)
  const handleChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...value, option])
    } else {
      onChange(value.filter((v) => v !== option))
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="hover:bg-muted/20 shadow-sm items-center active:bg-muted/30 border px-4 h-9 text-sm rounded-md flex"
          >
            <CirclePlusIcon className="size-4 mr-2" />
            {label}{' '}
            {value.length > 0 ? (
              <>
                <Separator
                  orientation="vertical"
                  className="h-5 mx-3 my-auto border-1.5"
                />

                {value.length > maxDisplay ? (
                  <Badge variant="secondary">{value.length} Selected</Badge>
                ) : (
                  value.map((v) => (
                    <Badge key={v} variant="secondary">
                      {v}
                    </Badge>
                  ))
                )}
              </>
            ) : null}
          </button>
        }
      />
      <DropdownMenuContent>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => handleChange(option.value, checked)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
