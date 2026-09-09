import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/form-generator')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/form-generator"!</div>
}
