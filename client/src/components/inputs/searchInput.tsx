import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group'
import { SearchIcon } from 'lucide-react'

export const SearchInput = ({
  placeholder,
  value,
  onValueChange = () => {},
  disabled,
  className,
  autoFocus,
}: {
  placeholder?: string
  value: string | undefined
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  autoFocus?: boolean
}) => {
  return (
    <InputGroup className={className}>
      <InputGroupInput
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        type="search"
        autoFocus={autoFocus}
        disabled={disabled}
        className=" shadow-none"
      />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  )
}
