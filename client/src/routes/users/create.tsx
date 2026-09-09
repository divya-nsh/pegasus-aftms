import PageHeader from '@/components/layout/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import UserForm from './-components/user-form'
import PageCard from '@/components/layout/PageCard'

export const Route = createFileRoute('/users/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageCard>
      <PageHeader title="Create User" backTo="/users" />
      <UserForm mode="create" />
    </PageCard>
  )
}
