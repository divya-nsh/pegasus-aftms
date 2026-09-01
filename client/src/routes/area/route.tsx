import { createFileRoute } from '@tanstack/react-router'
import { protectRouteBeforeLoad } from '@/lib/utils'

export const Route = createFileRoute('/area')({
  component: RouteComponent,
  beforeLoad: protectRouteBeforeLoad('area', 'view'),
})

function RouteComponent() {
  return <div>Hello "/area"!</div>
}
