import { useState } from 'react'
import { Edit2, Loader2, Plus, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { FieldsDialog } from '@/components/master/FieldsDialog'
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
 *
 * The add and edit form is the same `FieldsDialog` the wizard opens from beside
 * a picker, so there is one form per record shape rather than one per screen.
 */
export const PairListCard = ({
  title,
  addLabel,
  fields,
  rows,
  isPending,
  onCreate,
  onUpdate,
  onDelete
}: {
  title: string
  /** Wording of the button, e.g. "Add a size". */
  addLabel: string
  fields: [PairField, PairField]
  rows: PairRow[]
  isPending: boolean
  onCreate: (values: Record<string, string>) => Promise<unknown>
  onUpdate: (id: string, values: Record<string, string>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}): JSX.Element => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initial, setInitial] = useState<Record<string, string>>({})
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const openAdd = (): void => {
    setEditingId(null)
    setInitial({})
    setDialogOpen(true)
  }

  const openEdit = (row: PairRow): void => {
    setEditingId(row.id)
    setInitial({
      [fields[0].key]: String(row[fields[0].key] ?? ''),
      [fields[1].key]: String(row[fields[1].key] ?? '')
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        {isPending ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">Nothing added yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>{fields[0].label}</TableHead>
                <TableHead>{fields[1].label}</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
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
                        aria-label={`Edit ${String(row[fields[0].key])}`}
                        onClick={() => openEdit(row)}
                      >
                        <Edit2 />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Delete ${String(row[fields[0].key])}`}
                        onClick={() => setPendingDelete(row.id)}
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
      </div>

      <Button type="button" variant="outline" size="sm" onClick={openAdd}>
        <Plus />
        {addLabel}
      </Button>

      <FieldsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? `Edit ${title.toLowerCase()}` : addLabel}
        fields={fields}
        initial={initial}
        submitLabel={editingId ? 'Save changes' : 'Add'}
        onSave={async (values) => {
          if (editingId) await onUpdate(editingId, values)
          else await onCreate(values)
        }}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete this ${title.toLowerCase()}?`}
        description="It stops being offered on new invoices. Invoices already created keep the values they were saved with."
        onConfirm={() => {
          if (pendingDelete) void onDelete(pendingDelete).catch(applyIpcError)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
