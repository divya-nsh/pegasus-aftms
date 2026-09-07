import ErrorAlert from '@/components/errors/ErrorAlert'
import ProfilePhotoUpload from '@/components/inputs/profile-photo-upload'
import LinkButton from '@/components/ui/link-button'
import trpc, { trpcClient } from '@/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { cn, getErrorMessage } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import {
  genderOptions,
  medicalStatusOptions,
  personnelTypeOptions,
} from './options'
import {
  handleSubmitInvalid,
  useAppForm,
} from '@/components/form/tanstack-form'
import { revalidateLogic } from '@tanstack/react-form'
import { pilotQualificationOptions } from '@repo/shared'

export type PersonnelType = 'pilot' | 'trainee' | 'instructor'
export type Gender = 'male' | 'female' | 'other'
export type MedicalStatus = 'fit' | 'unfit' | 'pending'

export type PersonnelFormData = z.infer<typeof schema>

export type LinkedUser = {
  id: number
  username: string
}

export const defaultPersonnelFormData: PersonnelFormData = {
  personnelType: '' as PersonnelType,
  batchNo: '',
  code: '',
  firstName: '',
  lastName: '',
  gender: '' as Gender,
  dateOfBirth: '',
  // Defaul to Today Date In Local Timezone
  dateOfJoin: new Date().toISOString().slice(0, 10),
  rank: '',
  qualification: '',
  phone: '',
  email: '',
  address: '',
  medicalStatus: '' as MedicalStatus,
  medicalExamDate: '',
  medicalValidUntil: '',
  imageId: null,
  isCreateUser: false,
  newUserUsername: '',
  newUserPassword: '',
}

function toDateOnly(value: Date | string | null | undefined) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

export function getMedicalDisplayStatus(person: {
  medicalStatus: MedicalStatus
  medicalValidUntil?: string | Date | null
}) {
  if (person.medicalStatus === 'fit') {
    const validUntil = toDateOnly(person.medicalValidUntil)
    const today = toDateOnly(new Date())
    if (validUntil && validUntil < today) {
      return 'Expired'
    }
    return (
      medicalStatusOptions.find(
        (option) => option.value === person.medicalStatus,
      )?.label ?? person.medicalStatus
    )
  }

  return (
    medicalStatusOptions.find((option) => option.value === person.medicalStatus)
      ?.label ?? person.medicalStatus
  )
}

const schema = z
  .object({
    personnelType: z.enum(
      personnelTypeOptions.map((option) => option.value),
      'Required',
    ),
    batchNo: z.string(),
    code: z.string().min(1, 'Required'),
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    gender: z.enum(
      genderOptions.map((option) => option.value),
      'Required',
    ),
    dateOfBirth: z.string().min(1, 'Required'),
    dateOfJoin: z.string().min(1, 'Required'),
    rank: z.string().min(1, 'Required'),
    phone: z.string().min(1, 'Required'),
    email: z.union([z.literal(''), z.email('Invalid email')]),
    address: z.string().min(1, 'Required'),
    medicalStatus: z.enum(
      medicalStatusOptions.map((option) => option.value),
      'Required',
    ),
    medicalExamDate: z.string().min(1, 'Required'),
    medicalValidUntil: z.string().min(1, 'Required'),
    imageId: z.number().nullable().optional(),
    isCreateUser: z.boolean().optional(),
    newUserUsername: z.string().optional(),
    newUserPassword: z.string().optional(),
    qualification: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.isCreateUser) return

    if (!data.email.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Required',
        path: ['email'],
      })
    }
    if (!data.newUserUsername?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Required',
        path: ['newUserUsername'],
      })
    }
    if (!data.newUserPassword?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Required',
        path: ['newUserPassword'],
      })
    }
  })

function FormSection({
  title,
  columns = 3,
  children,
}: {
  title: string
  columns?: 3 | 4 | 1
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase border-b pb-1">
        {title}
      </h2>
      <div
        className={cn('grid gap-6')}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {children}
      </div>
    </section>
  )
}

export default function PersonnelForm({
  mode,
  toEditId,
  initialFormData = defaultPersonnelFormData,
  linkedUser,
}: {
  mode: 'create' | 'edit' | 'view'
  toEditId?: number
  initialFormData?: PersonnelFormData
  linkedUser?: LinkedUser | null
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const form = useAppForm({
    defaultValues: { ...defaultPersonnelFormData, ...initialFormData },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
    },
    onSubmit: ({ value }) => mutation.mutateAsync(value),
    onSubmitInvalid: handleSubmitInvalid,
  })

  const mutation = useMutation({
    mutationFn: (data: PersonnelFormData) => {
      if (toEditId) {
        return trpcClient.personnel.update.mutate({
          ...data,
          toEditId,
        })
      }
      return trpcClient.personnel.create.mutate(data)
    },
    onSuccess: () => {
      queryClient.resetQueries(trpc.personnel.pathFilter())
      queryClient.refetchQueries(trpc.users.pathFilter())
      toast.success(
        mode === 'create'
          ? 'Personnel Created Successfully'
          : 'Personnel Updated Successfully',
      )
      navigate({ to: '/personnel' })
    },
    onError: (error) => {
      toast.error('Failed to Save Personnel')
      toast.error(error.message)
    },
  })

  const isReadOnly = mode === 'view'

  const validateUsernameUnique = async ({
    value,
  }: {
    value: string | undefined
  }) => {
    if (!value?.trim()) return
    try {
      const isUsernameExists = await trpcClient.users.isUsernameExists.query({
        username: value,
      })
      if (isUsernameExists) return 'Username already exists'
    } catch (error) {
      return getErrorMessage(error)
    }
  }

  return (
    <>
      <ErrorAlert error={mutation.error} />
      <div className="space-y-8 pb-6">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase border-b pb-1">
            Identity
          </h2>
          <div className="flex items-start gap-8">
            <div className={cn('grid gap-6 flex-1', 'grid-cols-2')}>
              <div className="col-span-2">
                <form.AppField
                  name="personnelType"
                  children={(f) => (
                    <f.CBasicSelect
                      readOnly={isReadOnly}
                      label="Personnel Type"
                      required
                      className=" max-w-82"
                      placeholder="Select personnel type"
                      options={[...personnelTypeOptions]}
                    />
                  )}
                />
              </div>

              <form.AppField
                name="firstName"
                children={(f) => (
                  <f.CTextField
                    label="First Name"
                    required
                    readOnly={isReadOnly}
                  />
                )}
              />

              <form.AppField
                name="lastName"
                children={(f) => (
                  <f.CTextField
                    label="Last Name"
                    required
                    readOnly={isReadOnly}
                  />
                )}
              />

              <form.AppField
                name="gender"
                children={(f) => (
                  <f.CBasicSelect
                    readOnly={isReadOnly}
                    required
                    label="Gender"
                    placeholder="Select gender"
                    options={[...genderOptions]}
                  />
                )}
              />

              <form.AppField
                name="dateOfBirth"
                children={(f) => (
                  <f.CTextField
                    label="Date of Birth"
                    type="date"
                    readOnly={isReadOnly}
                    required
                  />
                )}
              />
            </div>

            <form.Field
              name="imageId"
              children={(f) => (
                <ProfilePhotoUpload
                  className="row-span-2 h-40 w-50"
                  value={f.state.value ?? null}
                  onValueChange={f.handleChange}
                  errors={f.state.meta.errors}
                  disabled={isReadOnly}
                />
              )}
            />
          </div>
        </section>

        <FormSection title="Service details">
          <form.AppField
            name="code"
            children={(f) => (
              <f.CTextField
                label="Civil/Service Id"
                required
                readOnly={isReadOnly}
              />
            )}
          />
          <form.AppField
            name="batchNo"
            children={(f) => (
              <f.CTextField label="Batch No" readOnly={isReadOnly} />
            )}
          />
          <form.AppField
            name="rank"
            children={(f) => (
              <f.CTextField label="Rank" required readOnly={isReadOnly} />
            )}
          />
          <form.AppField
            name="qualification"
            children={(f) => (
              <f.CBasicSelect
                readOnly={isReadOnly}
                label="Qualification"
                placeholder="Select qualification"
                options={[...pilotQualificationOptions]}
              />
            )}
          />
          <form.AppField
            name="dateOfJoin"
            children={(f) => (
              <f.CTextField
                label="Date of Joining"
                type="date"
                required
                readOnly={isReadOnly}
              />
            )}
          />
        </FormSection>

        <FormSection title="Contact">
          <form.AppField
            name="phone"
            children={(f) => (
              <f.CTextField
                label="Phone Number"
                required
                readOnly={isReadOnly}
              />
            )}
          />
          <form.Subscribe selector={(state) => state.values.isCreateUser}>
            {(isCreateUser) => (
              <form.AppField
                name="email"
                children={(f) => (
                  <f.CTextField
                    required={!!isCreateUser}
                    label="Email"
                    type="email"
                    readOnly={isReadOnly}
                  />
                )}
              />
            )}
          </form.Subscribe>
          <form.AppField
            name="address"
            children={(f) => (
              <f.CTextAreaField
                className="col-span-3"
                label="Address"
                required
                readOnly={isReadOnly}
              />
            )}
          />
        </FormSection>

        <FormSection title="Medical">
          <form.AppField
            name="medicalStatus"
            children={(f) => (
              <f.CBasicSelect
                readOnly={isReadOnly}
                required
                label="Medical Status"
                placeholder="Select medical status"
                options={[...medicalStatusOptions]}
              />
            )}
          />
          <form.AppField
            name="medicalExamDate"
            children={(f) => (
              <f.CTextField
                readOnly={isReadOnly}
                label="Medical Exam Date"
                type="date"
                required
              />
            )}
          />
          <form.AppField
            name="medicalValidUntil"
            children={(f) => (
              <f.CTextField
                readOnly={isReadOnly}
                label="Medical Valid Until"
                type="date"
                required
              />
            )}
          />
        </FormSection>

        <FormSection title="User Configuration" columns={1}>
          {linkedUser ? (
            <Link
              to="/users/$id/edit"
              params={{ id: String(linkedUser.id) }}
              className="text-sm text-blue-500"
            >
              MANAGE USER (Username: {linkedUser.username})
            </Link>
          ) : !isReadOnly ? (
            <>
              <form.AppField
                name="isCreateUser"
                children={(f) => <f.CCheckbox label="Create User Account" />}
              />
              <form.Subscribe selector={(state) => state.values.isCreateUser}>
                {(isCreateUser) =>
                  isCreateUser ? (
                    <>
                      <form.AppField
                        name="newUserUsername"
                        validators={{
                          onBlurAsync: validateUsernameUnique,
                        }}
                        children={(f) => (
                          <f.CTextField
                            readOnly={isReadOnly}
                            required
                            label="Username"
                            placeholder="Enter username for user account"
                          />
                        )}
                      />
                      <form.AppField
                        name="newUserPassword"
                        children={(f) => (
                          <f.CTextField
                            readOnly={isReadOnly}
                            required
                            label="Password"
                            placeholder="Enter password for user account"
                          />
                        )}
                      />
                    </>
                  ) : null
                }
              </form.Subscribe>
            </>
          ) : null}
        </FormSection>

        {mode !== 'view' && (
          <div className="flex justify-end gap-2 pt-2">
            <LinkButton to="/personnel" variant="outline">
              Cancel
            </LinkButton>
            <form.AppForm>
              <form.SubscribeButton
                label={mode === 'create' ? 'Create' : 'Save'}
              />
            </form.AppForm>
          </div>
        )}
      </div>
    </>
  )
}
