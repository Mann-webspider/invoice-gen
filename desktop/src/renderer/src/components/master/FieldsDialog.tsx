import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { applyIpcError } from '@/lib/form'

export interface DialogFieldSpec {
  key: string
  label: string
  placeholder: string
  /** Plain-language explanation shown under the box. */
  help?: string
  multiline?: boolean
  optional?: boolean
}

/**
 * The short master records — a tile size, an HSN code, a port and the country it
 * sits in — as one dialog rather than three near-identical ones.
 *
 * Deliberately shared between the Admin Panel and the wizard: the Add button
 * beside a picker mid-invoice opens exactly the same form the administrator
 * uses, so there is nothing new to learn and no second code path that could
 * accept a shape the Admin Panel would reject.
 */
export const FieldsDialog = ({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel = 'Save',
  onSave
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: DialogFieldSpec[]
  initial?: Record<string, string>
  submitLabel?: string
  onSave: (values: Record<string, string>) => Promise<unknown>
}): JSX.Element => {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Reopening must not show the previous entry, and opening for an edit must
  // show that record rather than a blank form.
  useEffect(() => {
    if (!open) return
    setValues(
      Object.fromEntries(fields.map((field) => [field.key, initial?.[field.key] ?? '']))
    )
    // `initial` and `fields` are literals at the call sites and would restart
    // this on every render; the dialog opening is the only moment that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const complete = fields.every((field) => field.optional || values[field.key]?.trim())

  const save = async (): Promise<void> => {
    if (!complete) return
    setSaving(true)
    try {
      await onSave(
        Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]))
      )
      onOpenChange(false)
    } catch (error) {
      applyIpcError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`dialog-${field.key}`}>{field.label}</Label>
              {field.multiline ? (
                <Textarea
                  id={`dialog-${field.key}`}
                  rows={3}
                  value={values[field.key] ?? ''}
                  placeholder={field.placeholder}
                  autoFocus={index === 0}
                  onChange={(event) =>
                    setValues((previous) => ({ ...previous, [field.key]: event.target.value }))
                  }
                />
              ) : (
                <Input
                  id={`dialog-${field.key}`}
                  value={values[field.key] ?? ''}
                  placeholder={field.placeholder}
                  autoFocus={index === 0}
                  onChange={(event) =>
                    setValues((previous) => ({ ...previous, [field.key]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && complete) void save()
                  }}
                />
              )}
              {field.help && <p className="text-xs text-gray-500">{field.help}</p>}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()} disabled={!complete || saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
