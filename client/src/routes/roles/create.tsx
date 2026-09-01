import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/roles/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/roles/create"!</div>
}
