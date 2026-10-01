import PageHeader from '@/components/layout/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import PersonnelForm from './-components/personnel-form'
import PageCard from '@/components/layout/PageCard'
import { protectRouteBeforeLoad } from '@/lib/utils'

export const Route = createFileRoute('/personnel/create')({
  component: RouteComponent,
  beforeLoad: protectRouteBeforeLoad('personnel.create'),
})

function RouteComponent() {
  return (
    <PageCard>
      <PageHeader title="Create Personnel" backTo="/personnel" />
      <PersonnelForm mode="create" />
    </PageCard>
  )
}
