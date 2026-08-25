import ErrorAlert from '@/components/errors/ErrorAlert'
import TextField, {
  BasicSelectField,
  TextAreaField,
} from '@/components/inputs/TextField'
import { Button } from '@/components/ui/button'
import LinkButton from '@/components/ui/link-button'
import { toast } from '@/components/ui/toast'
import trpc, { trpcClient } from '@/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export type AircraftFormData = {
  name: string
  tailNumber: string
  serialNumber: string
  aircraftType: string
  inductionDate: string
  remarks: string
  status: string
}

export const defaultAircraftFormData: AircraftFormData = {
  name: '',
  tailNumber: '',
  serialNumber: '',
  aircraftType: '',
  inductionDate: '',
  remarks: '',
  status: '',
}

const aircraftTypeOptions = [
  { label: 'Trainer', value: 'trainer' },
  { label: 'Fighter', value: 'fighter' },
  { label: 'Transport', value: 'transport' },
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Grounded', value: 'grounded' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'In Storage', value: 'in_storage' },
  { label: 'Retired', value: 'retired' },
]

export default function AircraftForm({
  mode,
  toEditId,
  initialFormData = defaultAircraftFormData,
}: {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: AircraftFormData
}) {
  const [formState, setFormState] = useState(initialFormData)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (data: AircraftFormData) => {
      if (toEditId) {
        return trpcClient.aircraft.update.mutate({
          ...data,
          toEditId,
        })
      }
      return trpcClient.aircraft.create.mutate(data)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.aircraft.pathFilter())
      toast.add({
        type: 'success',
        title:
          mode === 'create'
            ? 'Aircraft Created Successfully'
            : 'Aircraft Updated Successfully',
      })
      navigate({ to: '/aircraft' })
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to Save Aircraft',
        description: error.message,
      })
    },
  })

  const updateFormState = (newState: Partial<AircraftFormData>) => {
    setFormState((prev) => ({ ...prev, ...newState }))
  }

  return (
    <>
      <ErrorAlert error={mutation.error} />
      <form
        className="grid grid-cols-2 gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate(formState)
        }}
      >
        <TextField
          required
          label="Name*"
          value={formState.name}
          onValueChange={(name) => updateFormState({ name })}
        />
        <TextField
          required
          label="Tail Number / Call Sign*"
          value={formState.tailNumber}
          onValueChange={(tailNumber) => updateFormState({ tailNumber })}
        />
        <TextField
          label="Serial Number"
          value={formState.serialNumber}
          onValueChange={(serialNumber) => updateFormState({ serialNumber })}
        />
        <BasicSelectField
          label="Aircraft Type"
          placeholder="Select aircraft type"
          value={formState.aircraftType}
          options={aircraftTypeOptions}
          onValueChange={(aircraftType) =>
            updateFormState({ aircraftType: String(aircraftType ?? '') })
          }
        />
        <TextField
          label="Induction Date"
          type="date"
          value={formState.inductionDate}
          onValueChange={(inductionDate) => updateFormState({ inductionDate })}
        />
        <BasicSelectField
          label="Status"
          placeholder="Select status"
          value={formState.status}
          options={statusOptions}
          onValueChange={(status) =>
            updateFormState({ status: String(status ?? '') })
          }
        />
        <TextAreaField
          className="col-span-2"
          label="Remarks"
          placeholder="Enter optional remarks"
          value={formState.remarks}
          onValueChange={(remarks) => updateFormState({ remarks })}
        />
        <div className="col-span-2 flex justify-end gap-2 pt-2">
          <LinkButton to="/aircraft" variant="outline">
            Cancel
          </LinkButton>
          <Button type="submit" disabled={mutation.isPending}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      </form>
    </>
  )
}
