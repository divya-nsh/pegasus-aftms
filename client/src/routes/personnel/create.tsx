import { createFileRoute } from '@tanstack/react-router'
import PersonnelForm from './-components/personnel-form'
import { protectRouteBeforeLoad } from '@/lib/utils'

export const Route = createFileRoute('/personnel/create')({
  component: RouteComponent,
  beforeLoad: protectRouteBeforeLoad('personnel.create'),
})

function RouteComponent() {
  return <PersonnelForm mode="create" />
}
