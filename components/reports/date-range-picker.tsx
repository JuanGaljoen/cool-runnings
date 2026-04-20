'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format, subMonths } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

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

  const today = format(new Date(), 'yyyy-MM-dd')
  const fromStr = from ? format(from, 'yyyy-MM-dd') : ''
  const toStr = to ? format(to, 'yyyy-MM-dd') : ''

  function pushParams(newFrom: string, newTo: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newFrom) params.set('from', newFrom)
    if (newTo) params.set('to', newTo)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleCalendarSelect(selected: DateRange | undefined) {
    setRange(selected)
    if (selected?.from && selected?.to && selected.from.getTime() !== selected.to.getTime()) {
      pushParams(format(selected.from, 'yyyy-MM-dd'), format(selected.to, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  const label = from && to
    ? `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`
    : 'Pick a date range'

  return (
    <>
      {/* Touch devices: native date inputs */}
      <div className="flex items-center gap-2 [@media(pointer:fine)]:hidden">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            value={fromStr}
            max={toStr || today}
            onChange={(e) => pushParams(e.target.value, toStr)}
            className="w-36 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            value={toStr}
            min={fromStr}
            max={today}
            onChange={(e) => pushParams(fromStr, e.target.value)}
            className="w-36 text-sm"
          />
        </div>
      </div>

      {/* Pointer devices: calendar popover */}
      <div className="hidden [@media(pointer:fine)]:block">
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
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              showOutsideDays={false}
              defaultMonth={subMonths(new Date(), 1)}
              disabled={{ after: new Date() }}
              className="p-4 [--cell-size:2.25rem]"
              classNames={{
                months: 'flex flex-row gap-6',
                month: 'w-[calc(7*2.25rem)] flex flex-col gap-4',
                button_previous: 'h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center opacity-70 hover:opacity-100',
                button_next: 'h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center opacity-70 hover:opacity-100',
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}
