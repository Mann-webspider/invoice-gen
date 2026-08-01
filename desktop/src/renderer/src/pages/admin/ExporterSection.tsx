import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Edit2, ImageOff, Loader2, Plus, Trash, Upload } from 'lucide-react'

import type { AssetKind, ExporterRecord } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog'
import { SectionHeader } from '@/components/admin/SectionHeader'
import { ExporterDialog } from '@/components/master/ExporterDialog'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'
import { ipc } from '@/lib/ipc'
import { applyIpcError, toastSuccess } from '@/lib/form'

/**
 * The exporting companies, one card each.
 *
 * A table plus a separate "Letterhead & Stamp" panel further down the page meant
 * the three images belonging to a company were nowhere near the company itself,
 * and with more than two exporters it was guesswork which row they went with.
 */
export const ExporterSection = (): JSX.Element => {
  const { data: exporters = [], isPending } = useMasterList('exporter')
  const mutations = useMasterMutations('exporter', {
    created: 'Company added',
    updated: 'Company updated',
    removed: 'Company removed'
  })

  const [editing, setEditing] = useState<ExporterRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ExporterRecord | null>(null)

  const openAdd = (): void => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (exporter: ExporterRecord): void => {
    setEditing(exporter)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Companies"
        description="The exporter whose name, address and letterhead go on the documents. Invoices keep their own copy of these details, so editing a company never changes an invoice already issued."
        action={
          <Button onClick={openAdd}>
            <Plus />
            Add a company
          </Button>
        }
      />

      {isPending ? (
        <Spinner />
      ) : exporters.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-gray-500">
              No companies yet. Add one before creating your first invoice.
            </p>
            <Button className="mt-4" onClick={openAdd}>
              <Plus />
              Add a company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exporters.map((exporter) => (
            <Card key={exporter.id}>
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{exporter.companyName}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                      {exporter.companyAddress}
                    </p>
                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                      <Detail label="IE code" value={exporter.ieCode} />
                      <Detail label="GSTIN" value={exporter.gstinNumber} />
                      <Detail label="PAN" value={exporter.panNumber} />
                      <Detail label="Email" value={exporter.email} />
                    </dl>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(exporter)}>
                      <Edit2 />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setPendingDelete(exporter)}
                    >
                      <Trash />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="rounded-md bg-gray-50 px-4 py-3 text-sm">
                  Next invoice number:{' '}
                  <span className="font-mono font-medium text-gray-900">
                    {exporter.companyPrefix}/
                    {String(exporter.lastInvoiceNumber + 1).padStart(4, '0')}/
                    {exporter.invoiceYear}
                  </span>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-gray-900">
                    Images printed on this company&apos;s documents
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <ImageSlot
                      exporterId={exporter.id}
                      kind="header"
                      label="Top of the letterhead"
                    />
                    <ImageSlot
                      exporterId={exporter.id}
                      kind="footer"
                      label="Bottom of the letterhead"
                    />
                    <ImageSlot
                      exporterId={exporter.id}
                      kind="signature"
                      label="Signature and stamp"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ExporterDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.companyName ?? 'this company'}?`}
        description="Invoices already created keep their own copy of these details and are not affected. The invoice numbering for this company is removed."
        onConfirm={() => {
          if (pendingDelete) void mutations.remove(pendingDelete.id).catch(applyIpcError)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

const Detail = ({ label, value }: { label: string; value: string }): JSX.Element => (
  <div className="flex gap-1.5">
    <dt>{label}</dt>
    <dd className="font-medium text-gray-700">{value}</dd>
  </div>
)

const Spinner = (): JSX.Element => (
  <div className="flex justify-center p-10">
    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
  </div>
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
  const { data, refetch, isPending } = useQuery({
    queryKey: ['asset', exporterId, kind],
    queryFn: () => ipc.asset.get({ exporterId, kind })
  })
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
      <Label className="text-xs text-gray-600">{label}</Label>
      <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : data?.dataUrl ? (
          <img src={data.dataUrl} alt={label} className="max-h-20 max-w-full object-contain" />
        ) : (
          <>
            <ImageOff className="h-6 w-6 text-gray-300" />
            <p className="text-xs text-gray-400">Nothing chosen</p>
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
          <Upload />
          {data?.dataUrl ? 'Replace' : 'Choose'}
        </Button>
        {data?.dataUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:bg-red-50 hover:text-red-700"
            disabled={busy}
            aria-label={`Remove ${label}`}
            onClick={() => void clear()}
          >
            <Trash />
          </Button>
        )}
      </div>
    </div>
  )
}
