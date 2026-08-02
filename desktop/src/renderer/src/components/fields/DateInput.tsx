import { useState } from 'react'
import { format as formatDate, isValid, parse } from 'date-fns'
import { CalendarDays } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * A date the documents print as text.
 *
 * The stored value stays a plain string in the pattern the Excel templates
 * expect, because that is what the generator writes out untouched. What changes
 * is how it gets there: the wizard used to offer nine bare text boxes labelled
 * "DD/MM/YYYY" and accept whatever was typed, so the same client's invoices
 * carry 1/4/25, 01-04-2025 and 2025-04-01. Picking from the calendar can only
 * produce the one shape; typing is still allowed for speed and is reformatted
 * on blur when it parses.
 */
export const DateInput = ({
  value,
  onChange,
  onBlur,
  pattern = 'dd/MM/yyyy',
  disabled,
  invalid,
  id
}: {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  /** date-fns pattern. VGM's weighing date prints with dots, not slashes. */
  pattern?: string
  disabled?: boolean
  invalid?: boolean
  id?: string
}): JSX.Element => {
  const [open, setOpen] = useState(false)

  const parsed = value ? parse(value, pattern, new Date()) : null
  const selected = parsed && isValid(parsed) ? parsed : undefined

  /**
   * Accepts the shapes people actually type — 1/4/25, 01-04-2025, 2025-04-01 —
   * and rewrites them into the stored pattern. Anything else is left exactly as
   * typed rather than silently turned into a wrong date.
   */
  const normalize = (): void => {
    const raw = value.trim()
    if (!raw) return
    const candidates = ['dd/MM/yyyy', 'd/M/yyyy', 'd/M/yy', 'dd-MM-yyyy', 'd-M-yyyy', 'yyyy-MM-dd']
    for (const candidate of [pattern, ...candidates]) {
      const date = parse(raw, candidate, new Date())
      if (isValid(date)) {
        const formatted = formatDate(date, pattern)
        if (formatted !== value) onChange(formatted)
        return
      }
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={pattern.toUpperCase()}
        inputMode="numeric"
        className={cn('flex-1', invalid && 'border-destructive')}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          normalize()
          onBlur?.()
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            aria-label="Pick a date from the calendar"
          >
            <CalendarDays />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (date) onChange(formatDate(date, pattern))
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
