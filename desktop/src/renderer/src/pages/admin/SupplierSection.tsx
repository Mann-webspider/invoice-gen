import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Edit2, Loader2, Plus, Trash } from 'lucide-react'

import { SupplierInput, type SupplierRecord } from '@shared/contracts'
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
import { Textarea } from '@/components/ui/textarea'
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
import { applyIpcError } from '@/lib/form'

const emptySupplier: SupplierInput = {
  name: '',
  address: '',
  gstinNumber: '',
  permission: ''
}

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

  const form = useForm<SupplierInput>({
    resolver: zodResolver(SupplierInput),
    defaultValues: emptySupplier
  })

  const openAdd = (): void => {
    setEditing(null)
    form.reset(emptySupplier)
    setDialogOpen(true)
  }

  const openEdit = (supplier: SupplierRecord): void => {
    setEditing(supplier)
    form.reset({
      name: supplier.name,
      address: supplier.address,
      gstinNumber: supplier.gstinNumber,
      permission: supplier.permission
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: SupplierInput): Promise<void> => {
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
        <h2 className="text-xl font-bold">Supplier Details</h2>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add New Supplier
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold">Saved Suppliers</h3>
        </div>
        <div className="p-4">
          {isPending ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : suppliers.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No suppliers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.gstinNumber}</TableCell>
                    <TableCell className="max-w-md truncate text-sm text-gray-600">
                      {supplier.address}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Edit ${supplier.name}`}
                          onClick={() => openEdit(supplier)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Delete ${supplier.name}`}
                          onClick={() => setPendingDelete(supplier)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription>
              Suppliers appear on the invoice form and in the annexure.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier name</FormLabel>
                    <FormControl>
                      <Input autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstinNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Self-sealing permission</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormDescription>
                      Printed on the annexure. Leave blank if not applicable.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
