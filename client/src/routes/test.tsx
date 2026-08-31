import { BasicSelectField } from '@/components/inputs/TextField'
import { Button } from '@/components/ui/button'
import { trpcClient } from '@/trpc'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export const Route = createFileRoute('/test')({
  component: RouteComponent,
})

function RouteComponent() {
  const [startedAt, setStartedAt] = useState(0)
  const [fn, setfn] = useState(0)

  const { mutate, isPending } = useMutation({
    onMutate: () => {
      setStartedAt(Date.now())
    },
    mutationFn: async () => {
      if (fn === 0) {
        await trpcClient.hello.query()
      } else if (fn === 1) {
        await trpcClient.users.getAll.query()
      } else if (fn === 2) {
        await trpcClient.schedules.getAll.query()
      } else if (fn === 3) {
        // Using Native Fetch to test the performance of the API
        await fetch('/api/trpc/users.getAll').then((res) => res.json())
      }
    },
    onSuccess: (data) => {
      console.log(data)
      toast.success(`Test completed in ${Date.now() - startedAt}ms`)
    },
    onSettled: () => {
      setStartedAt(0)
    },
  })

  return (
    <div className="text-2xl font-bold p-8">
      <BasicSelectField
        label="Level"
        options={[
          { label: 'Hello', value: '0' },
          { label: 'Users', value: '1' },
          { label: 'Schedules', value: '2' },
          { label: 'Native Fetch', value: '3' },
        ]}
        value={fn.toString()}
        onValueChange={(value) => setfn(Number(value))}
      />
      <Button disabled={isPending} onClick={() => mutate()}>
        {isPending ? 'Testing...' : 'Test'}
      </Button>
    </div>
  )
}
