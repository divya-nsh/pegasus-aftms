import ErrorAlert from '@/components/errors/ErrorAlert'
import PageHeader from '@/components/layout/PageHeader'
import FullPageSpinner from '@/components/loaders/page-loader'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import AircraftForm from './-components/aircraft-form'

export const Route = createFileRoute('/aircraft/$id/edit')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Aircraft" />
  ),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const aircraftId = Number(id)
  const aircraftQ = useSuspenseQuery(
    trpc.aircraft.getById.queryOptions({ id: aircraftId }),
  )
  const aircraft = aircraftQ.data

  return (
    <div className="px-6 max-w-6xl mx-auto">
      <PageHeader title="Edit Aircraft" backTo="/aircraft" />
      <AircraftForm
        mode="edit"
        toEditId={aircraft.id}
        initialFormData={{
          name: aircraft.name,
          tailNumber: aircraft.tailNumber,
          serialNumber: aircraft.serialNumber ?? '',
          aircraftType: aircraft.aircraftType ?? '',
          inductionDate: aircraft.inductionDate ?? '',
          remarks: aircraft.remarks ?? '',
          status: aircraft.status ?? '',
        }}
      />
    </div>
  )
}
