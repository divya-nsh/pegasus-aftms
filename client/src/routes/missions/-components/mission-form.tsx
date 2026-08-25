import ErrorAlert from '@/components/errors/ErrorAlert'
import TextField, {
  BasicSelectField,
  TextAreaField,
} from '@/components/inputs/TextField'
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
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'

export type MissionFormData = {
  name: string
  description: string
  aircraftId: string
  durationMinutes: string
}

export type MissionFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: MissionFormData
  onOpenChange: (open: boolean) => void
}

export default function MissionForm({
  mode,
  toEditId,
  initialFormData = defaultFormData,
  onOpenChange,
}: MissionFormProps) {
  const [formState, setFormState] = useState(initialFormData)
  const queryClient = useQueryClient()
  const aircraftQ = useSuspenseQuery(trpc.aircraft.getAll.queryOptions())

  const mutation = useMutation({
    mutationFn: (data: MissionFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        aircraftId: data.aircraftId ? Number(data.aircraftId) : undefined,
        durationMinutes: Number(data.durationMinutes),
      }
      if (toEditId) {
        return trpcClient.missions.update.mutate({
          ...payload,
          toEditId,
        })
      }
      return trpcClient.missions.create.mutate(payload)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.missions.pathFilter())
      toast.add({
        type: 'success',
        title: 'Mission Saved Successfully',
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to Save Mission',
        description: error.message,
      })
    },
  })

  const updateFormState = (newState: Partial<MissionFormData>) => {
    setFormState((prev) => ({ ...prev, ...newState }))
  }

  const title = mode === 'create' ? 'Create New Mission' : 'Edit Mission'

  return (
    <Dialog
      open={true}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
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
            minLength={3}
            label="Mission Name*"
            value={formState.name}
            onValueChange={(name) => updateFormState({ name })}
          />
          <TextField
            required
            type="number"
            min={1}
            label="Duration (minutes)*"
            placeholder="e.g. 60"
            value={formState.durationMinutes}
            onValueChange={(durationMinutes) =>
              updateFormState({ durationMinutes })
            }
          />
          <BasicSelectField
            label="Aircraft"
            placeholder="Select optional aircraft"
            value={formState.aircraftId}
            options={aircraftQ.data.items.map((item) => ({
              value: String(item.id),
              label: `${item.name}${item.tailNumber ? ` (${item.tailNumber})` : ''}`,
            }))}
            onValueChange={(aircraftId) =>
              updateFormState({ aircraftId: String(aircraftId ?? '') })
            }
          />
          <TextAreaField
            label="Description"
            placeholder="e.g. Fly with chopper for 1 hour in circle"
            value={formState.description}
            onValueChange={(description) => updateFormState({ description })}
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

const defaultFormData: MissionFormData = {
  name: '',
  description: '',
  aircraftId: '',
  durationMinutes: '60',
}
