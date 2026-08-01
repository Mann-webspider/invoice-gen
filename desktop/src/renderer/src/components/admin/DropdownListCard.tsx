import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit2, Loader2, Plus, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { FieldsDialog } from '@/components/master/FieldsDialog'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'
import { applyIpcError } from '@/lib/form'

/**
 * A single-value dropdown list — port of loading, place of receipt, unit type
 * and so on. Add, rename, delete and reorder.
 *
 * Reordering writes a real `position` column. The web app's reorder endpoint
 * rewrote each row's *value* into a new slot, which silently changed what every
 * existing id meant.
 */
export const DropdownListCard = ({
  category,
  title,
  description,
  placeholder
}: {
  category: string
  title: string
  description?: string
  placeholder: string
}): JSX.Element => {
  const { data: options = [], isPending } = useMasterList('dropdownOption', category)
  const mutations = useMasterMutations('dropdownOption', {
    created: `${title} added`,
    updated: `${title} updated`,
    removed: `${title} removed`
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const move = async (index: number, direction: -1 | 1): Promise<void> => {
    const next = [...options]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    try {
      await mutations.reorder(next.map((option) => option.id))
    } catch (error) {
      applyIpcError(error)
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>

      <div className="divide-y rounded-lg border">
        {isPending && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}

        {!isPending && options.length === 0 && (
          <p className="p-4 text-sm text-gray-500">Nothing added yet.</p>
        )}

        {options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-1 px-3 py-1.5">
            <span className="flex-1 truncate text-sm">{option.value}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === 0}
              aria-label={`Move ${option.value} up`}
              onClick={() => void move(index, -1)}
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === options.length - 1}
              aria-label={`Move ${option.value} down`}
              onClick={() => void move(index, 1)}
            >
              <ChevronDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={`Rename ${option.value}`}
              onClick={() => {
                setEditing({ id: option.id, value: option.value })
                setDialogOpen(true)
              }}
            >
              <Edit2 />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700"
              aria-label={`Delete ${option.value}`}
              onClick={() => setPendingDelete(option.id)}
            >
              <Trash />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
      >
        <Plus />
        Add
      </Button>

      <FieldsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `Rename ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}
        description="This is offered in the invoice form."
        fields={[{ key: 'value', label: title, placeholder }]}
        initial={editing ? { value: editing.value } : undefined}
        submitLabel={editing ? 'Save changes' : 'Add'}
        onSave={async (values) => {
          if (editing) {
            await mutations.update(editing.id, { category, value: values.value, isActive: true })
          } else {
            await mutations.create({ category, value: values.value, isActive: true })
          }
        }}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete this ${title.toLowerCase()}?`}
        description="It stops being offered on new invoices. Invoices already created keep the value they were saved with."
        onConfirm={() => {
          if (pendingDelete) void mutations.remove(pendingDelete).catch(applyIpcError)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
