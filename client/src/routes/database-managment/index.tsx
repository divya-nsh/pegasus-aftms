import PageCard, {
  PageCardHeader,
  ListTitle,
  PageCardContent,
} from '@/components/layout/PageCard'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/database-managment/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageCard>
      <PageCardHeader>
        <ListTitle>Manage your database</ListTitle>
      </PageCardHeader>
      <PageCardContent>
        <Button>Backup Database</Button>
        <Button>Restore Database</Button>
      </PageCardContent>
    </PageCard>
  )
}
