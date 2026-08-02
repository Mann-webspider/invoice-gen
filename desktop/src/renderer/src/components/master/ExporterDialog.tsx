import { useEffect, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'

import { ExporterInput, type ExporterRecord } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMasterMutations } from '@/hooks/useMaster'
import { applyIpcError } from '@/lib/form'

const EMPTY: ExporterInput = {
  companyName: '',
  companyAddress: '',
  contactNumber: '',
  email: '',
  taxId: '',
  ieCode: '',
  panNumber: '',
  gstinNumber: '',
  stateCode: '',
  authorizedName: '',
  authorizedDesignation: '',
  companyPrefix: 'INV',
  invoiceYear: '',
  lastInvoiceNumber: 0
}

/**
 * The exporting company, shared by the Admin Panel and the wizard's Add button.
 *
 * Grouped and explained rather than presented as fourteen equal boxes: the
 * person filling this in knows what a GSTIN is but has no reason to guess that
 * "Invoice prefix" and "Last invoice number" together decide what the next
 * invoice will be called.
 */
export const ExporterDialog = ({
  open,
  onOpenChange,
  editing = null,
  onSaved
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: ExporterRecord | null
  onSaved?: (record: ExporterRecord) => void
}): JSX.Element => {
  const mutations = useMasterMutations('exporter', {
    created: 'Company added',
    updated: 'Company updated',
    removed: 'Company removed'
  })

  const form = useForm<ExporterInput>({
    resolver: zodResolver(ExporterInput),
    defaultValues: EMPTY
  })

  const { reset } = form
  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? {
            companyName: editing.companyName,
            companyAddress: editing.companyAddress,
            contactNumber: editing.contactNumber,
            email: editing.email,
            taxId: editing.taxId,
            ieCode: editing.ieCode,
            panNumber: editing.panNumber,
            gstinNumber: editing.gstinNumber,
            stateCode: editing.stateCode,
            authorizedName: editing.authorizedName,
            authorizedDesignation: editing.authorizedDesignation,
            companyPrefix: editing.companyPrefix,
            invoiceYear: editing.invoiceYear,
            lastInvoiceNumber: editing.lastInvoiceNumber
          }
        : { ...EMPTY, invoiceYear: currentFiscalYear() }
    )
  }, [open, editing, reset])

  // Shown live under the numbering fields, so what those three boxes actually
  // produce is visible before the first invoice is created rather than after.
  const nextNumber = [
    form.watch('companyPrefix') || '—',
    String((Number(form.watch('lastInvoiceNumber')) || 0) + 1).padStart(4, '0'),
    form.watch('invoiceYear') || '—'
  ].join('/')

  const onSubmit = async (values: ExporterInput): Promise<void> => {
    try {
      const record = editing
        ? await mutations.update(editing.id, values)
        : await mutations.create(values)
      onOpenChange(false)
      onSaved?.(record)
    } catch (error) {
      applyIpcError(error, form.setError)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit company' : 'Add a company'}</DialogTitle>
          <DialogDescription>
            This is the company whose name and letterhead appear on the documents. Its details are
            copied onto each invoice as it is created, so changing them later never alters an
            invoice already issued.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Group title="Company">
              <Field name="companyName" label="Company name" className="md:col-span-2" />
              <Field
                name="companyAddress"
                label="Address"
                multiline
                className="md:col-span-2"
                help="Printed exactly as typed, line breaks included."
              />
              <Field name="contactNumber" label="Phone number" />
              <Field name="email" label="Email address" type="email" />
            </Group>

            <Group title="Registration numbers">
              <Field name="ieCode" label="IE code" help="Import Export code." />
              <Field name="gstinNumber" label="GSTIN" />
              <Field name="panNumber" label="PAN" />
              <Field name="taxId" label="Tax ID" />
              <Field name="stateCode" label="State code" help="Two digits, e.g. 24 for Gujarat." />
            </Group>

            <Group title="Who signs the documents">
              <Field name="authorizedName" label="Name" />
              <Field name="authorizedDesignation" label="Job title" help="e.g. Partner, Director." />
            </Group>

            <Group title="Invoice numbering">
              <Field
                name="companyPrefix"
                label="Prefix"
                help="Starts every invoice number, e.g. INV."
              />
              <Field name="invoiceYear" label="Financial year" help="Written as 2025-26." />
              <FormField
                control={form.control}
                name="lastInvoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last number used</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormDescription>The next invoice takes this number plus one.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label className="text-sm">Next invoice will be</Label>
                <div className="flex h-10 items-center rounded-md border bg-gray-50 px-3 font-mono text-sm">
                  {nextNumber}
                </div>
              </div>
            </Group>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {editing ? 'Save changes' : 'Add company'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/** April to March, which is the Indian financial year the documents use. */
const currentFiscalYear = (): string => {
  const now = new Date()
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

const Group = ({ title, children }: { title: string; children: ReactNode }): JSX.Element => (
  <fieldset className="space-y-4">
    <legend className="mb-3 text-sm font-semibold text-gray-900">{title}</legend>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  </fieldset>
)

const Field = ({
  name,
  label,
  type = 'text',
  help,
  multiline,
  className
}: {
  name: keyof ExporterInput
  label: string
  type?: string
  help?: string
  multiline?: boolean
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field }) => (
      <FormItem className={className}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          {multiline ? (
            <Textarea rows={3} {...field} value={String(field.value ?? '')} />
          ) : (
            <Input type={type} {...field} value={String(field.value ?? '')} />
          )}
        </FormControl>
        {help && <FormDescription>{help}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)
