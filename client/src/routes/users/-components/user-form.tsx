import {
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import { getErrorMessage } from '@/lib/utils'
import trpc, { trpcClient } from '@/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { z } from 'zod'

export type LinkedPersonnel = {
  id: number
  code: string | null
  firstName: string
  lastName: string | null
  personnelType: string
}

const roleEnum = z.enum(['admin', 'instructor', 'trainee'])

function createSchema(mode: 'create' | 'edit') {
  return z.object({
    username: z.string().trim().min(1, 'Required').max(60),
    password:
      mode === 'create'
        ? z.string().min(1, 'Required').trim()
        : z.string().trim(),
    isActive: z.boolean(),
    name: z.string(),
    role: roleEnum.nullable(),
  })
}

export type UserFormData = z.infer<ReturnType<typeof createSchema>>

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
  name: '',
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
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const schema = useMemo(() => createSchema(mode), [mode])

  const form = useAppForm({
    defaultValues: initialFormData,
    validators: {
      onSubmit: schema,
    },
    onSubmit: ({ value }) => mutation.mutateAsync(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (toEditId) {
        return trpcClient.users.update.mutate({
          toEditId,
          ...data,
        })
      }
      return trpcClient.users.create.mutate({
        ...data,
      })
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.users.pathFilter())
      toast.success(mode === 'create' ? 'New user created' : 'User updated')
      navigate({ to: '/users' })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const validateUsernameUnique = async ({ value }: { value: string }) => {
    try {
      const isUsernameExists = await trpcClient.users.isUsernameExists.query({
        username: value,
        excludeId: toEditId,
      })
      if (isUsernameExists) return 'Username already exists'
    } catch (error) {
      return getErrorMessage(error)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <form.AppField
        name="username"
        validators={{
          onBlurAsync: validateUsernameUnique,
          onSubmitAsync: validateUsernameUnique,
        }}
        children={(f) => (
          <f.CTextField required label="Username" autoComplete="username" />
        )}
      />
      <form.AppField
        name="password"
        children={(f) => (
          <f.CTextField
            required={mode === 'create'}
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder={
              mode === 'edit'
                ? 'Leave blank to keep current password'
                : undefined
            }
          />
        )}
      />
      <form.AppField
        name="name"
        children={(f) => <f.CTextField label="Name" />}
      />
      <form.AppField
        name="role"
        children={(f) => (
          <f.CBasicSelect
            label="Role"
            placeholder="Select role"
            options={roleOptions}
            emptyAsNull
          />
        )}
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
      <form.AppField
        name="isActive"
        children={(f) => <f.CCheckbox label="Active" />}
      />
      <div className="col-span-2 flex justify-end pt-2">
        <form.AppForm>
          <form.SubscribeButton
            label={mode === 'create' ? 'Create' : 'Update'}
          />
        </form.AppForm>
      </div>
    </div>
  )
}
