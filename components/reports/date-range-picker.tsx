'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format, subMonths } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DateRangePickerProps {
  from?: Date
  to?: Date
}

export function DateRangePicker({ from, to }: DateRangePickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>(undefined)

  function handleSelect(selected: DateRange | undefined) {
    setRange(selected)

    if (selected?.from && selected?.to && selected.from.getTime() !== selected.to.getTime()) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('from', format(selected.from, 'yyyy-MM-dd'))
      params.set('to', format(selected.to, 'yyyy-MM-dd'))
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
      setOpen(false)
    }
  }

  const label = from && to
    ? `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`
    : 'Pick a date range'

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setRange(undefined) }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2" type="button">
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        collisionPadding={16}
      >
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          showOutsideDays={false}
          defaultMonth={subMonths(new Date(), 1)}
          disabled={{ after: new Date() }}
          className="p-4 [--cell-size:2.25rem]"
          classNames={{
            months: 'flex flex-row gap-6',
            month: 'w-[calc(7*2.25rem)] flex flex-col gap-4',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
