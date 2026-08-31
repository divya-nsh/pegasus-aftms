// import { BasicSelectField, ComboboxField } from '@/components/inputs/TextField'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table'
// import { TrashIcon } from 'lucide-react'

// export type TraineeOption = {
//   id: number
//   firstName: string
//   lastName: string | null
//   code: string | null
//   rank: string | null
//   personnelType: string
//   batchNo: string | null
// }

// export type LineRow = {
//   personId: number
//   attendanceStatus: 'pending' | 'present' | 'absent' | 'excused'
//   score: string
//   result: 'pending' | 'passed' | 'failed'
//   remarks: string
// }

// export function personName(person: {
//   firstName?: string | null
//   lastName?: string | null
// }) {
//   return [person.firstName, person.lastName].filter(Boolean).join(' ')
// }

// export function emptyLineRow(personId: number): LineRow {
//   return {
//     personId,
//     attendanceStatus: 'pending',
//     score: '',
//     result: 'pending',
//     remarks: '',
//   }
// }

// const attendanceOptions = [
//   { label: 'Pending', value: 'pending' },
//   { label: 'Present', value: 'present' },
//   { label: 'Absent', value: 'absent' },
//   { label: 'Excused', value: 'excused' },
// ]

// const resultOptions = [
//   { label: 'Pending', value: 'pending' },
//   { label: 'Passed', value: 'passed' },
//   { label: 'Failed', value: 'failed' },
// ]

// export default function TraineePicker({
//   trainees,
//   rows,
//   onRowsChange,
// }: {
//   trainees: TraineeOption[]
//   rows: LineRow[]
//   onRowsChange: (rows: LineRow[]) => void
// }) {
//   const selectedIds = rows.map((row) => row.personId)
//   const available = trainees.filter(
//     (person) => !selectedIds.includes(person.id),
//   )

//   const updateRow = (personId: number, patch: Partial<LineRow>) => {
//     onRowsChange(
//       rows.map((row) =>
//         row.personId === personId ? { ...row, ...patch } : row,
//       ),
//     )
//   }

//   return (
//     <div className="space-y-3">
//       <div className="flex items-end justify-between gap-4">
//         <div>
//           <h2 className="text-sm font-semibold">Trainees</h2>
//           <p className="text-sm text-muted-foreground">
//             Select a trainee to add them to the line.
//           </p>
//         </div>
//         <ComboboxField
//           className="w-72 shrink-0"
//           label="Add trainee"
//           placeholder="Select trainee"
//           disabled={available.length === 0}
//           value={null}
//           options={available.map((person) => ({
//             value: person.id,
//             label: `${personName(person)}${person.code ? ` (${person.code})` : ''}`,
//           }))}
//           onValueChange={(value) => {
//             const id = value
//             if (typeof id !== 'number') return
//             if (selectedIds.includes(id)) return
//             onRowsChange([...rows, emptyLineRow(id)])
//           }}
//         />
//       </div>

//       <div className="overflow-hidden rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-14">#</TableHead>
//               <TableHead>Code</TableHead>
//               <TableHead>Name</TableHead>
//               <TableHead>Rank</TableHead>
//               <TableHead>Attendance</TableHead>
//               <TableHead>Score</TableHead>
//               <TableHead>Result</TableHead>
//               <TableHead>Notes</TableHead>
//               <TableHead className="w-16" />
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {rows.length === 0 ? (
//               <TableRow>
//                 <TableCell
//                   colSpan={9}
//                   className="h-20 text-center text-muted-foreground"
//                 >
//                   No trainees on this line yet.
//                 </TableCell>
//               </TableRow>
//             ) : (
//               rows.map((row, index) => {
//                 const person = trainees.find((item) => item.id === row.personId)
//                 return (
//                   <TableRow key={row.personId}>
//                     <TableCell>{index + 1}</TableCell>
//                     <TableCell>{person?.code || '-'}</TableCell>
//                     <TableCell>{person ? personName(person) : '-'}</TableCell>
//                     <TableCell>{person?.rank || '-'}</TableCell>
//                     <TableCell>
//                       <Select
//                         value={row.attendanceStatus}
//                         items={attendanceOptions}
//                         onValueChange={(value) =>
//                           updateRow(row.personId, {
//                             attendanceStatus: String(
//                               value ?? 'pending',
//                             ) as LineRow['attendanceStatus'],
//                           })
//                         }
//                       >
//                         <SelectTrigger className="w-32">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent alignItemWithTrigger={false}>
//                           <SelectGroup>
//                             {attendanceOptions.map((option) => (
//                               <SelectItem
//                                 key={option.value}
//                                 value={option.value}
//                               >
//                                 {option.label}
//                               </SelectItem>
//                             ))}
//                           </SelectGroup>
//                         </SelectContent>
//                       </Select>
//                     </TableCell>
//                     <TableCell>
//                       <Input
//                         type="number"
//                         min={0}
//                         max={100}
//                         className="w-20"
//                         value={row.score}
//                         onChange={(e) =>
//                           updateRow(row.personId, { score: e.target.value })
//                         }
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Select
//                         value={row.result}
//                         items={resultOptions}
//                         onValueChange={(value) =>
//                           updateRow(row.personId, {
//                             result: String(
//                               value ?? 'pending',
//                             ) as LineRow['result'],
//                           })
//                         }
//                       >
//                         <SelectTrigger className="w-28">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent alignItemWithTrigger={false}>
//                           <SelectGroup>
//                             {resultOptions.map((option) => (
//                               <SelectItem
//                                 key={option.value}
//                                 value={option.value}
//                               >
//                                 {option.label}
//                               </SelectItem>
//                             ))}
//                           </SelectGroup>
//                         </SelectContent>
//                       </Select>
//                     </TableCell>
//                     <TableCell>
//                       <Input
//                         className="min-w-36"
//                         value={row.remarks}
//                         onChange={(e) =>
//                           updateRow(row.personId, { remarks: e.target.value })
//                         }
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="icon-sm"
//                         aria-label="Remove trainee"
//                         onClick={() =>
//                           onRowsChange(
//                             rows.filter(
//                               (item) => item.personId !== row.personId,
//                             ),
//                           )
//                         }
//                       >
//                         <TrashIcon />
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 )
//               })
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   )
// }

import { ComboboxField } from '@/components/inputs/TextField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { TrashIcon } from 'lucide-react'

export type TraineeOption = {
  id: number
  firstName: string
  lastName: string | null
  code: string | null
  rank: string | null
  personnelType: string
  batchNo: string | null
}

export type LineRow = {
  personId: number
  attendanceStatus: 'pending' | 'present' | 'absent' | 'excused'
  score: string
  result: 'pending' | 'passed' | 'failed'
  remarks: string
}

export function personName(person: {
  firstName?: string | null
  lastName?: string | null
}) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
}

export function emptyLineRow(personId: number): LineRow {
  return {
    personId,
    attendanceStatus: 'pending',
    score: '',
    result: 'pending',
    remarks: '',
  }
}

const attendanceOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Excused', value: 'excused' },
]

const resultOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Passed', value: 'passed' },
  { label: 'Failed', value: 'failed' },
]

// Color config: one source of truth for badges, dots, and row accents
const ATTENDANCE_STYLES: Record<
  LineRow['attendanceStatus'],
  { badge: string; dot: string; accent: string }
> = {
  pending: {
    badge:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
    accent: 'border-l-slate-300 dark:border-l-slate-600',
  },
  present: {
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
    dot: 'bg-emerald-500',
    accent: 'border-l-emerald-400',
  },
  absent: {
    badge:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
    dot: 'bg-red-500',
    accent: 'border-l-red-400',
  },
  excused: {
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
    dot: 'bg-amber-500',
    accent: 'border-l-amber-400',
  },
}

const RESULT_STYLES: Record<LineRow['result'], { badge: string; dot: string }> =
  {
    pending: {
      badge:
        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    passed: {
      badge:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
      dot: 'bg-emerald-500',
    },
    failed: {
      badge:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
      dot: 'bg-red-500',
    },
  }

function StatusDot({ className }: { className: string }) {
  return (
    <span
      className={cn(
        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
        className,
      )}
      aria-hidden="true"
    />
  )
}

export default function TraineePicker({
  trainees,
  rows,
  onRowsChange,
}: {
  trainees: TraineeOption[]
  rows: LineRow[]
  onRowsChange: (rows: LineRow[]) => void
}) {
  const selectedIds = rows.map((row) => row.personId)
  const available = trainees.filter(
    (person) => !selectedIds.includes(person.id),
  )

  const updateRow = (personId: number, patch: Partial<LineRow>) => {
    onRowsChange(
      rows.map((row) =>
        row.personId === personId ? { ...row, ...patch } : row,
      ),
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Trainees</h2>
          <p className="text-sm text-muted-foreground">
            Select a trainee to add them to the line.
          </p>
        </div>
        <ComboboxField
          className="w-72 shrink-0"
          label="Add trainee"
          placeholder="Select trainee"
          disabled={available.length === 0}
          value={null}
          options={available.map((person) => ({
            value: person.id,
            label: `${personName(person)}${person.code ? ` (${person.code})` : ''}`,
          }))}
          onValueChange={(value) => {
            const id = value
            if (typeof id !== 'number') return
            if (selectedIds.includes(id)) return
            onRowsChange([...rows, emptyLineRow(id)])
          }}
        />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">#</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-20 text-center text-muted-foreground"
                >
                  No trainees on this line yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const person = trainees.find((item) => item.id === row.personId)
                const attendanceStyle = ATTENDANCE_STYLES[row.attendanceStatus]
                const resultStyle = RESULT_STYLES[row.result]

                return (
                  <TableRow key={row.personId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{person?.code || '-'}</TableCell>
                    <TableCell>{person ? personName(person) : '-'}</TableCell>
                    <TableCell>{person?.rank || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={row.attendanceStatus}
                        items={attendanceOptions}
                        onValueChange={(value) =>
                          updateRow(row.personId, {
                            attendanceStatus: String(
                              value ?? 'pending',
                            ) as LineRow['attendanceStatus'],
                          })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            'w-32 border font-medium',
                            attendanceStyle.badge,
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <StatusDot className={attendanceStyle.dot} />
                            <SelectValue />
                          </span>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {attendanceOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <span className="flex items-center gap-2">
                                  <StatusDot
                                    className={
                                      ATTENDANCE_STYLES[
                                        option.value as LineRow['attendanceStatus']
                                      ].dot
                                    }
                                  />
                                  {option.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20"
                        value={row.score}
                        onChange={(e) =>
                          updateRow(row.personId, { score: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.result}
                        items={resultOptions}
                        onValueChange={(value) =>
                          updateRow(row.personId, {
                            result: String(
                              value ?? 'pending',
                            ) as LineRow['result'],
                          })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            'w-28 border font-medium',
                            resultStyle.badge,
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <StatusDot className={resultStyle.dot} />
                            <SelectValue />
                          </span>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {resultOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <span className="flex items-center gap-2">
                                  <StatusDot
                                    className={
                                      RESULT_STYLES[
                                        option.value as LineRow['result']
                                      ].dot
                                    }
                                  />
                                  {option.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="min-w-36"
                        value={row.remarks}
                        onChange={(e) =>
                          updateRow(row.personId, { remarks: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove trainee"
                        className="text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        onClick={() =>
                          onRowsChange(
                            rows.filter(
                              (item) => item.personId !== row.personId,
                            ),
                          )
                        }
                      >
                        <TrashIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
