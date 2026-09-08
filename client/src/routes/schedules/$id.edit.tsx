import ErrorAlert from '@/components/errors/ErrorAlert'
import PageCard from '@/components/layout/PageCard'
import FullPageSpinner from '@/components/loaders/page-loader'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import ScheduleForm from './-components/shedule-form3'

export const Route = createFileRoute('/schedules/$id/edit')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Event Schedule" />
  ),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const scheduleQ = useSuspenseQuery(
    trpc.schedules.getById.queryOptions({ id: Number(id) }),
  )
  const schedule = scheduleQ.data

  return (
    <PageCard className="space-y-6">
      <ScheduleForm
        mode="edit"
        defaultValues={{
          id: schedule.id,
          name: schedule.name,
          description: schedule.description || '',
          startDateTime: schedule.startDateTime || '',
          endDateTime: schedule.endDateTime || '',
          areaId: schedule.areaId as number,
          missionId: schedule.missionId,
          status: schedule.status,
          scheduleNumber: schedule.scheduleNumber,
          remarks: schedule.remarks || '',
          assigments: schedule.assignments.map((assignment) => ({
            personnelId: assignment.personnelId,
            aircraftId: assignment.aircraftId,
            remarks: assignment.remarks || '',
            attendanceStatus: assignment.attendanceStatus,
            score: assignment.score,
            result: assignment.result,
            takeoffTime: assignment.takeoffTime,
            landingTime: assignment.landingTime,
            aircraftTime: assignment.aircraftTime,
          })),
        }}
      />
    </PageCard>
  )
}
