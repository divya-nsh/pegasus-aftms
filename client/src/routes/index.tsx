// import trpc from '@/trpc.ts'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/trpc'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const query = useQuery(trpc.hello.queryOptions())

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      {/* <p>{query.data?.map((p) => p.name).join(', ')}</p> */}
      <p className="mt-4 text-lg">{query.data}</p>
      <Button onClick={() => query.refetch()}>Refetch</Button>
    </div>
  )
}
