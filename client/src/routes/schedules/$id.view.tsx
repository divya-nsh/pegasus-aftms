import ErrorAlert from '@/components/errors/ErrorAlert'
import FullPageSpinner from '@/components/loaders/page-loader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/schedules/$id/view')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Mission Schedule" />
  ),
})

export function RouteComponent() {
  const { id } = Route.useParams()
  return <div></div>
}
