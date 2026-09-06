import PageHeader from '@/components/layout/PageHeader'
import { useAuth } from '@/context/auth-context'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import PersonnelForm from './personnel/-components/personnel-form'
import { trpc } from '@/trpc'
import PageCard from '@/components/layout/PageCard'

export const Route = createFileRoute('/my-personnel')({
  component: RouteComponent,
})

function RouteComponent() {
  const { profile } = useAuth()
  const personnelId = profile?.id ?? 0

  const { data } = useSuspenseQuery(
    trpc.personnel.getById.queryOptions({ id: personnelId }),
  )

  return (
    <PageCard>
      <PageHeader title="My Personnel" />
      <PersonnelForm
        mode="view"
        toEditId={personnelId}
        initialFormData={{
          personnelType: data.personnelType,
          batchNo: data.batchNo ?? '',
          code: data.code ?? '',
          firstName: data.firstName,
          lastName: data.lastName ?? '',
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ?? '',
          dateOfJoin: data.dateOfJoin ?? '',
          rank: data.rank ?? '',
          qualification: data.qualification ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
          medicalStatus: data.medicalStatus,
          medicalExamDate: data.medicalExamDate ?? '',
          medicalValidUntil: data.medicalValidUntil ?? '',
          imageId: data.imageId ?? null,
        }}
        linkedUser={
          data.userId && data.user
            ? { id: data.userId, username: data.user.username }
            : null
        }
      />
    </PageCard>
  )
}
