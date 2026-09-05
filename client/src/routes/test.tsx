import { useAppForm } from '@/components/form/tanstack-form'
import { ActionMenu } from '@/components/table/action-menu'
import { Button } from '@/components/ui/button'
import {
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Sheet,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import { PencilIcon, TrashIcon, UserIcon } from 'lucide-react'

export const Route = createFileRoute('/test')({
  component: RouteComponent,
})

type MedicalResult = 'fit' | 'unfit' | 'pending'

const dummyMedicalRecords: Array<{
  id: number
  examDate: string
  result: MedicalResult
  validUntil: string
  remark: string
}> = [
  {
    id: 1,
    examDate: '2026-01-15',
    result: 'fit',
    validUntil: '2027-01-14',
    remark: 'Annual aircrew medical cleared. No restrictions.',
  },
  {
    id: 2,
    examDate: '2025-07-02',
    result: 'pending',
    validUntil: '2025-08-02',
    remark: 'Awaiting specialist review of vision test.',
  },
  {
    id: 3,
    examDate: '2025-01-10',
    result: 'unfit',
    validUntil: '2025-02-10',
    remark: 'Temporarily grounded — follow-up required.',
  },
  {
    id: 4,
    examDate: '2024-01-12',
    result: 'fit',
    validUntil: '2025-01-11',
    remark: 'Fit to fly. Minor refractive correction noted.',
  },
]

const resultStyles: Record<MedicalResult, string> = {
  fit: 'bg-emerald-100 text-emerald-800',
  unfit: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
}

const examQualificationNames = [
  'Wingman',
  'Section Lead',
  'Division Lead',
  'Strike Lead',
  'Instructor',
  'Weapon',
  'Functional Check Pilot',
  'NVG High',
  'NVG Low',
] as const

type ExamQualificationName = (typeof examQualificationNames)[number]

const dummyQualifications: Array<{
  id: number
  qualification: ExamQualificationName
  issueDate: string | null
  remark: string
}> = [
  {
    id: 1,
    qualification: 'Wingman',
    issueDate: '2022-03-18',
    remark: 'Initial combat-ready qualification.',
  },
  {
    id: 2,
    qualification: 'Instructor',
    issueDate: null,
    remark: 'Issue date not on file.',
  },
]

type PilotStatus = 'active' | 'grounded' | 'left_training'

const pilotStatusLabels: Record<PilotStatus, string> = {
  active: 'Active',
  grounded: 'Grounded',
  left_training: 'Left Training',
}

const pilotStatusStyles: Record<PilotStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  grounded: 'bg-red-100 text-red-800',
  left_training: 'bg-slate-200 text-slate-700',
}

const dummyPilotStatus: PilotStatus = 'active'

function RouteComponent() {
  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-full space-y-4">
      <div className="flex items-center gap-3 pl-2">
        <h1 className="text-xl font-bold tracking-wide">Pilot Profile</h1>
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            pilotStatusStyles[dummyPilotStatus],
          )}
        >
          {pilotStatusLabels[dummyPilotStatus]}
        </span>
      </div>

      {/* Basic Information */}
      <section className="bg-card rounded-md shadown-sm border">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h3 className="font-semibold text-sm tracking-wide">
            Basic Information
          </h3>
          <EditBasicInfoSheet>
            <button
              type="button"
              className=" uppercase text-sm text-primary hover:underline active:translate-y-0.5 transition-transform duration-100"
            >
              Edit
            </button>
          </EditBasicInfoSheet>
        </div>

        <div className="flex items-start gap-6 px-4 py-5 pb-6">
          <div className="grid flex-1 gap-5 grid-cols-3">
            <KeyValuePair label="Personnel Type" value="Pilot" />
            <KeyValuePair label="Full Name" value="Divyansh Soni" />
            <KeyValuePair label="Service ID" value="1234567890" />
            <KeyValuePair label="Date of Birth" value="12/01/1990" />
            <KeyValuePair label="Gender" value="Male" />
            <KeyValuePair label="Date of Joining" value="12/01/2020" />
            <KeyValuePair label="Unit / Squadron" value="1234567890" />
            <KeyValuePair label="Rank" value="Captain" />
            <KeyValuePair label="Phone Number" value="+91 9876543210" />
            <KeyValuePair label="Email" value="divyansh@gmail.com" />
            <KeyValuePair
              label="Address"
              value="123, Main Street, Anytown, USA"
            />
            <KeyValuePair label="Fitness Status" value="Fit" />
          </div>

          <div className="flex h-40 w-36 shrink-0 flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 text-muted-foreground">
            <UserIcon className="h-10 w-10" />
            <span className="text-xs">Profile photo</span>
          </div>
        </div>
      </section>

      {/* Basic Information — form fields (compare with key/value above) */}
      {/* <section className="bg-card rounded-md shadown-sm border">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h3 className="font-semibold text-sm tracking-wide">
            Basic Information (Form Fields)
          </h3>
          <div className="text-sm text-blue-500 cursor-pointer">Edit</div>
        </div>

        <div className="flex items-start gap-6 px-4 py-5">
          <div className="grid flex-1 gap-5 grid-cols-3">
            <TextField readOnly label="Personnel Type" value="Pilot" />
            <TextField readOnly label="Full Name" value="Divyansh Soni" />
            <TextField readOnly label="Service ID" value="1234567890" />
            <TextField readOnly label="Date of Birth" value="12/01/1990" />
            <TextField readOnly label="Gender" value="Male" />
            <TextField readOnly label="Date of Joining" value="12/01/2020" />
            <TextField readOnly label="Unit / Squadron" value="1234567890" />
            <TextField readOnly label="Rank" value="Captain" />
            <TextField readOnly label="Phone Number" value="+91 9876543210" />
            <TextField readOnly label="Email" value="divyansh@gmail.com" />
            <TextAreaField
              readOnly
              className="col-span-2"
              label="Address"
              value="123, Main Street, Anytown, USA"
            />
          </div>

          <div className="flex h-40 w-36 shrink-0 flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 text-muted-foreground">
            <UserIcon className="h-10 w-10" />
            <span className="text-xs">Profile photo</span>
          </div>
        </div>
      </section> */}

      {/* Medical Information */}
      <section className="bg-card rounded-md shadown-sm border">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h3 className="font-semibold text-sm tracking-wide">Medical</h3>
          <div className="text-sm text-blue-500 cursor-pointer">Add Record</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Exam Date</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyMedicalRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{formatDate(record.examDate)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                      resultStyles[record.result],
                    )}
                  >
                    {record.result}
                  </span>
                </TableCell>
                <TableCell>{formatDate(record.validUntil)}</TableCell>
                <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                  {record.remark}
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu actions={[]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Qualification */}
      <section className="bg-card rounded-md shadown-sm border">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h3 className="font-semibold text-sm tracking-wide">Qualification</h3>
          <div className="text-sm text-blue-500 cursor-pointer">
            Add Qualification
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Exam Qualification</TableHead>
              <TableHead>Date of Issue</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyQualifications.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  {record.qualification}
                </TableCell>
                <TableCell>
                  {record.issueDate ? formatDate(record.issueDate) : '—'}
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                  {record.remark}
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu
                    actions={[
                      {
                        label: 'Edit',
                        icon: <PencilIcon className="h-4 w-4" />,
                      },
                      {
                        label: 'Delete',
                        icon: <TrashIcon className="h-4 w-4" />,
                        isDestructive: true,
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* User Account  */}
      <section className="bg-card rounded-md shadown-sm border">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h3 className="font-semibold text-sm tracking-wide">
            User Account Information
          </h3>
          <div className="text-sm text-blue-500 cursor-pointer">Edit</div>
        </div>

        <div className="grid gap-5 grid-cols-3 px-4 py-5">
          <KeyValuePair label="Username" value="divyansh" />
          <KeyValuePair label="Email" value="divyansh@gmail.com" />
          <KeyValuePair label="Is Active" value="Yes" />
          <KeyValuePair label="Last Login At" value="12/01/2020" />
          <KeyValuePair label="Password Updated At" value="12/01/2020" />
        </div>
      </section>
    </div>
  )
}

function KeyValuePair({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('grid gap-1 text-sm', className)}>
      <span className="font-medium text-xs text-gray-700 tracking-wider">
        {label}
      </span>
      <span className=" ">{value}</span>
    </div>
  )
}

function EditBasicInfoSheet({ children }: { children: React.ReactElement }) {
  const form = useAppForm({
    defaultValues: {
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
    },
  })

  return (
    <Sheet>
      <SheetTrigger render={children} />
      <SheetContent>
        <SheetHeader className="border-b bg-muted/60">
          <SheetTitle>Edit Basic Information</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 flex-1 auto-rows-min px-4 overflow-auto">
          <form.AppField
            name="personnelType"
            children={(f) => <f.CTextField label="Personnel Type" />}
          />
          <form.AppField
            name="code"
            children={(f) => <f.CTextField label="Service ID" />}
          />
          <form.AppField
            name="firstName"
            children={(f) => <f.CTextField label="First Name" />}
          />
          <form.AppField
            name="lastName"
            children={(f) => <f.CTextField label="Last Name" />}
          />
          <form.AppField
            name="batchNo"
            children={(f) => <f.CTextField label="Batch No" />}
          />
          <form.AppField
            name="gender"
            children={(f) => <f.CTextField label="Gender" />}
          />
          <form.AppField
            name="dateOfBirth"
            children={(f) => <f.CTextField label="Date of Birth" />}
          />
          <form.AppField
            name="dateOfJoin"
            children={(f) => <f.CTextField label="Date of Joining" />}
          />
          <form.AppField
            name="rank"
            children={(f) => <f.CTextField label="Rank" />}
          />
          <div className="h-4" /> {/* spacer */}
          <form.AppField
            name="phone"
            children={(f) => <f.CTextField label="Phone Number" />}
          />
          <form.AppField
            name="email"
            children={(f) => <f.CTextField label="Email" />}
          />
          <form.AppField
            name="address"
            children={(f) => <f.CTextAreaField label="Address" />}
          />
        </div>

        <SheetFooter className="flex gap-2 justify-between flex-row border-t bg-muted/70">
          <SheetClose render={<Button variant="outline">Close</Button>} />

          <form.AppForm>
            <form.SubscribeButton />
          </form.AppForm>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
