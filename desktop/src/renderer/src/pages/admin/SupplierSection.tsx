import { useMemo, useState } from 'react'
import { Edit2, Loader2, Plus, Search, Trash } from 'lucide-react'

import type { SupplierRecord } from '@shared/contracts'
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
import { SectionHeader } from '@/components/admin/SectionHeader'
import { SupplierDialog } from '@/components/master/SupplierDialog'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'
import { applyIpcError } from '@/lib/form'

export const SupplierSection = (): JSX.Element => {
  const { data: suppliers = [], isPending } = useMasterList('supplier')
  const mutations = useMasterMutations('supplier', {
    created: 'Supplier added',
    updated: 'Supplier updated',
    removed: 'Supplier removed'
  })

  const [editing, setEditing] = useState<SupplierRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SupplierRecord | null>(null)
  const [query, setQuery] = useState('')

  // Imported client data runs to dozens of suppliers; scrolling a table to find
  // one to correct is the whole reason this box exists.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return suppliers
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(needle) ||
        supplier.gstinNumber.toLowerCase().includes(needle)
    )
  }, [suppliers, query])

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Suppliers"
        description="The factories the goods come from. They appear on the invoice and, as the manufacturer, on the annexure."
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus />
            Add a supplier
          </Button>
        }
      />

      {suppliers.length > 4 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            placeholder="Search by name or GSTIN"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : visible.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">
              {suppliers.length === 0 ? 'No suppliers yet.' : 'Nothing matches that search.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="font-mono text-xs">{supplier.gstinNumber}</TableCell>
                    <TableCell className="max-w-md truncate text-sm text-gray-600">
                      {supplier.address}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(supplier)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit2 />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Delete ${supplier.name}`}
                          onClick={() => setPendingDelete(supplier)}
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

      <SupplierDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name ?? 'this supplier'}?`}
        description="Invoices already created keep their own copy of these details and are not affected."
        onConfirm={() => {
          if (pendingDelete) void mutations.remove(pendingDelete.id).catch(applyIpcError)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
