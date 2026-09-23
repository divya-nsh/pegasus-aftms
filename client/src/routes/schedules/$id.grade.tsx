/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import PageCard from '@/components/layout/PageCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc } from '@/trpc'
import BasicSelect from '@/components/inputs/basic-select'
import { useAppForm } from '@/components/form/tanstack-form'
import { makeFullName } from '@/lib/utils'

export const Route = createFileRoute('/schedules/$id/grade')({
  component: RouteComponent,
})

type TRowData = {
  personnelId: number
  personnel: {
    fullName: string
  }

  gradingAttributes: {
    gradingAttributeId: number
    gradingOptionId: number
    obtainedScoreValue: number
    status: 'pending' | 'scored' | 'exempt'
  }[]

  obtainedGradeId: number
  obtainedScoreValue: number
  obtainedScorePercentage: number
}

function RouteComponent() {
  const parmas = Route.useParams()
  const { data } = useSuspenseQuery(
    trpc.schedules.getById.queryOptions({ id: Number(parmas.id) }),
  )

  const templateQ = useSuspenseQuery(
    trpc.gradingTemplate.getById.queryOptions(data.mission!.gradingTemplateId!),
  )

  const gradesOption =
    templateQ.data.gradingScale?.options.map((option) => ({
      label: option.label,
      value: option.id,
    })) ?? []

  const form = useAppForm({
    defaultValues: data.assignments.map((assignment) => {
      const rowData: TRowData = {
        personnelId: assignment.personnelId,
        personnel: {
          fullName: makeFullName(assignment.personnel),
        },
        gradingAttributes: templateQ.data.gradingTemplateAttributes.map(
          (attribute) => ({
            gradingAttributeId: attribute.id,
            gradingOptionId: 0,
            obtainedScoreValue: 0,
            status: 'pending',
          }),
        ),
        obtainedGradeId: 0,
        obtainedScoreValue: 0,
        obtainedScorePercentage: 0,
      }
      return rowData
    }),
  })

  const handleGradeChange = (
    personnelId: number,
    gradingAttributeId: number,
    gradingOptionId: number,
  ) => {
    form.setValue(personnelId, gradingAttributeId, gradingOptionId)
  }

  if (!data.mission!.gradingTemplateId) {
    throw new Error('Event Mission Has no Grading Template Configured')
  }

  return (
    <PageCard>
      <div className="px-3 pb-2 border-b">
        <p className="text-xl font-bold">Event Grading Scale</p>
      </div>
      <Table className="border" fullGridLine>
        <TableHeader>
          <TableRow className="bg-muted/80">
            <TableHead>Name</TableHead>
            {templateQ.data.gradingTemplateAttributes.map((attribute) => (
              <TableHead key={attribute.id}>
                {attribute.gradingAttribute!.name}
              </TableHead>
            ))}

            <TableHead className="text-center bg-background">
              Total Score %
            </TableHead>
            <TableHead className="text-center bg-background">Marks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.assignments!.map((participant) => (
            <TableRow key={participant.id}>
              <TableHead>
                {participant.personnel?.firstName}{' '}
                {participant.personnel?.lastName}
              </TableHead>

              {templateQ.data.gradingTemplateAttributes.map((attribute) => (
                <TableCell key={attribute.id}>
                  <BasicSelect options={gradesOption} />
                </TableCell>
              ))}

              <TableHead className="text-center bg-background">
                0 / 400
              </TableHead>
              <TableHead className="text-center bg-background">50%</TableHead>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PageCard>
  )
}
