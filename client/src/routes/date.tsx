/* eslint-disable no-shadow */
import { createFileRoute } from '@tanstack/react-router'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEffect, useRef, useState } from 'react'
import { formatDate } from '@/lib/date'
import { ScrollArea } from '@/components/ui/scroll-area'

export const Route = createFileRoute('/date')({
  component: RouteComponent,
})

function RouteComponent() {
  const [date, setDate] = useState<Date | null>(null)

  return (
    <div className="p-8">
      <DatePicker value={date} onChange={setDate} time={true} />
    </div>
  )
}

function DatePicker({
  value,
  onChange,
  showWeekDay = false,
  enableClear = true,
  time = false,
  //  use24Hour = false,
}: {
  value?: Date | null
  onChange?: (date: Date | null) => void
  showWeekDay?: boolean
  enableClear?: boolean
  time?: boolean
  //  use24Hour?: boolean
}) {
  const [open, setOpen] = useState(false)
  const hour = value?.getHours() ?? 0
  const minute = value?.getMinutes() ?? 0
  // refs to every li so we can scroll to the selected one on open
  const hourRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const minuteRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  const handleHourClick = (hour: number) => {
    onChange?.(
      new Date(
        value?.getFullYear() ?? new Date().getFullYear(),
        value?.getMonth() ?? new Date().getMonth(),
        value?.getDate() ?? new Date().getDate(),
        hour,
        minute,
      ),
    )
  }

  const handleMinuteClick = (minute: number) => {
    onChange?.(
      new Date(
        value?.getFullYear() ?? new Date().getFullYear(),
        value?.getMonth() ?? new Date().getMonth(),
        value?.getDate() ?? new Date().getDate(),
        hour,
        minute,
      ),
    )
  }

  useEffect(() => {
    if (!open) return
    // wait a frame so PopoverContent/ScrollArea are actually mounted & laid out
    const raf = requestAnimationFrame(() => {
      hourRefs.current.get(hour)?.scrollIntoView({ block: 'center' })
      minuteRefs.current.get(minute)?.scrollIntoView({ block: 'center' })
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          formatDate(value, true, showWeekDay)
        ) : (
          <span>Pick a date</span>
        )}
        <CalendarIcon className=" text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto py-0 px-0 flex flex-row items-start gap-0">
        <div className=" border-r">
          <Calendar
            className="pb-2 px-2"
            mode="single"
            required
            captionLayout="dropdown"
            selected={value ?? undefined}
            onSelect={onChange}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 60, 11)}
          />
          <div className="flex text-sm justify-between gap-2 w-full py-2 border-t px-2">
            {enableClear ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onChange?.(null)}
              >
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
        </div>

        {time && (
          <div className="grid grid-cols-2 gap-2 w-auto">
            <ScrollArea className="h-78 border-r py-2 px-2 space-y-1">
              {hours.map((itm) => (
                <button
                  key={itm}
                  className="w-10 h-9 flex items-center justify-center text-center hover:bg-muted rounded-md data-[time-selected=true]:bg-primary data-[time-selected=true]:text-primary-foreground cursor-default outline-none active:translate-y-0.5 transition-all duration-100"
                  data-time-selected={itm === hour}
                  onClick={() => handleHourClick(itm)}
                  ref={(el) => {
                    if (el) hourRefs.current.set(itm, el)
                    else hourRefs.current.delete(itm)
                  }}
                >
                  {itm}
                </button>
              ))}
            </ScrollArea>

            <ScrollArea className="h-78 py-2 space-y-1 px-1">
              {minutes.map((itm) => (
                <button
                  key={itm}
                  className="w-10 h-9 flex items-center justify-center text-center hover:bg-muted rounded-md data-[time-selected=true]:bg-primary data-[time-selected=true]:text-primary-foreground cursor-default outline-none active:translate-y-0.5 transition-all duration-100"
                  data-time-selected={itm === minute}
                  onClick={() => handleMinuteClick(itm)}
                  ref={(el) => {
                    if (el) minuteRefs.current.set(itm, el)
                    else minuteRefs.current.delete(itm)
                  }}
                >
                  {itm}
                </button>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* {time && (
          <TimePicker
            className="-mt-2"
            date={value ?? undefined}
            setDate={onChange ?? (() => {})}
            use24Hour={use24Hour}
          />
        )} */}
      </PopoverContent>
    </Popover>
  )
}

function getTodayDateWithoutTime() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 }, (_, i) => i)
