import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/multicheck')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="p-8"></div>
}
