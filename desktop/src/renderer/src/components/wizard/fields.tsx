import { useId, type ReactNode } from 'react'
import { useFormContext, type FieldPath } from 'react-hook-form'

import type { WizardData } from '@shared/contracts'
import { cn } from '@/lib/utils'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DateInput } from '@/components/fields/DateInput'
import { Picker, type PickerOption } from '@/components/fields/Picker'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'

export type WizardField = FieldPath<WizardData>

/**
 * Every input in the wizard goes through one of these.
 *
 * Two things changed in the redesign. Each field can now carry a plain-language
 * `help` line, because the labels are the terms printed on the customs forms —
 * IE code, HSN, VGM — and renaming them would leave the client matching an
 * invented word against a government document, while leaving them unexplained
 * assumes knowledge the person typing may not have. And every list that reads
 * from the Admin Panel is a `ListField`, which can add to that list in place
 * instead of sending someone away from a half-filled invoice.
 *
 * `data-field` on each item is what the step's "still to fill in" summary
 * scrolls to.
 */

const Shell = ({
  name,
  label,
  help,
  controlId,
  className,
  children
}: {
  name: string
  label: string
  help?: string
  /**
   * For controls that are not wrapped in FormControl — the pickers, whose root
   * is a Radix Popover and cannot take a DOM id. Without this the label points
   * at an element that does not exist and clicking it does nothing.
   */
  controlId?: string
  className?: string
  children: ReactNode
}): JSX.Element => (
  <FormItem className={className} data-field={name}>
    {/* Spread rather than htmlFor={controlId}: an explicit undefined would
        override the id FormLabel derives for every ordinary input. */}
    <FormLabel {...(controlId ? { htmlFor: controlId } : {})}>{label}</FormLabel>
    {children}
    {help && <FormDescription className="text-xs">{help}</FormDescription>}
    <FormMessage />
  </FormItem>
)

export const TextField = ({
  name,
  label,
  placeholder,
  help,
  type = 'text',
  className
}: {
  name: WizardField
  label: string
  placeholder?: string
  help?: string
  type?: string
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field }) => (
      <Shell name={name} label={label} help={help} className={className}>
        <FormControl>
          <Input type={type} placeholder={placeholder} {...field} value={String(field.value ?? '')} />
        </FormControl>
      </Shell>
    )}
  />
)

/** Right-aligned and numeric-keypad, so amounts and weights read as amounts. */
export const NumberField = ({
  name,
  label,
  placeholder,
  help,
  className
}: {
  name: WizardField
  label: string
  placeholder?: string
  help?: string
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field }) => (
      <Shell name={name} label={label} help={help} className={className}>
        <FormControl>
          <Input
            inputMode="decimal"
            placeholder={placeholder}
            className="text-right tabular-nums"
            {...field}
            value={String(field.value ?? '')}
          />
        </FormControl>
      </Shell>
    )}
  />
)

export const TextareaField = ({
  name,
  label,
  rows = 3,
  placeholder,
  help,
  className
}: {
  name: WizardField
  label: string
  rows?: number
  placeholder?: string
  help?: string
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field }) => (
      <Shell name={name} label={label} help={help} className={className}>
        <FormControl>
          <Textarea rows={rows} placeholder={placeholder} {...field} value={String(field.value ?? '')} />
        </FormControl>
      </Shell>
    )}
  />
)

export const DateField = ({
  name,
  label,
  help,
  pattern,
  className
}: {
  name: WizardField
  label: string
  help?: string
  /** VGM's weighing date prints with dots rather than slashes. */
  pattern?: string
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field, fieldState }) => (
      <Shell name={name} label={label} help={help} className={className}>
        <DateInput
          value={String(field.value ?? '')}
          onChange={field.onChange}
          onBlur={field.onBlur}
          pattern={pattern}
          invalid={Boolean(fieldState.error)}
        />
      </Shell>
    )}
  />
)

/** A value that is computed rather than typed — shown, never editable. */
export const DerivedField = ({
  label,
  value,
  help,
  className
}: {
  label: string
  value: string
  help?: string
  className?: string
}): JSX.Element => (
  <div className={cn('space-y-2', className)}>
    <span className="text-sm font-medium leading-none">{label}</span>
    <div className="flex h-10 items-center justify-end rounded-md border border-dashed bg-gray-50 px-3 text-sm tabular-nums text-gray-700">
      {value || '—'}
    </div>
    {help && <p className="text-xs text-gray-500">{help}</p>}
  </div>
)

export type ChoiceOption = string | { value: string; label: string; hint?: string }

const asOption = (option: ChoiceOption): { value: string; label: string; hint?: string } =>
  typeof option === 'string' ? { value: option, label: option } : option

/**
 * A closed set of answers.
 *
 * Four or fewer render as buttons rather than a dropdown: the options are the
 * information, and hiding three words behind a click to reveal them helps
 * nobody. Longer sets fall back to the searchable picker.
 */
export const ChoiceField = ({
  name,
  label,
  options,
  help,
  placeholder = 'Choose…',
  className
}: {
  name: WizardField
  label: string
  options: readonly ChoiceOption[]
  help?: string
  placeholder?: string
  className?: string
}): JSX.Element => {
  const entries = options.map(asOption)

  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => (
        <Shell name={name} label={label} help={help} className={className}>
          {entries.length <= 4 ? (
            <div
              role="radiogroup"
              aria-label={label}
              className={cn(
                'flex flex-wrap gap-2 rounded-md',
                fieldState.error && 'ring-1 ring-destructive ring-offset-2'
              )}
            >
              {entries.map((option) => {
                const active = field.value === option.value
                return (
                  <Button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    variant={active ? 'default' : 'outline'}
                    className="h-10"
                    onClick={() => field.onChange(active ? '' : option.value)}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
          ) : (
            <Picker
              value={String(field.value ?? '')}
              onChange={field.onChange}
              options={entries}
              placeholder={placeholder}
              invalid={Boolean(fieldState.error)}
            />
          )}
        </Shell>
      )}
    />
  )
}

/**
 * A list the Admin Panel owns — ports, places of receipt, unit types — that can
 * be added to without leaving the invoice.
 *
 * The value stored is the text itself, not an id, which is what the document
 * generator prints. A value typed before someone deleted the option therefore
 * still displays; the picker falls back to the raw value when it matches no row.
 */
export const ListField = ({
  name,
  label,
  category,
  help,
  placeholder = 'Choose…',
  addLabel = 'Add',
  className
}: {
  name: WizardField
  label: string
  /** dropdown_option category, e.g. port_of_loading. */
  category: string
  help?: string
  placeholder?: string
  addLabel?: string
  className?: string
}): JSX.Element => {
  const controlId = useId()
  const { data: rows = [] } = useMasterList('dropdownOption', category)
  const mutations = useMasterMutations('dropdownOption', {
    created: `${label} added`,
    updated: `${label} updated`,
    removed: `${label} removed`
  })

  const options: PickerOption[] = rows
    .filter((row) => row.isActive)
    .map((row) => ({ value: row.value, label: row.value }))

  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => (
        <Shell name={name} label={label} help={help} controlId={controlId} className={className}>
          <Picker
            id={controlId}
            value={String(field.value ?? '')}
            onChange={field.onChange}
            options={options}
            placeholder={placeholder}
            searchPlaceholder="Search, or type something new…"
            addTypedLabel={addLabel}
            invalid={Boolean(fieldState.error)}
            onAddTyped={async (text) => {
              await mutations.create({ category, value: text, isActive: true })
              return text
            }}
          />
        </Shell>
      )}
    />
  )
}

/**
 * A picker over records the wizard resolves itself, with its own Add form.
 *
 * Choosing does not write the field directly — it hands the id to `onChange`, so
 * the caller can copy the whole record into the form. That copy is the point:
 * an invoice keeps its own snapshot of the company and supplier it was issued
 * with, so editing a master record later never rewrites history.
 */
export const RecordField = ({
  name,
  label,
  options,
  value,
  help,
  placeholder,
  addNewLabel,
  onAddNew,
  onChange,
  className
}: {
  /** Where the error and the scroll target live. */
  name: WizardField
  label: string
  options: PickerOption[]
  /** Override when the field holds a copied value rather than the record id. */
  value?: string
  help?: string
  placeholder?: string
  addNewLabel: string
  onAddNew: () => void
  onChange: (value: string) => void
  className?: string
}): JSX.Element => {
  const controlId = useId()
  const { watch } = useFormContext<WizardData>()
  const current = value ?? String(watch(name) ?? '')

  return (
    <FormField
      name={name}
      render={({ fieldState }) => (
        <Shell name={name} label={label} help={help} controlId={controlId} className={className}>
          <Picker
            id={controlId}
            value={current}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            addNewLabel={addNewLabel}
            onAddNew={onAddNew}
            invalid={Boolean(fieldState.error)}
          />
        </Shell>
      )}
    />
  )
}
