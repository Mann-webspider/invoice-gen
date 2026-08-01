import { useState } from 'react'
import { Edit2, Loader2, Plus, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { applyIpcError } from '@/lib/form'

interface PairField {
  key: string
  label: string
  placeholder: string
}

interface PairRow {
  id: string
  [key: string]: string | number | boolean
}

/**
 * A two-column master list: description + HSN code, size + SQM, port of
 * discharge + final destination. Identical interaction in all three, so they
 * share one component rather than three near-identical blocks.
 */
export const PairListCard = ({
  title,
  fields,
  rows,
  isPending,
  isMutating,
  onCreate,
  onUpdate,
  onDelete
}: {
  title: string
  fields: [PairField, PairField]
  rows: PairRow[]
  isPending: boolean
  isMutating: boolean
  onCreate: (values: Record<string, string>) => Promise<unknown>
  onUpdate: (id: string, values: Record<string, string>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}): JSX.Element => {
  const empty = { [fields[0].key]: '', [fields[1].key]: '' }

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>(empty)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const openAdd = (): void => {
    setEditingId(null)
    setValues(empty)
    setDialogOpen(true)
  }

  const openEdit = (row: PairRow): void => {
    setEditingId(row.id)
    setValues({
      [fields[0].key]: String(row[fields[0].key] ?? ''),
      [fields[1].key]: String(row[fields[1].key] ?? '')
    })
    setDialogOpen(true)
  }

  const complete = fields.every((field) => values[field.key]?.trim())

  const save = async (): Promise<void> => {
    if (!complete) return
    const trimmed = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()])
    )
    try {
      if (editingId) await onUpdate(editingId, trimmed)
      else await onCreate(trimmed)
      setDialogOpen(false)
    } catch (error) {
      applyIpcError(error)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="font-semibold">{title}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        {isPending ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Nothing added yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{fields[0].label}</TableHead>
                <TableHead>{fields[1].label}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{String(row[fields[0].key])}</TableCell>
                  <TableCell>{String(row[fields[1].key])}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Edit"
                        onClick={() => openEdit(row)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Delete"
                        onClick={() => setPendingDelete(row.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit' : 'Add'} {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={values[field.key] ?? ''}
                  placeholder={field.placeholder}
                  autoFocus={index === 0}
                  onChange={(event) =>
                    setValues((previous) => ({ ...previous, [field.key]: event.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} disabled={!complete || isMutating}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete this ${title.toLowerCase()} entry?`}
        description="Invoices already created keep the values they were saved with."
        onConfirm={() => {
          if (pendingDelete) void onDelete(pendingDelete).catch(applyIpcError)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
