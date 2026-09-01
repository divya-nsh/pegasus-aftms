import { protectRouteBeforeLoad } from '@/lib/utils'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/aircraft')({
  component: () => <Outlet />,
  beforeLoad: protectRouteBeforeLoad('aircraft', 'view'),
})
