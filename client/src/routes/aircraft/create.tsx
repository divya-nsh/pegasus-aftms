import PageHeader from '@/components/layout/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import AircraftForm from './-components/aircraft-form'
import { protectRouteBeforeLoad } from '@/lib/utils'

export const Route = createFileRoute('/aircraft/create')({
  component: RouteComponent,
  beforeLoad: protectRouteBeforeLoad('aircraft', 'create'),
})

function RouteComponent() {
  return (
    <div className="px-6 max-w-6xl mx-auto">
      <PageHeader title="New Aircraft" backTo="/aircraft" />
      <AircraftForm mode="create" />
    </div>
  )
}
