import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { useFormContext } from './form-context'

function SubscribeButton({
  label = 'Save',
  className,
  size,
}: {
  label?: string
  className?: string
  size?: 'sm' | 'lg'
}) {
  const form = useFormContext()

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          size={size ?? 'default'}
          type="submit"
          disabled={isSubmitting}
          onClick={() => form.handleSubmit()}
          className={cn('min-w-20', className)}
        >
          {isSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : null}
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}

export { SubscribeButton }
