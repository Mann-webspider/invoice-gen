import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { applyIpcError } from '@/lib/form'

export interface PickerOption {
  value: string
  label: string
  /** Second line, to tell two similarly named rows apart. */
  hint?: string
}

/**
 * A searchable picker that can create what it is missing.
 *
 * This is the component the whole redesign turns on. Every list in the wizard
 * used to be a plain `<Select>` over an Admin Panel table, so a clerk who met a
 * port, a buyer or a tile size nobody had entered yet had to abandon a
 * half-filled invoice, find someone with an administrator password, add the row
 * and start again. Both ways out of that are here: `onAddTyped` saves whatever
 * was typed into the search box, and `onAddNew` opens a form for records that
 * need more than one field.
 */
export const Picker = ({
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  searchPlaceholder = 'Type to search…',
  emptyText = 'Nothing found.',
  addTypedLabel = 'Add',
  onAddTyped,
  addNewLabel,
  onAddNew,
  disabled,
  invalid,
  className,
  id
}: {
  value: string
  onChange: (value: string) => void
  options: PickerOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  /** Verb shown before the typed text, e.g. Add "MUNDRA". */
  addTypedLabel?: string
  /** Saves the typed text as a new entry and returns the value to select. */
  onAddTyped?: (text: string) => Promise<string>
  /** Label for the dialog route, e.g. "Add a new buyer". */
  addNewLabel?: string
  /** Opens a form for records that need more than one field. */
  onAddNew?: () => void
  disabled?: boolean
  invalid?: boolean
  className?: string
  id?: string
}): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const selected = options.find((option) => option.value === value)

  // Filtered here rather than by cmdk's own matcher, so the "add what you
  // typed" row can react to the same query the list is filtered by.
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        option.hint?.toLowerCase().includes(needle)
    )
  }, [options, query])

  const typed = query.trim()
  const alreadyExists = options.some(
    (option) => option.label.toLowerCase() === typed.toLowerCase()
  )
  const canAddTyped = Boolean(onAddTyped) && typed.length > 0 && !alreadyExists

  const close = (): void => {
    setOpen(false)
    setQuery('')
  }

  const addTyped = async (): Promise<void> => {
    if (!onAddTyped || !typed) return
    setSaving(true)
    try {
      onChange(await onAddTyped(typed))
      close()
    } catch (error) {
      applyIpcError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        {/*
          Styled as an input rather than with Button's outline variant: this
          theme's --accent is a mid grey, so a button hover floods the control
          with a slab of it. Matching the select trigger keeps every control on
          a row looking like the same kind of thing.
        */}
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-offset-2',
            !selected && !value && 'text-muted-foreground',
            invalid && 'border-destructive',
            className
          )}
        >
          <span className="truncate">{selected?.label || value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
          />

          <CommandList>
            {matches.length === 0 && !canAddTyped && !onAddNew && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}

            {matches.length > 0 && (
              <CommandGroup>
                {matches.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value)
                      close()
                    }}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        option.value === value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.hint && (
                        <span className="block truncate text-xs text-gray-500">
                          {option.hint}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(canAddTyped || onAddNew) && (
              <>
                {matches.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  {canAddTyped && (
                    <CommandItem
                      value={`__add__${typed}`}
                      disabled={saving}
                      onSelect={() => void addTyped()}
                      className="text-primary"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">
                        {addTypedLabel} “{typed}”
                      </span>
                    </CommandItem>
                  )}

                  {onAddNew && (
                    <CommandItem
                      value="__add_new__"
                      onSelect={() => {
                        close()
                        onAddNew()
                      }}
                      className="text-primary"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      <span className="truncate">{addNewLabel ?? 'Add a new one'}</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
