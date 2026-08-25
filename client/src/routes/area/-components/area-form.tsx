import ErrorAlert from '@/components/errors/ErrorAlert'
import TextField, { TextAreaField } from '@/components/inputs/TextField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import trpc, { trpcClient } from '@/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export type AreaFormData = {
  name: string
  description: string
  code: string
  address: string
}

export type AreaFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: AreaFormData
  onOpenChange: (open: boolean) => void
}

export default function AreaForm({
  mode,
  toEditId,
  initialFormData = defaultFormData,
  onOpenChange,
}: AreaFormProps) {
  const [formState, setFormState] = useState(initialFormData)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: AreaFormData) => {
      if (toEditId) {
        return trpcClient.areas.update.mutate({
          ...data,
          toEditId,
        })
      } else {
        return trpcClient.areas.create.mutate(data)
      }
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.areas.pathFilter())
      toast.add({
        type: 'success',
        title: 'Area Saved Successfully',
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to Save Area',
        description: error.message,
      })
    },
  })

  const updateFormState = (newState: Partial<AreaFormData>) => {
    setFormState((prev) => ({ ...prev, ...newState }))
  }

  const title = mode === 'create' ? 'Create New Area' : 'Edit Area'

  return (
    <Dialog
      open={true}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="">
          <DialogTitle className=" uppercase">{title}</DialogTitle>
        </DialogHeader>
        <hr className="-mt-3" />
        <ErrorAlert error={mutation.error} />
        <form
          className="grid gap-4 -mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate(formState)
          }}
        >
          <TextField
            required
            label="Area Code*"
            placeholder="Must be unique and no spaces"
            value={formState.code}
            onValueChange={(code) =>
              updateFormState({ code: code.trim().replace(/\s+/g, '') })
            }
          />
          <TextField
            required
            minLength={3}
            label="Area Name*"
            value={formState.name}
            onValueChange={(name) => updateFormState({ name })}
          />
          <TextAreaField
            label="Address"
            placeholder="Enter optional address"
            value={formState.address}
            onValueChange={(address) => updateFormState({ address })}
          />
          <TextAreaField
            label="Note / Description"
            placeholder="Enter Optional Note or description"
            value={formState.description}
            onValueChange={(note) => updateFormState({ description: note })}
          />
        </form>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" />}
            autoFocus={!!toEditId}
          >
            Cancel
          </DialogClose>
          <Button
            type="button"
            form="area-form"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate(formState)
            }}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const defaultFormData: AreaFormData = {
  name: '',
  description: '',
  code: '',
  address: '',
}
