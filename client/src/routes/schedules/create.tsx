import FullPageSpinner from '@/components/loaders/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import ScheduleForm from './-components/shedule-form3'
import PageCard from '@/components/layout/PageCard'

export const Route = createFileRoute('/schedules/create')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
})

function RouteComponent() {
  return (
    <PageCard>
      <ScheduleForm mode="create" />
    </PageCard>
  )
}
