/* eslint-disable no-shadow */
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatDate } from '@/lib/date'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef, useState } from 'react'

export type DatePickerProps = {
  value?: string | null
  onChange?: (date: string | null) => void
  showWeekDay?: boolean
  enableClear?: boolean
  time?: boolean
  use24Hour?: boolean
  className?: string
  disabled?: boolean
  placeholder?: string
}

export default function DatePicker({
  showWeekDay = false,
  enableClear = true,
  time = false,
  disabled = false,
  placeholder = 'Pick a date',
  ...rest
  //  use24Hour = false,
}: DatePickerProps) {
  const value = rest.value ? new Date(rest.value) : null
  const [open, setOpen] = useState(false)
  const hour = time ? (value?.getHours() ?? 0) : 0
  const minute = time ? (value?.getMinutes() ?? 0) : 0
  // refs to every li so we can scroll to the selected one on open
  const hourRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const minuteRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  const onChange = (date: Date | null) => {
    if (!date) {
      rest.onChange?.(null)
      return
    }

    if (!time) {
      rest.onChange?.(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      )
      return
    }

    rest.onChange?.(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    )
  }

  const handleHourClick = (hour: number) => {
    onChange(
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
    onChange(
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
            className="justify-between hover:bg-transparent gap-4 text-left font-normal data-[empty=true]:text-muted-foreground"
            disabled={disabled}
          />
        }
      >
        {value ? (
          formatDate(value, time ? true : false, showWeekDay)
        ) : (
          <span>{placeholder}</span>
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
            onSelect={(v) => {
              onChange(
                new Date(
                  v.getFullYear(),
                  v.getMonth(),
                  v.getDate(),
                  hour,
                  minute,
                ),
              )
            }}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 60, 11)}
          />
          <div className="flex text-sm justify-between gap-2 w-full py-2 border-t px-2">
            {enableClear ? (
              <Button variant="ghost" size="xs" onClick={() => onChange(null)}>
                Clear
              </Button>
            ) : (
              <span></span>
            )}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                onChange(getTodayDateWithoutTime())
                setOpen(false)
              }}
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
                  data-time-selected={+itm === +hour}
                  onClick={() => handleHourClick(+itm)}
                  ref={(el) => {
                    if (el) hourRefs.current.set(+itm, el)
                    else hourRefs.current.delete(+itm)
                  }}
                >
                  {itm.toString().padStart(2, '0')}
                </button>
              ))}
            </ScrollArea>

            <ScrollArea className="h-78 py-2 space-y-1 px-1">
              {minutes.map((itm) => (
                <button
                  key={itm}
                  className="w-10 h-9 flex items-center justify-center text-center hover:bg-muted rounded-md data-[time-selected=true]:bg-primary data-[time-selected=true]:text-primary-foreground cursor-default outline-none active:translate-y-0.5 transition-all duration-100"
                  data-time-selected={+itm === +minute}
                  onClick={() => handleMinuteClick(+itm)}
                  ref={(el) => {
                    if (el) minuteRefs.current.set(+itm, el)
                    else minuteRefs.current.delete(+itm)
                  }}
                >
                  {itm.toString().padStart(2, '0')}
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
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
  )
}

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 }, (_, i) => i)
