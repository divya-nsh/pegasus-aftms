import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/roles/$id/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/roles/$id/edit"!</div>
}
