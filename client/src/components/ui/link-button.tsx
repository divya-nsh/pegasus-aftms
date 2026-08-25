import { Link } from '@tanstack/react-router'
import { buttonVariants } from './button'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { PlusIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

export default function LinkButton({
  children,
  className,
  variant,
  size,
  newButton,
  ...props
}: ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & { newButton?: boolean }) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {newButton ? (
        <>
          <PlusIcon />
          New
        </>
      ) : (
        children
      )}
    </Link>
  )
}
