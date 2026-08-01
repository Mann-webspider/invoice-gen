import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'

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
import { useMasterMutations } from '@/hooks/useMaster'
import { applyIpcError } from '@/lib/form'

const EMPTY: SupplierInput = { name: '', address: '', gstinNumber: '', permission: '' }

/**
 * The factory the goods came from, shared by the Admin Panel and the wizard.
 *
 * Only the name is truly needed to get an invoice moving, so the self-sealing
 * permission — a paragraph of legal text almost nobody has to hand mid-invoice —
 * says plainly that it can be left empty and filled in later.
 */
export const SupplierDialog = ({
  open,
  onOpenChange,
  editing = null,
  onSaved
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: SupplierRecord | null
  onSaved?: (record: SupplierRecord) => void
}): JSX.Element => {
  const mutations = useMasterMutations('supplier', {
    created: 'Supplier added',
    updated: 'Supplier updated',
    removed: 'Supplier removed'
  })

  const form = useForm<SupplierInput>({
    resolver: zodResolver(SupplierInput),
    defaultValues: EMPTY
  })

  const { reset } = form
  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? {
            name: editing.name,
            address: editing.address,
            gstinNumber: editing.gstinNumber,
            permission: editing.permission
          }
        : EMPTY
    )
  }, [open, editing, reset])

  const onSubmit = async (values: SupplierInput): Promise<void> => {
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
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit supplier' : 'Add a supplier'}</DialogTitle>
          <DialogDescription>
            Suppliers appear on the invoice and, as the manufacturer, on the annexure.
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
                  <FormLabel>GSTIN</FormLabel>
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
                    Optional. Printed word for word on the annexure when this supplier is the
                    manufacturer. Safe to leave empty and add later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {editing ? 'Save changes' : 'Add supplier'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
