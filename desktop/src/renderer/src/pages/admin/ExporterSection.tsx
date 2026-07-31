import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Edit2, ImageOff, Loader2, Plus, Trash, Upload } from 'lucide-react'

import { ExporterInput, type AssetKind, type ExporterRecord } from '@shared/contracts'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'
import { ipc } from '@/lib/ipc'
import { applyIpcError, toastSuccess } from '@/lib/form'

const emptyExporter: ExporterInput = {
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
  companyPrefix: '',
  invoiceYear: '',
  lastInvoiceNumber: 0
}

export const ExporterSection = (): JSX.Element => {
  const { data: exporters = [], isPending } = useMasterList('exporter')
  const mutations = useMasterMutations('exporter', {
    created: 'Exporter added',
    updated: 'Exporter updated',
    removed: 'Exporter removed'
  })

  const [editing, setEditing] = useState<ExporterRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ExporterRecord | null>(null)

  const form = useForm<ExporterInput>({
    resolver: zodResolver(ExporterInput),
    defaultValues: emptyExporter
  })

  const openAdd = (): void => {
    setEditing(null)
    form.reset(emptyExporter)
    setDialogOpen(true)
  }

  const openEdit = (exporter: ExporterRecord): void => {
    setEditing(exporter)
    form.reset({
      companyName: exporter.companyName,
      companyAddress: exporter.companyAddress,
      contactNumber: exporter.contactNumber,
      email: exporter.email,
      taxId: exporter.taxId,
      ieCode: exporter.ieCode,
      panNumber: exporter.panNumber,
      gstinNumber: exporter.gstinNumber,
      stateCode: exporter.stateCode,
      authorizedName: exporter.authorizedName,
      authorizedDesignation: exporter.authorizedDesignation,
      companyPrefix: exporter.companyPrefix,
      invoiceYear: exporter.invoiceYear,
      lastInvoiceNumber: exporter.lastInvoiceNumber
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: ExporterInput): Promise<void> => {
    try {
      if (editing) await mutations.update(editing.id, values)
      else await mutations.create(values)
      setDialogOpen(false)
    } catch (error) {
      applyIpcError(error, form.setError)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Manage Exporters</h2>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add New Exporter
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold">Saved Exporters</h3>
        </div>
        <div className="p-4">
          {isPending ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : exporters.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              No exporters yet. Add one to start creating invoices.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exporter Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IE Code</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Next Invoice</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exporters.map((exporter) => (
                  <TableRow key={exporter.id}>
                    <TableCell className="font-medium">{exporter.companyName}</TableCell>
                    <TableCell>{exporter.email}</TableCell>
                    <TableCell>{exporter.ieCode}</TableCell>
                    <TableCell>{exporter.gstinNumber}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {exporter.companyPrefix}/
                      {String(exporter.lastInvoiceNumber + 1).padStart(4, '0')}/
                      {exporter.invoiceYear}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Edit ${exporter.companyName}`}
                          onClick={() => openEdit(exporter)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Delete ${exporter.companyName}`}
                          onClick={() => setPendingDelete(exporter)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {exporters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <h3 className="font-semibold">Letterhead &amp; Stamp</h3>
          <p className="text-sm text-gray-500">
            These images are printed on the generated documents.
          </p>
          {exporters.map((exporter) => (
            <div key={exporter.id} className="border-t pt-4">
              <p className="font-medium text-sm mb-3">{exporter.companyName}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImageSlot exporterId={exporter.id} kind="header" label="Letterhead top" />
                <ImageSlot exporterId={exporter.id} kind="footer" label="Letterhead bottom" />
                <ImageSlot exporterId={exporter.id} kind="signature" label="Digital stamp" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Exporter' : 'Add New Exporter'}</DialogTitle>
            <DialogDescription>
              These details are copied onto each invoice at the moment it is created, so editing
              them later never changes an invoice that has already been issued.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField name="companyName" label="Company name" />
                <TextField name="email" label="Email" type="email" />
                <TextField name="companyAddress" label="Company address" className="md:col-span-2" />
                <TextField name="contactNumber" label="Contact number" />
                <TextField name="taxId" label="Tax ID" />
                <TextField name="ieCode" label="IE code" />
                <TextField name="panNumber" label="PAN number" />
                <TextField name="gstinNumber" label="GSTIN number" />
                <TextField name="stateCode" label="State code" />
                <TextField name="authorizedName" label="Authorised name" />
                <TextField name="authorizedDesignation" label="Authorised designation" />
                <TextField
                  name="companyPrefix"
                  label="Invoice prefix"
                  description="Appears at the start of every invoice number, e.g. INV."
                />
                <TextField
                  name="invoiceYear"
                  label="Fiscal year"
                  description="Format: 2024-25."
                />
                <FormField
                  control={form.control}
                  name="lastInvoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last invoice number</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormDescription>The next invoice uses this number plus one.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.companyName ?? 'this exporter'}?`}
        description="Invoices already created keep their own copy of these details and are not affected. Invoice numbering for this exporter is removed."
        onConfirm={() => {
          if (pendingDelete) void mutations.remove(pendingDelete.id).catch(applyIpcError)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

/** Field bound through form context, so the grid above stays readable. */
const TextField = ({
  name,
  label,
  type = 'text',
  description,
  className
}: {
  name: keyof ExporterInput
  label: string
  type?: string
  description?: string
  className?: string
}): JSX.Element => (
  <FormField
    name={name}
    render={({ field }) => (
      <FormItem className={className}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input type={type} {...field} />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)

/**
 * One letterhead image. Chosen through the OS file dialog and copied into
 * userData — the web app posted it over HTTP and saved it under whatever
 * filename the client sent.
 */
const ImageSlot = ({
  exporterId,
  kind,
  label
}: {
  exporterId: string
  kind: AssetKind
  label: string
}): JSX.Element => {
  const { data, refetch, isPending } = useMasterImage(exporterId, kind)
  const [busy, setBusy] = useState(false)

  const choose = async (): Promise<void> => {
    setBusy(true)
    try {
      await ipc.asset.pick({ exporterId, kind })
      await refetch()
      toastSuccess(`${label} updated`)
    } catch (error) {
      applyIpcError(error)
    } finally {
      setBusy(false)
    }
  }

  const clear = async (): Promise<void> => {
    setBusy(true)
    try {
      await ipc.asset.remove({ exporterId, kind })
      await refetch()
    } catch (error) {
      applyIpcError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-2 min-h-32 justify-center">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : data?.dataUrl ? (
          <img src={data.dataUrl} alt={label} className="max-h-20 max-w-full object-contain" />
        ) : (
          <>
            <ImageOff className="h-6 w-6 text-gray-300" />
            <p className="text-xs text-gray-400">No image</p>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={busy}
          onClick={() => void choose()}
        >
          <Upload className="h-4 w-4" />
          Choose
        </Button>
        {data?.dataUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            disabled={busy}
            onClick={() => void clear()}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

const useMasterImage = (
  exporterId: string,
  kind: AssetKind
): ReturnType<typeof useQuery<{ dataUrl: string | null }>> =>
  useQuery({
    queryKey: ['asset', exporterId, kind],
    queryFn: () => ipc.asset.get({ exporterId, kind })
  })
