import ErrorAlert from '@/components/errors/ErrorAlert'
import PageCard from '@/components/layout/PageCard'
import PageHeader from '@/components/layout/PageHeader'
import FullPageSpinner from '@/components/loaders/page-loader'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import ScheduleForm from './-components/schedule-form'
import MissionStatusBadge from './-components/mission-stage-bar'

export const Route = createFileRoute('/schedules/$id/edit')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Event Schedule" />
  ),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const scheduleQ = useSuspenseQuery(
    trpc.schedules.getById.queryOptions({ id: Number(id) }),
  )
  const schedule = scheduleQ.data

  return (
    <PageCard className="space-y-6">
      <PageHeader
        title="Edit Event Schedule"
        backTo="/schedules"
        extra={<MissionStatusBadge status={schedule.status} size="md" />}
      />
      <ScheduleForm schedule={schedule} />
    </PageCard>
  )
}
