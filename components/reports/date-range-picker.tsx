'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  from: Date
  to: Date
}

export function DateRangePicker({ from, to }: DateRangePickerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange>({ from, to })

  function handleSelect(selected: DateRange | undefined) {
    setRange(selected ?? { from, to })
    if (selected?.from && selected?.to) {
      const params = new URLSearchParams({
        from: format(selected.from, 'yyyy-MM-dd'),
        to: format(selected.to, 'yyyy-MM-dd'),
      })
      router.push(`/dashboard/reports?${params.toString()}`)
      setOpen(false)
    }
  }

  const label =
    range.from && range.to
      ? `${format(range.from, 'MMM d, yyyy')} – ${format(range.to, 'MMM d, yyyy')}`
      : 'Pick a date range'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  )
}
