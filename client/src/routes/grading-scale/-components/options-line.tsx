import { useRef, useState } from 'react'
import type { GradingScaleFormData } from './grading-scale-form'
import { toast } from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { PencilIcon, TrashIcon } from 'lucide-react'
import { generateGradeRanges } from './utils'

export function ScaleOptionsLine({
  options,
  setOptions,
}: {
  options: GradingScaleFormData['options']
  setOptions: (options: GradingScaleFormData['options']) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const saveOption = (label: string) => {
    const hasDuplicateLabel = options.some(
      (option, index) =>
        index !== editingIndex &&
        option.label.toLowerCase() === label.toLowerCase(),
    )

    if (hasDuplicateLabel) {
      toast.error('Option name already used')
      return false
    }

    const next =
      editingIndex === null
        ? [...options.map((v) => v.label), label]
        : options.map((item, index) =>
            index === editingIndex ? label : item.label,
          )

    setOptions(generateGradeRanges(next))
    setEditingIndex(null)
    return true
  }

  const handleDeleteOption = (index: number) => {
    const next = options.filter((_, optionIndex) => optionIndex !== index)
    setOptions(generateGradeRanges(next.map((v) => v.label)))
    setEditingIndex(null)
  }

  return (
    <div className="space-y-3">
      <ScaleOptionForm
        inputRef={inputRef}
        key={editingIndex ?? 'new'}
        initialLabel={editingIndex !== null ? options[editingIndex].label : ''}
        isEditing={editingIndex !== null}
        onSave={saveOption}
        onCancel={() => setEditingIndex(null)}
      />
      <div className="overflow-hidden rounded-md border">
        {options.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {/* <TableHead className="w-12 text-center">#</TableHead> */}
                <TableHead>Name</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Point</TableHead>
                <TableHead className="w-20 text-center">-</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option, index) => (
                <TableRow
                  key={`${option.label}-${index}`}
                  className="even:bg-muted/30"
                >
                  <TableCell>{option.label}</TableCell>
                  <TableCell>
                    {option.lowerBound} – {option.upperBound}
                  </TableCell>
                  <TableCell>{option.point}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingIndex(index)
                          inputRef.current?.focus()
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDeleteOption(index)}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No options added yet
          </div>
        )}
      </div>
    </div>
  )
}

function ScaleOptionForm({
  inputRef,
  initialLabel,
  isEditing,
  onSave,
  onCancel,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  initialLabel: string
  isEditing: boolean
  onSave: (label: string) => boolean
  onCancel: () => void
}) {
  const [label, setLabel] = useState(initialLabel)

  const handleSubmit = (event?: React.SubmitEvent) => {
    event?.preventDefault()
    event?.stopPropagation()
    const trimmed = label.trim()
    if (!trimmed) {
      toast.error('Please enter a label')
      return
    }
    inputRef.current?.focus()
    if (onSave(trimmed) && !isEditing) {
      setLabel('')
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-muted-foreground border-b pb-2">
        Options
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-3">
          <Input
            ref={inputRef}
            required
            className="flex-1"
            placeholder="Enter Label (eg. A,B)"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value)
            }}
          />
          <Button
            disabled={!label}
            type="button"
            onClick={() => handleSubmit()}
          >
            {isEditing ? 'Save' : 'Add'}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCancel()}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
      <p className="text-xs text-muted-foreground">
        Range and point are based on option order, with a total of 100. The
        first option is the highest grade, e.g. A=100, B=75, C=50, F=25. Both
        bounds are inclusive.
      </p>
    </div>
  )
}
