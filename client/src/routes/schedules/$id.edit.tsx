import ErrorAlert from '@/components/errors/ErrorAlert'
import PageCard from '@/components/layout/PageCard'
import FullPageSpinner from '@/components/loaders/page-loader'
import trpc from '@/trpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import ScheduleForm from './-components/shedule-form'

export const Route = createFileRoute('/schedules/$id/edit')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  // beforeLoad: ({ context, params }) => {
  //   const { isUserCan } = context.auth!
  //   if (!isUserCan('schedule', 'edit')) {
  //     throw redirect({
  //       to: '/schedules/$id/view',
  //       params: {
  //         id: params.id,
  //       },
  //     })
  //   }
  // },
  errorComponent: ({ error }) => (
    <ErrorAlert error={error} title="Failed to Load Event Schedule" />
  ),
})

export function RouteComponent() {
  const { id } = Route.useParams()

  return <EditScheduleRouteComponent id={Number(id)} />
}

export function EditScheduleRouteComponent({
  id,
  viewOnly = false,
}: {
  id: number
  viewOnly?: boolean
}) {
  const scheduleQ = useSuspenseQuery(
    trpc.schedules.getById.queryOptions({ id }),
  )
  const schedule = scheduleQ.data

  return (
    <PageCard className="space-y-6">
      <ScheduleForm
        mode={viewOnly ? 'view' : 'edit'}
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
          assignments: schedule.assignments.map((assignment) => ({
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
