import { createFileRoute } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { trpcClient } from '@/trpc'

export const Route = createFileRoute('/upload')({
  component: RouteComponent,
})

function RouteComponent() {
  const [file, setFile] = useState<File | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!file) {
        return alert('No file selected')
      }
      const formData = new FormData()
      formData.append('file', file)
      const response = await trpcClient.media.uploadFile.mutate(formData)
      return response
    },
    onSuccess: () => {
      alert('File uploaded successfully')
    },
    onError: () => {
      alert('Failed to upload file')
    },
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Upload Testing</h1>
      <div className=" space-x-6">
        <Input
          type="file"
          className=" max-w-80"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button
          className="bg-blue-500 text-white p-2 rounded-md"
          onClick={() => mutate()}
        >
          {isPending ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  )
}
