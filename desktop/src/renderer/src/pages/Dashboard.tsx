import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  FilePlus2,
  FileText,
  FolderOpen,
  Loader2,
  PencilLine,
  RefreshCw,
  Search,
  Trash
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog'
import { ProcessQueue } from '@/components/ProcessQueue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ipc } from '@/lib/ipc'
import { applyIpcError, toastSuccess } from '@/lib/form'

/**
 * The first screen after signing in.
 *
 * Two questions get answered before anything else: what was I in the middle of,
 * and how do I start a new one. Everything the client had to remember before —
 * that the icon-only buttons on each row meant view, regenerate and delete —
 * is now written on the buttons.
 */
export const Dashboard = (): JSX.Element => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const invoices = useQuery({ queryKey: ['invoices'], queryFn: ipc.invoice.list })
  const drafts = useQuery({ queryKey: ['drafts'], queryFn: ipc.draft.list })

  const [pendingInvoice, setPendingInvoice] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<string | null>(null)
  const [documentsFor, setDocumentsFor] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const documents = useQuery({
    queryKey: ['documents', documentsFor],
    queryFn: () => ipc.document.list(documentsFor as string),
    enabled: documentsFor !== null
  })

  const generate = useMutation({
    mutationFn: ipc.document.generate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
      toastSuccess('Documents ready')
    },
    onError: (error) => applyIpcError(error),
    onSettled: () => setJobId(null)
  })

  const runGenerate = (invoiceId: string): void => {
    setDocumentsFor(invoiceId)
    // The panel filters on the job id the main process stamps each event with.
    setJobId(crypto.randomUUID())
    generate.mutate(invoiceId)
  }

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
    navigate(`/${lastPage || 'invoice'}/drafts/${id}`)
  }

  const visibleInvoices = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return invoices.data ?? []
    return (invoices.data ?? []).filter((invoice) =>
      [invoice.invoiceNumber, invoice.exporterName, invoice.consignee, invoice.invoiceDate]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    )
  }, [invoices.data, query])

  const draftCount = drafts.data?.length ?? 0

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Everything created on this computer. Nothing is sent anywhere.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/invoice">
            <FilePlus2 />
            Create a new invoice
          </Link>
        </Button>
      </div>

      {/* Unfinished work first: it is the thing most likely to be looked for. */}
      {draftCount > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Not finished yet
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {drafts.data?.map((draft) => (
              <Card key={draft.id} className="border-amber-200 bg-amber-50/50">
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium text-gray-900">
                      <PencilLine className="h-4 w-4 shrink-0 text-amber-600" />
                      <span className="truncate">
                        {draft.invoiceNumber || 'No number yet'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Stopped on <span className="capitalize">{stepName(draft.lastPage)}</span> ·{' '}
                      {new Date(draft.updatedAt).toLocaleString()}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => resume(draft.id, draft.lastPage)}>
                        Continue
                        <ArrowRight />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-100 hover:text-red-700"
                        onClick={() => setPendingDraft(draft.id)}
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Completed invoices
          </h2>
          {(invoices.data?.length ?? 0) > 5 && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                placeholder="Search number, buyer or date"
                className="pl-9"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {invoices.isPending ? (
              <Spinner />
            ) : (invoices.data?.length ?? 0) === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  No invoices yet. The button above walks you through it in four steps.
                </p>
              </div>
            ) : visibleInvoices.length === 0 ? (
              <p className="p-12 text-center text-sm text-gray-500">Nothing matches that search.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Lines</TableHead>
                    <TableHead className="w-72 text-right">Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{invoice.invoiceDate}</TableCell>
                      <TableCell className="max-w-40 truncate">{invoice.exporterName}</TableCell>
                      <TableCell className="max-w-48 truncate">{invoice.consignee}</TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {invoice.currencyType} {invoice.totalPrice}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {invoice.productCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDocumentsFor(invoice.id)}
                          >
                            <FileText />
                            Open
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={generate.isPending}
                            title="Build the Excel, Word and PDF files again from the saved invoice"
                            onClick={() => runGenerate(invoice.id)}
                          >
                            <RefreshCw className={generate.isPending ? 'animate-spin' : undefined} />
                            Rebuild
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-700"
                            aria-label={`Delete invoice ${invoice.invoiceNumber}`}
                            onClick={() => setPendingInvoice(invoice.id)}
                          >
                            <Trash />
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
      </section>

      <Dialog open={documentsFor !== null} onOpenChange={(open) => !open && setDocumentsFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents</DialogTitle>
            <DialogDescription>
              Saved on this computer. Open uses whichever program normally handles the file.
            </DialogDescription>
          </DialogHeader>

          {documents.isPending ? (
            <Spinner />
          ) : documents.data?.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Nothing built yet. Use <strong>Rebuild</strong> on the invoice row.
            </p>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {documents.data?.map((file) => (
                <li key={file.path} className="flex items-center gap-3 py-2">
                  <span className="flex-1 truncate text-sm">{file.name}</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {Math.round(file.sizeBytes / 1024)} KB
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void ipc.document.open(file.path).catch(applyIpcError)}
                  >
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label={`Show ${file.name} in its folder`}
                    title="Show in folder"
                    onClick={() => void ipc.document.reveal(file.path).catch(applyIpcError)}
                  >
                    <FolderOpen />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <ProcessQueue jobId={jobId} />

      <ConfirmDeleteDialog
        open={pendingDraft !== null}
        onOpenChange={(open) => !open && setPendingDraft(null)}
        title="Discard this unfinished invoice?"
        description="Everything typed into it so far is thrown away. This cannot be undone."
        onConfirm={() => {
          if (pendingDraft) removeDraft.mutate(pendingDraft)
          setPendingDraft(null)
        }}
      />

      <ConfirmDeleteDialog
        open={pendingInvoice !== null}
        onOpenChange={(open) => !open && setPendingInvoice(null)}
        title="Delete this invoice?"
        description="The invoice and all of its products, containers and suppliers are removed. Documents already saved to disk stay where they are. This cannot be undone."
        onConfirm={() => {
          if (pendingInvoice) removeInvoice.mutate(pendingInvoice)
          setPendingInvoice(null)
        }}
      />
    </div>
  )
}

/** Draft rows store the route segment; this is what the client saw on screen. */
const stepName = (lastPage: string): string =>
  ({
    invoice: 'invoice details',
    'packaging-list': 'packing list',
    annexure: 'annexure',
    'vgm-form': 'container weights'
  })[lastPage] ?? 'invoice details'

const Spinner = (): JSX.Element => (
  <div className="flex justify-center p-10">
    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
  </div>
)
