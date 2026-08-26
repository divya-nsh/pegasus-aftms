import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Button } from '../ui/button'

function PageHeader({
  title,
  backTo,
  extra,
}: {
  title: string
  backTo?: string | boolean
  extra?: ReactNode
}) {
  const router = useRouter()

  const handleBack = () => {
    router.history.back()
  }

  return (
    <div className="flex items-center gap-2 mb-6 border-b pb-1">
      {backTo ? (
        <Button
          onClick={handleBack}
          variant="ghost"
          size="icon"
          aria-label="Go back"
          disabled={!router.history.canGoBack()}
        >
          <ArrowLeftIcon />
        </Button>
      ) : null}
      <h1 className="text-xl font-bold min-w-0 truncate">{title}</h1>
      {extra ? <div className="ml-auto shrink-0">{extra}</div> : null}
    </div>
  )
}

export default PageHeader
