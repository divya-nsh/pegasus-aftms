import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Toggle } from '../ui/toggle'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date) => void
  /** Minute increment shown in the dropdown, e.g. 1, 5, 15 */
  minuteStep?: number
  /** Show a 24-hour hour dropdown (00-23, no AM/PM) instead of 12-hour + AM/PM */
  use24Hour?: boolean
  className?: string
}

export function TimePicker({
  date,
  setDate,
  minuteStep = 1,
  use24Hour = false,
  className,
}: TimePickerProps) {
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => i * minuteStep,
  )
  const hours24 = Array.from({ length: 24 }, (_, i) => i) // 0..23
  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1) // 1..12

  const current = date ?? new Date()
  const hour24 = current.getHours()
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const minute = current.getMinutes()
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM'

  function updateTime(next: {
    hour?: number
    minute?: number
    period?: 'AM' | 'PM'
  }) {
    const base = date ? new Date(date) : new Date()
    const m = next.minute ?? minute

    let h: number
    if (use24Hour) {
      // Dropdown value IS the 24-hour value already
      h = next.hour ?? hour24
    } else {
      const h12 = next.hour ?? hour12
      const p = next.period ?? period
      h = p === 'AM' ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12
    }

    base.setHours(h, m, 0, 0)
    setDate(base)
  }

  return (
    <div
      className={cn(
        'grid items-center gap-2',
        use24Hour
          ? 'grid-cols-[1fr_20px_1fr]'
          : 'grid-cols-[1fr_20px_1fr_auto]',
        className,
      )}
    >
      {/* Hour */}
      <Select
        value={
          use24Hour
            ? String(hour24).padStart(2, '0')
            : String(hour12).padStart(2, '0')
        }
        onValueChange={(v) => updateTime({ hour: Number(v) })}
      >
        <SelectTrigger
          className="w-full shadow-none justify-center border-b border-r-0 border-l-0 border-t-0 rounded-none"
          hideChevron
        >
          <SelectValue className="text-center" />
        </SelectTrigger>
        <SelectContent className="max-h-50">
          {(use24Hour ? hours24 : hours12).map((h) => (
            <SelectItem key={h} value={String(h)}>
              {String(h).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="text-muted-foreground w-full text-center">:</div>

      {/* Minute */}
      <Select
        value={String(minute).padStart(2, '0')}
        onValueChange={(v) => updateTime({ minute: Number(v) })}
      >
        <SelectTrigger
          className="w-full shadow-none border-b border-r-0 border-l-0 border-t-0 rounded-none"
          hideChevron
        >
          <SelectValue className="text-center" />
        </SelectTrigger>
        <SelectContent className="max-h-50">
          {minutes.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {String(m).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM / PM — only shown in 12-hour mode */}
      {!use24Hour && (
        <Toggle
          className="shadow-none border-b rounded-none"
          onClick={() => updateTime({ period: period === 'AM' ? 'PM' : 'AM' })}
        >
          {period === 'AM' ? 'AM' : 'PM'}
        </Toggle>
      )}
    </div>
  )
}
