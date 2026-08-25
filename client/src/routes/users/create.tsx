import PageHeader from '@/components/layout/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import UserForm from './-components/user-form'

export const Route = createFileRoute('/users/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="px-6 max-w-6xl mx-auto">
      <PageHeader title="Create User" backTo="/users" />
      <UserForm mode="create" />
    </div>
  )
}
