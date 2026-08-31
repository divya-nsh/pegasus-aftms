import ErrorAlert from '@/components/errors/ErrorAlert'
import PageHeader from '@/components/layout/PageHeader'
import FullPageSpinner from '@/components/loaders/page-loader'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import PersonnelForm from './-components/personnel-form'

export const Route = createFileRoute('/personnel/$id/edit')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Personnel" />
  ),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const personnelId = Number(id)
  const personnelQ = useSuspenseQuery(
    trpc.personnel.getById.queryOptions({ id: personnelId }),
  )
  const person = personnelQ.data

  return (
    <div className="px-6 max-w-6xl mx-auto">
      <PageHeader title="Edit Personnel" backTo="/personnel" />
      <PersonnelForm
        mode="edit"
        toEditId={person.id}
        initialFormData={{
          personnelType: person.personnelType,
          batchNo: person.batchNo ?? '',
          code: person.code ?? '',
          firstName: person.firstName,
          lastName: person.lastName ?? '',
          gender: person.gender,
          dateOfBirth: person.dateOfBirth ?? '',
          dateOfJoin: person.dateOfJoin ?? '',
          rank: person.rank ?? '',
          phone: person.phone ?? '',
          email: person.email ?? '',
          address: person.address ?? '',
          medicalStatus: person.medicalStatus,
          medicalExamDate: person.medicalExamDate ?? '',
          medicalValidUntil: person.medicalValidUntil ?? '',
          imageId: person.imageId ?? null,
          userId: person.userId ?? null,
          user: person.user ? { username: person.user.username } : undefined,
        }}
      />
    </div>
  )
}
