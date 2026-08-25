import ErrorAlert from '@/components/errors/ErrorAlert'
import TextField, { BasicSelectField } from '@/components/inputs/TextField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import LinkButton from '@/components/ui/link-button'
import { toast } from '@/components/ui/toast'
import trpc, { trpcClient } from '@/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export type UserRole = 'trainee' | 'instructor' | 'admin'

export type LinkedPersonnel = {
  id: number
  code: string | null
  firstName: string
  lastName: string | null
  personnelType: string
}

export type UserFormData = {
  username: string
  password: string
  isActive: boolean
  role: UserRole | null
  name: string | null
}

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Trainee', value: 'trainee' },
]

function personnelLabel(person: LinkedPersonnel) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ')
  const details = [person.code, person.personnelType]
    .filter(Boolean)
    .join(' · ')
  if (name && details) return `${name} (${details})`
  return name || details || `Personnel #${person.id}`
}

export const defaultUserFormData: UserFormData = {
  username: '',
  password: '',
  isActive: true,
  role: null,
  name: null,
}

export default function UserForm({
  mode,
  toEditId,
  initialFormData = defaultUserFormData,
  linkedPersonnel,
}: {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: UserFormData
  linkedPersonnel?: LinkedPersonnel | null
}) {
  const [formState, setFormState] = useState(initialFormData)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (data: UserFormData) => {
      if (toEditId) {
        return trpcClient.users.update.mutate({
          toEditId,
          username: data.username,
          isActive: data.isActive,
          password: data.password.trim() || undefined,
          name: data.name?.trim() || null,
          role: data.role,
        })
      }
      return trpcClient.users.create.mutate({
        username: data.username,
        password: data.password,
        isActive: data.isActive,
        name: data.name?.trim() || null,
        role: data.role,
      })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.users.pathFilter())
      toast.add({
        type: 'success',
        title:
          mode === 'create'
            ? 'User Created Successfully'
            : 'User Updated Successfully',
      })
      navigate({ to: '/users' })
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to Save User',
        description: error.message,
      })
    },
  })

  const updateFormState = (newState: Partial<UserFormData>) => {
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
          label="Username*"
          autoComplete="username"
          value={formState.username}
          onValueChange={(username) => updateFormState({ username })}
        />

        <TextField
          required={mode === 'create'}
          label={mode === 'create' ? 'Password*' : 'Password'}
          type="password"
          autoComplete="new-password"
          placeholder={
            mode === 'edit' ? 'Leave blank to keep current password' : undefined
          }
          value={formState.password}
          onValueChange={(password) => updateFormState({ password })}
        />
        <TextField
          label="Name"
          value={formState.name ?? ''}
          onValueChange={(name) => updateFormState({ name: name || null })}
        />
        <BasicSelectField
          label="Role"
          placeholder="Select role"
          value={formState.role ?? ''}
          options={roleOptions}
          onValueChange={(role) =>
            updateFormState({
              role: role ? (String(role) as UserRole) : null,
            })
          }
        />
        {linkedPersonnel && (
          <div className="col-span-2">
            <Link
              to="/personnel/$id/edit"
              params={{ id: String(linkedPersonnel.id) }}
              className="text-sm text-blue-500"
            >
              View linked personnel: {personnelLabel(linkedPersonnel)}
            </Link>
          </div>
        )}
        <div className="col-span-2 flex items-center gap-2">
          <Checkbox
            id="user-is-active"
            checked={formState.isActive}
            onCheckedChange={(checked) =>
              updateFormState({ isActive: checked })
            }
          />
          <Label htmlFor="user-is-active">Active</Label>
        </div>
        <div className="col-span-2 flex justify-end gap-2 pt-2">
          <LinkButton to="/users" variant="outline">
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
