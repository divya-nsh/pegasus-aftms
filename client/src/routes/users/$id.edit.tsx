import ErrorAlert from '@/components/errors/ErrorAlert'
import PageHeader from '@/components/layout/PageHeader'
import FullPageSpinner from '@/components/loaders/page-loader'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import UserForm from './-components/user-form'
import PageCard from '@/components/layout/PageCard'

export const Route = createFileRoute('/users/$id/edit')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load User" />
  ),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const userId = Number(id)
  const userQ = useSuspenseQuery(
    trpc.users.getById.queryOptions({ id: userId }),
  )
  const user = userQ.data

  return (
    <PageCard>
      <PageHeader title="Edit User" backTo="/users" />
      <UserForm
        mode="edit"
        toEditId={user.id}
        initialFormData={{
          username: user.username,
          password: '',
          isActive: user.isActive,
          name: user.name ?? '',
          role: user.role ?? null,
        }}
        linkedPersonnel={user.personnel[0] ?? null}
      />
    </PageCard>
  )
}
