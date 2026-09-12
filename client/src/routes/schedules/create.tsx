import FullPageSpinner from '@/components/loaders/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import ScheduleForm from './-components/shedule-form'
import PageCard from '@/components/layout/PageCard'
import { protectRouteBeforeLoad } from '@/lib/utils'
import { z } from 'zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { trpc } from '@/trpc'

export const Route = createFileRoute('/schedules/create')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  beforeLoad: protectRouteBeforeLoad('schedule', 'create'),
  validateSearch: z.object({
    missionId: z.coerce.number().optional(),
  }),
})

function RouteComponent() {
  const { missionId } = Route.useSearch()
  const missionsQ = useSuspenseQuery(trpc.missions.getAll.queryOptions())
  const mission = missionsQ.data.items.find((item) => item.id === missionId)

  if (missionId && !mission) {
    throw new Error('Invalid Event Id in URL: unable to find mission')
  }

  return (
    <PageCard>
      <ScheduleForm
        mode="create"
        defaultValues={{
          missionId: (missionId || null) as unknown as number,
          scheduleNumber: '',
          name: mission?.name || '',
          description: mission?.description || '',
          startDateTime: '',
          endDateTime: '',
          remarks: '',
          assignments: [],
          areaId: null as unknown as number,
          status: 'draft',
        }}
      />
    </PageCard>
  )
}
