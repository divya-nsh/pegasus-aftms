import { BasicSelectField, ComboboxField } from '@/components/inputs/TextField'
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
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {attendanceOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
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
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {resultOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
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
