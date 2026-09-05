import { createFileRoute } from '@tanstack/react-router'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useState } from 'react'
import { formatDate } from '@/lib/date'
import { TimePicker } from '@/components/inputs/TimePicker'

export const Route = createFileRoute('/date')({
  component: RouteComponent,
})

function RouteComponent() {
  const [date, setDate] = useState<Date | null>(null)

  return (
    <div className="p-8">
      <DatePicker
        value={date}
        onChange={setDate}
        time={true}
        use24Hour={true}
      />
    </div>
  )
}

function DatePicker({
  value,
  onChange,
  showWeekDay = false,
  enableClear = true,
  time = false,
  use24Hour = false,
}: {
  value?: Date | null
  onChange?: (date: Date | null) => void
  showWeekDay?: boolean
  enableClear?: boolean
  time?: boolean
  use24Hour?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            data-empty={!value}
            className="justify-start gap-4 text-left font-normal data-[empty=true]:text-muted-foreground"
          />
        }
      >
        {value ? (
          formatDate(value, false, showWeekDay)
        ) : (
          <span>Pick a date</span>
        )}
        <CalendarIcon className=" text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto py-0 px-3">
        <Calendar
          className="pb-1 px-0"
          mode="single"
          required
          captionLayout="dropdown"
          selected={value ?? undefined}
          onSelect={onChange}
          startMonth={new Date(1900, 0)}
          endMonth={new Date(new Date().getFullYear() + 60, 11)}
        />
        {time && (
          <TimePicker
            className="-mt-2"
            date={value ?? undefined}
            setDate={onChange ?? (() => {})}
            use24Hour={use24Hour}
          />
        )}
        <div className="flex text-sm justify-between gap-2 w-full pb-4">
          {enableClear ? (
            <Button variant="ghost" size="xs" onClick={() => onChange?.(null)}>
              Clear
            </Button>
          ) : (
            <span></span>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onChange?.(getTodayDateWithoutTime())}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function getTodayDateWithoutTime() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}
