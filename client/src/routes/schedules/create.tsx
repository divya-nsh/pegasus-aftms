import FullPageSpinner from '@/components/loaders/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import ScheduleForm from './-components/shedule-form'
import PageCard from '@/components/layout/PageCard'
import { z } from 'zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { trpc } from '@/trpc'
import AppCombobox from '@/components/inputs/combox2'
import { useMemo, useState } from 'react'
import ErrorAlert from '@/components/errors/ErrorAlert'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/schedules/create')({
  component: RouteComponent,
  pendingComponent: FullPageSpinner,
  validateSearch: z.object({
    missionId: z.coerce.number().optional(),
  }),
  errorComponent: ({ error }) => (
    <PageCard>
      <ErrorAlert error={error} />
    </PageCard>
  ),
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const { missionId } = Route.useSearch()
  const missionsQ = useSuspenseQuery(trpc.missions.getAll.queryOptions())
  const [selectedMission, setSelectedMission] = useState<{
    label: string
    value: number
  } | null>(null)

  const mission = missionsQ.data.items.find(
    (item) => item.id === (missionId || selectedMission?.value),
  )

  const options = useMemo(() => {
    return missionsQ.data.items.map((item) => ({
      label: `${item.name} (type: ${item.missionType}, ${item.durationMinutes} min)`,
      value: item.id,
    }))
  }, [missionsQ.data.items])

  if (!missionId) {
    return (
      <PageCard>
        <h1 className="text-lg font-bold border-b pb-1 mb-4">
          Create Schedule
        </h1>
        <div className="space-y-2">
          <AppCombobox
            autoFocus
            placeholder="Select Event to Schedule"
            value={selectedMission}
            items={options}
            onValueChange={setSelectedMission}
          />
          <p className="text-sm text-muted-foreground">
            Selected Event will be locked once schedule is created can't be
            changed.
          </p>
          <Button
            disabled={!selectedMission}
            onClick={async () => {
              if (!mission?.gradingTemplateId) {
                alert(
                  'Event has no grading template, please configure one first',
                )
                return
              }
              if (selectedMission) {
                navigate({
                  search: (prev) => ({
                    ...prev,
                    missionId: selectedMission.value,
                  }),
                  replace: true,
                })
              }
            }}
          >
            Next
          </Button>
        </div>
      </PageCard>
    )
  }

  if (missionId && !mission) {
    throw new Error('Invalid Event Id in URL: unable to find mission')
  }

  if (mission && !mission.gradingTemplateId) {
    throw new Error(
      `Event '${mission.name}' has no grading template, please configure one first`,
    )
  }

  return (
    <PageCard>
      <ScheduleForm
        mode="create"
        defaultValues={{
          mission: {
            label: `${mission?.name || ''} (type: ${mission?.missionType || ''})`,
            value: missionId,
            gradingTemplateId: mission?.gradingTemplateId ?? 0,
            durationMinutes: mission?.durationMinutes ?? 0,
          },
          id: null,
          status: 'draft',
          scheduleNumber: '',
          name: mission?.name ?? '',
          description: mission?.description ?? '',
          area: null,
          remarks: '',
          startDateTime: '',
          endDateTime: '',
          assignments: [],
        }}
      />
    </PageCard>
  )
}
