import ErrorAlert from '@/components/errors/ErrorAlert'
import PageCard from '@/components/layout/PageCard'
import PageHeader from '@/components/layout/PageHeader'
import FullPageSpinner from '@/components/loaders/page-loader'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import MissionStatusBadge from '@/routes/schedules/-components/mission-stage-bar'
import ScheduleReadonly from './-components/schedule-readonly'

export const Route = createFileRoute('/trainee-dashboard/$id')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Mission Schedule" />
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
        title={`Mission > ${schedule.scheduleNumber ?? id} - ${schedule.name ?? schedule.missionName ?? ''}`}
        backTo="/trainee-dashboard"
        extra={<MissionStatusBadge status={schedule.status} />}
      />
      <ScheduleReadonly schedule={schedule} />
    </PageCard>
  )
}
