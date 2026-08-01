import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { FilePlus2, FileText, Loader2, Trash } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog'
import { ipc } from '@/lib/ipc'
import { applyIpcError, toastSuccess } from '@/lib/form'

/**
 * Phase 3 dashboard: invoices and resumable drafts. The full version, with
 * document listing and regeneration, lands in phase 5.
 */
export const Dashboard = (): JSX.Element => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const invoices = useQuery({ queryKey: ['invoices'], queryFn: ipc.invoice.list })
  const drafts = useQuery({ queryKey: ['drafts'], queryFn: ipc.draft.list })

  const [pendingInvoice, setPendingInvoice] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<string | null>(null)

  const removeInvoice = useMutation({
    mutationFn: ipc.invoice.remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toastSuccess('Invoice deleted')
    },
    onError: (error) => applyIpcError(error)
  })

  const removeDraft = useMutation({
    mutationFn: ipc.draft.remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['drafts'] })
      toastSuccess('Draft deleted')
    },
    onError: (error) => applyIpcError(error)
  })

  /** Reopens a draft at whichever step it was left on. */
  const resume = (id: string, lastPage: string): void => {
    const step = lastPage || 'invoice'
    navigate(`/${step}/drafts/${id}`)
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="Dashboard"
        description="Invoices and drafts on this machine"
        action={
          <Button asChild>
            <Link to="/invoice">
              <FilePlus2 className="h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Drafts in progress</CardTitle>
        </CardHeader>
        <CardContent>
          {drafts.isPending ? (
            <Spinner />
          ) : drafts.data?.length === 0 ? (
            <p className="text-sm text-gray-500">No drafts. Start a new invoice to create one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice number</TableHead>
                  <TableHead>Last step</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.data?.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="font-medium">
                      {draft.invoiceNumber || <span className="text-gray-400">Unnumbered</span>}
                    </TableCell>
                    <TableCell className="capitalize">
                      {draft.lastPage.replace('-', ' ') || 'invoice'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(draft.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resume(draft.id, draft.lastPage)}
                        >
                          Resume
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label="Delete draft"
                          onClick={() => setPendingDraft(draft.id)}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.isPending ? (
            <Spinner />
          ) : invoices.data?.length === 0 ? (
            <p className="text-sm text-gray-500">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Exporter</TableHead>
                  <TableHead>Consignee</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.data?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.invoiceDate}</TableCell>
                    <TableCell>{invoice.exporterName}</TableCell>
                    <TableCell className="max-w-48 truncate">{invoice.consignee}</TableCell>
                    <TableCell>
                      {invoice.currencyType} {invoice.totalPrice}
                    </TableCell>
                    <TableCell>{invoice.productCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" disabled title="Arrives in phase 5">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label="Delete invoice"
                          onClick={() => setPendingInvoice(invoice.id)}
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
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={pendingDraft !== null}
        onOpenChange={(open) => !open && setPendingDraft(null)}
        title="Delete this draft?"
        description="The unfinished invoice is discarded. This cannot be undone."
        onConfirm={() => {
          if (pendingDraft) removeDraft.mutate(pendingDraft)
          setPendingDraft(null)
        }}
      />

      <ConfirmDeleteDialog
        open={pendingInvoice !== null}
        onOpenChange={(open) => !open && setPendingInvoice(null)}
        title="Delete this invoice?"
        description="The invoice and all of its products, containers and suppliers are removed. This cannot be undone."
        onConfirm={() => {
          if (pendingInvoice) removeInvoice.mutate(pendingInvoice)
          setPendingInvoice(null)
        }}
      />
    </div>
  )
}

const Spinner = (): JSX.Element => (
  <div className="p-6 flex justify-center">
    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
  </div>
)
