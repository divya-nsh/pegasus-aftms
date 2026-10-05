import type React from 'react'
import { useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

export default function PasswordInput({
  className,
  style,
  ...props
}: React.ComponentProps<'input'>) {
  const [isHidden, setIsHidden] = useState(true)

  return (
    <div className={cn('relative flex items-center', className)} style={style}>
      <Input
        {...props}
        className="pr-8"
        type={isHidden ? 'password' : 'text'}
      />
      <Button
        tabIndex={-1}
        onClick={() => setIsHidden(!isHidden)}
        size="icon-sm"
        variant="ghost"
        className="absolute right-1.5 size-7 text-muted-foreground"
      >
        {isHidden ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}
