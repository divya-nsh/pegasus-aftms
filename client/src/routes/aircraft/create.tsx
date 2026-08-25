import PageHeader from '@/components/layout/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import AircraftForm from './-components/aircraft-form'

export const Route = createFileRoute('/aircraft/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="px-6 max-w-6xl mx-auto">
      <PageHeader title="Create Aircraft" backTo="/aircraft" />
      <AircraftForm mode="create" />
    </div>
  )
}
