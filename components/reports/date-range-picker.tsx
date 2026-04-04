'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  from: Date
  to: Date
}

export function DateRangePicker({ from, to }: DateRangePickerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange>({ from, to })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelect(selected: DateRange | undefined) {
    const next = selected ?? { from: undefined, to: undefined }
    setRange(next)

    if (next.from && next.to && next.from.getTime() !== next.to.getTime()) {
      const params = new URLSearchParams({
        from: format(next.from, 'yyyy-MM-dd'),
        to: format(next.to, 'yyyy-MM-dd'),
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
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <CalendarIcon className="h-4 w-4" />
        {label}
      </Button>

      {open && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-2 rounded-md border bg-popover shadow-md'
          )}
        >
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </div>
      )}
    </div>
  )
}
