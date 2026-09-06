import PageHeader from '@/components/layout/PageHeader'
import FullPageSpinner from '@/components/loaders/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import ScheduleForm from './-components/schedule-form'
import PageCard from '@/components/layout/PageCard'

export const Route = createFileRoute('/schedules/create')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
})

function RouteComponent() {
  return (
    <PageCard>
      <PageHeader title="New Event Schedule" backTo="/schedules" />
      <ScheduleForm />
    </PageCard>
  )
}
