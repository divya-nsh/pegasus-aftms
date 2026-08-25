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

export type LocationFormData = {
  name: string
  description: string
  code: string
  address: string
  phone: string
}

export type LocationFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: LocationFormData
  // onSubmit: (data: LocationFormData) => void
  onOpenChange: (open: boolean) => void
}

export default function LocationForm({
  mode,
  toEditId,
  initialFormData = defaultFormData,
  onOpenChange,
}: LocationFormProps) {
  const [formState, setFormState] = useState(initialFormData)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: LocationFormData) => {
      if (toEditId) {
        return trpcClient.locations.update.mutate({
          ...data,
          toEditId,
        })
      } else {
        return trpcClient.locations.create.mutate(data)
      }
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.locations.pathFilter())
      toast.add({
        type: 'success',
        title: 'Location Saved Successfully',
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to Save Location',
        description: error.message,
      })
    },
  })

  const updateFormState = (newState: Partial<LocationFormData>) => {
    setFormState((prev) => ({ ...prev, ...newState }))
  }

  const title = mode === 'create' ? 'Create New Location' : 'Edit Location'

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
          {/* <DialogDescription>{description}</DialogDescription> */}
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
            label="Location Code*"
            placeholder="Must be unique and no spaces"
            value={formState.code}
            onValueChange={(code) =>
              updateFormState({ code: code.trim().replace(/\s+/g, '') })
            }
          />
          <TextField
            required
            minLength={3}
            label="Location Name*"
            value={formState.name}
            onValueChange={(name) => updateFormState({ name })}
          />
          <TextField
            label="Phone"
            placeholder="Enter optional phone number"
            value={formState.phone}
            onValueChange={(phone) => updateFormState({ phone })}
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
            form="location-form"
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

const defaultFormData: LocationFormData = {
  name: '',
  description: '',
  code: '',
  address: '',
  phone: '',
}
