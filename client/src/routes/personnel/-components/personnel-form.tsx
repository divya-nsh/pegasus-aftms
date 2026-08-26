import ErrorAlert from '@/components/errors/ErrorAlert'
import ProfilePhotoUpload from '@/components/inputs/profile-photo-upload'
import TextField, {
  BasicSelectField,
  TextAreaField,
} from '@/components/inputs/TextField'
import { Button } from '@/components/ui/button'
import LinkButton from '@/components/ui/link-button'
import trpc, { trpcClient } from '@/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'

export type PersonnelType = 'pilot' | 'trainee' | 'instructor'
export type Gender = 'male' | 'female' | 'other'
export type MedicalStatus = 'fit' | 'unfit' | 'pending'

export type PersonnelFormData = {
  personnelType: PersonnelType | ''
  batchNo: string
  code: string
  firstName: string
  lastName: string
  gender: Gender | ''
  dateOfBirth: string
  dateOfJoin: string
  rank: string
  phone: string
  email: string
  address: string
  medicalStatus: MedicalStatus
  medicalExamDate: string
  medicalValidUntil: string
  imageId: number | null
  userId?: number | null
  isCreateUser?: boolean
  newUserUsername?: string
  newUserPassword?: string
  user?: {
    username: string
  }
}

export const defaultPersonnelFormData: PersonnelFormData = {
  personnelType: '',
  batchNo: '',
  code: '',
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  dateOfJoin: '',
  rank: '',
  phone: '',
  email: '',
  address: '',
  medicalStatus: 'pending',
  medicalExamDate: '',
  medicalValidUntil: '',
  imageId: null,
}

export const MEDICAL_STATUS_LABELS: Record<MedicalStatus, string> = {
  fit: 'Fit',
  unfit: 'Unfit',
  pending: 'Awaiting for review',
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
      return 'Medical Expired'
    }
    return MEDICAL_STATUS_LABELS.fit
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return MEDICAL_STATUS_LABELS[person.medicalStatus] ?? person.medicalStatus
}

const personnelTypeOptions = [
  { label: 'Pilot', value: 'pilot' },
  { label: 'Trainee', value: 'trainee' },
  { label: 'Instructor', value: 'instructor' },
]

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]

const medicalStatusOptions = [
  { label: MEDICAL_STATUS_LABELS.fit, value: 'fit' },
  { label: MEDICAL_STATUS_LABELS.unfit, value: 'unfit' },
  { label: MEDICAL_STATUS_LABELS.pending, value: 'pending' },
]

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
}: {
  mode: 'create' | 'edit' | 'view'
  toEditId?: number
  initialFormData?: PersonnelFormData
  viewMode?: 'profile'
}) {
  const [formState, setFormState] = useState(initialFormData)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (data: PersonnelFormData) => {
      const payload = {
        ...data,
        personnelType: data.personnelType as PersonnelType,
        gender: data.gender as Gender,
        medicalStatus: data.medicalStatus,
      }

      if (toEditId) {
        return trpcClient.personnel.update.mutate({
          ...payload,
          toEditId,
        })
      }
      return trpcClient.personnel.create.mutate(payload)
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

  const updateFormState = (newState: Partial<PersonnelFormData>) => {
    if (mode === 'view') return
    setFormState((prev) => ({ ...prev, ...newState }))
  }

  const isReadOnly = mode === 'view'

  return (
    <>
      <ErrorAlert error={mutation.error} />
      <form
        className="space-y-8 pb-6"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate(formState)
        }}
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase border-b pb-1">
            Identity
          </h2>
          <div className="flex items-start gap-8">
            <div className={cn('grid gap-6 flex-1', 'grid-cols-2')}>
              <div className="col-span-2">
                <BasicSelectField
                  readOnly={isReadOnly}
                  label="Personnel Type*"
                  className=" max-w-82"
                  placeholder="Select personnel type"
                  value={formState.personnelType}
                  options={personnelTypeOptions}
                  onValueChange={(personnelType) =>
                    updateFormState({
                      personnelType: String(personnelType ?? '') as
                        PersonnelType | '',
                    })
                  }
                />
              </div>

              <TextField
                readOnly={isReadOnly}
                required
                label="First Name*"
                value={formState.firstName}
                onValueChange={(firstName) => updateFormState({ firstName })}
              />

              <TextField
                readOnly={isReadOnly}
                label="Last Name"
                value={formState.lastName}
                onValueChange={(lastName) => updateFormState({ lastName })}
              />

              <BasicSelectField
                readOnly={isReadOnly}
                label="Gender*"
                placeholder="Select gender"
                value={formState.gender}
                options={genderOptions}
                onValueChange={(gender) =>
                  updateFormState({
                    gender: String(gender ?? '') as Gender | '',
                  })
                }
              />

              <TextField
                readOnly={isReadOnly}
                label="Date of Birth"
                type="date"
                value={formState.dateOfBirth}
                onValueChange={(dateOfBirth) =>
                  updateFormState({ dateOfBirth })
                }
              />
            </div>
            <ProfilePhotoUpload
              className="row-span-2 h-40 w-50"
              value={formState.imageId}
              onValueChange={(imageId) => updateFormState({ imageId })}
            />
          </div>
        </section>

        <FormSection title="Service details">
          <TextField
            label="Personnel ID"
            value={formState.code}
            onValueChange={(code) => updateFormState({ code })}
          />
          <TextField
            label="Batch No"
            value={formState.batchNo}
            onValueChange={(batchNo) => updateFormState({ batchNo })}
          />
          <TextField
            label="Rank"
            value={formState.rank}
            onValueChange={(rank) => updateFormState({ rank })}
          />
          <TextField
            label="Date of Joining"
            type="date"
            value={formState.dateOfJoin}
            onValueChange={(dateOfJoin) => updateFormState({ dateOfJoin })}
          />
        </FormSection>

        <FormSection title="Contact">
          <TextField
            label="Phone Number"
            value={formState.phone}
            onValueChange={(phone) => updateFormState({ phone })}
          />
          <TextField
            required={!!formState.isCreateUser}
            label={formState.isCreateUser ? 'Email*' : 'Email'}
            type="email"
            value={formState.email}
            onValueChange={(email) => updateFormState({ email })}
          />
          <TextAreaField
            className="col-span-3"
            label="Address"
            value={formState.address}
            onValueChange={(address) => updateFormState({ address })}
          />
        </FormSection>

        <FormSection title="Medical">
          <BasicSelectField
            readOnly={isReadOnly}
            label="Medical Status"
            placeholder="Select medical status"
            value={formState.medicalStatus}
            options={medicalStatusOptions}
            onValueChange={(medicalStatus) =>
              updateFormState({
                medicalStatus: String(
                  medicalStatus ?? 'pending',
                ) as MedicalStatus,
              })
            }
          />
          <TextField
            readOnly={isReadOnly}
            label="Medical Exam Date"
            type="date"
            value={formState.medicalExamDate}
            onValueChange={(medicalExamDate) =>
              updateFormState({ medicalExamDate })
            }
          />
          <TextField
            readOnly={isReadOnly}
            label="Medical Valid Until"
            type="date"
            value={formState.medicalValidUntil}
            onValueChange={(medicalValidUntil) =>
              updateFormState({ medicalValidUntil })
            }
          />
        </FormSection>

        <FormSection title="User Configuration" columns={1}>
          {formState.userId ? (
            ''
          ) : (
            <div className="flex items-center gap-4 px-2">
              <Checkbox
                id="create-user-account"
                checked={!!formState.isCreateUser}
                onCheckedChange={(checked) =>
                  updateFormState({ isCreateUser: checked === true })
                }
              />
              <Label htmlFor="create-user-account">Create User Account</Label>
            </div>
          )}

          {!formState.userId && formState.isCreateUser && (
            <>
              <TextField
                readOnly={isReadOnly}
                required
                label="Username*"
                placeholder="Enter username for user account"
                value={formState.newUserUsername ?? ''}
                onValueChange={(username) =>
                  updateFormState({ newUserUsername: username })
                }
              />
              <TextField
                readOnly={isReadOnly}
                required
                label="Password*"
                type="password"
                placeholder="Enter password for user account"
                value={formState.newUserPassword ?? ''}
                onValueChange={(password) =>
                  updateFormState({ newUserPassword: password })
                }
              />
            </>
          )}
          {formState.userId && (
            <Link
              to="/users/$id/edit"
              params={{ id: String(formState.userId) }}
              className="text-sm text-blue-500"
            >
              MANAGE USER (Username: {formState.user?.username})
            </Link>
          )}
        </FormSection>

        {mode !== 'view' && (
          <div className="flex justify-end gap-2 pt-2">
            <LinkButton to="/personnel" variant="outline">
              Cancel
            </LinkButton>
            <Button type="submit" disabled={mutation.isPending}>
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        )}
      </form>
    </>
  )
}
