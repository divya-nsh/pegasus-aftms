import PageHeader from '@/components/layout/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import PersonnelForm from './-components/personnel-form'

export const Route = createFileRoute('/personnel/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="px-6 max-w-6xl mx-auto">
      <PageHeader title="Create Personnel" backTo="/personnel" />
      <PersonnelForm mode="create" />
    </div>
  )
}
