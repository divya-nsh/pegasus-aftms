import {
  baseFormOptions,
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogMain,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldColumns } from '@/components/ui/field'
import { getErrorMessage } from '@/lib/utils'
import trpc, { trpcClient } from '@/trpc'
import { revalidateLogic } from '@tanstack/react-form'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
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

function createSchema(mode: 'create' | 'edit') {
  return z.object({
    username: z.string().trim().min(1, 'Required').max(60),
    password:
      mode === 'create'
        ? z.string().min(1, 'Required').trim()
        : z.string().trim(),
    isActive: z.boolean(),
    name: z.string(),
    role: z.string(),
  })
}

export type UserFormData = z.infer<ReturnType<typeof createSchema>>

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
  role: '',
  name: '',
}

export type UserFormProps = {
  mode: 'create' | 'edit'
  toEditId?: number
  initialFormData?: UserFormData
  linkedPersonnel?: LinkedPersonnel | null
  onClose: (open: boolean) => void
}

export default function UserForm({
  mode,
  toEditId,
  initialFormData = defaultUserFormData,
  linkedPersonnel,
  onClose,
}: UserFormProps) {
  const queryClient = useQueryClient()
  const schema = useMemo(() => createSchema(mode), [mode])
  const rolesQuery = useSuspenseQuery(trpc.roles.getOptions.queryOptions())

  const form = useAppForm({
    ...baseFormOptions,
    defaultValues: initialFormData,
    validators: {
      onDynamic: schema,
    },
    onSubmit: ({ value }) => mutation.mutateAsync(value),
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
      onClose(false)
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
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return
        onClose(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === 'create' ? 'New User' : 'Edit User'}
          </DialogTitle>
        </DialogHeader>
        <DialogMain className="space-y-6">
          <FieldColumns cols={1}>
            <form.AppField
              name="username"
              validators={{
                onBlurAsync: validateUsernameUnique,
              }}
              children={(f) => (
                <f.CTextField
                  required
                  label="Username / UserId"
                  placeholder="Used to login to the system"
                  autoComplete="username"
                />
              )}
            />
            <form.AppField
              name="name"
              children={(f) => <f.CTextField label="Name" required />}
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
              name="role"
              children={(f) => (
                <f.CBasicSelect
                  label="Role"
                  placeholder="Select role"
                  options={rolesQuery.data}
                  emptyAsNull
                />
              )}
            />
          </FieldColumns>
          {linkedPersonnel && (
            <Link
              to="/personnel/$id/edit"
              params={{ id: String(linkedPersonnel.id) }}
              className="text-sm text-blue-500"
            >
              View linked personnel: {personnelLabel(linkedPersonnel)}
            </Link>
          )}
          <form.AppField
            name="isActive"
            children={(f) => <f.CCheckbox label="Active" />}
          />
        </DialogMain>
        <DialogFooter>
          <form.AppForm>
            <form.SubscribeButton
              label={mode === 'create' ? 'Create' : 'Save'}
            />
          </form.AppForm>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
