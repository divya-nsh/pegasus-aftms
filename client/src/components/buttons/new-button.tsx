import { Button } from '../ui/button'
import type { ButtonProps } from '../ui/button'
import { PlusIcon } from 'lucide-react'

export default function NewButton(props: ButtonProps) {
  return (
    <Button {...props}>
      <PlusIcon />
      New
    </Button>
  )
}
