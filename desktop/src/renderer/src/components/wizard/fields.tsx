import { useFormContext, type FieldPath } from 'react-hook-form'
import type { WizardData } from '@shared/contracts'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useMasterList } from '@/hooks/useMaster'

export type WizardField = FieldPath<WizardData>

/**
 * Field wrappers bound to the wizard form through context.
 *
 * Every input in the wizard goes through one of these, so validation messages,
 * labels and spacing are identical everywhere. The web app wired inputs three
 * different ways — `register(...)`, a `Controller`, and plain `value`/`onChange`
 * against FormContext — sometimes within one section.
 */

export const TextField = ({
  name,
  label,
  placeholder,
  description,
  type = 'text',
  className
}: {
  name: WizardField
  label: string
  placeholder?: string
  description?: string
  type?: string
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field }) => (
      <FormItem className={className}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input type={type} placeholder={placeholder} {...field} value={field.value ?? ''} />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)

export const TextareaField = ({
  name,
  label,
  rows = 3,
  placeholder,
  className
}: {
  name: WizardField
  label: string
  rows?: number
  placeholder?: string
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field }) => (
      <FormItem className={className}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Textarea rows={rows} placeholder={placeholder} {...field} value={field.value ?? ''} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)

export const ChoiceField = ({
  name,
  label,
  options,
  placeholder = 'Select…',
  className
}: {
  name: WizardField
  label: string
  options: readonly string[]
  placeholder?: string
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field }) => (
      <FormItem className={className}>
        <FormLabel>{label}</FormLabel>
        <Select onValueChange={field.onChange} value={field.value ?? ''}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
)

/**
 * A select backed by an Admin Panel dropdown list, with a free-text fallback so
 * a one-off value never forces a trip to the Admin Panel mid-invoice.
 */
export const DropdownField = ({
  name,
  label,
  category,
  placeholder,
  className
}: {
  name: WizardField
  label: string
  category: string
  placeholder?: string
  className?: string
}): JSX.Element => {
  const { data: options = [] } = useMasterList('dropdownOption', category)
  const { watch } = useFormContext<WizardData>()
  const current = watch(name)

  const values = options.filter((option) => option.isActive).map((option) => option.value)
  // Keep a value that was typed before the option was removed from the list.
  const known = current && !values.includes(String(current)) ? [String(current), ...values] : values

  return (
    <ChoiceField
      name={name}
      label={label}
      options={known}
      placeholder={placeholder ?? 'Select…'}
      className={className}
    />
  )
}
