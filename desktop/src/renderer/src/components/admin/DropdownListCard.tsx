import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit2, Loader2, Plus, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const openAdd = (): void => {
    setEditingId(null)
    setValue('')
    setDialogOpen(true)
  }

  const openEdit = (id: string, current: string): void => {
    setEditingId(id)
    setValue(current)
    setDialogOpen(true)
  }

  const save = async (): Promise<void> => {
    const trimmed = value.trim()
    if (!trimmed) return
    try {
      if (editingId) {
        await mutations.update(editingId, { category, value: trimmed, isActive: true })
      } else {
        await mutations.create({ category, value: trimmed, isActive: true })
      }
      setDialogOpen(false)
    } catch (error) {
      applyIpcError(error)
    }
  }

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
      <div className="flex justify-between items-center">
        <Label className="font-semibold">{title}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}

      <div className="rounded-md border bg-white divide-y">
        {isPending && (
          <div className="p-4 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}

        {!isPending && options.length === 0 && (
          <p className="p-4 text-sm text-gray-500">Nothing added yet.</p>
        )}

        {options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2 px-3 py-2">
            <span className="flex-1 text-sm">{option.value}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === 0}
              aria-label={`Move ${option.value} up`}
              onClick={() => void move(index, -1)}
            >
              <ChevronUp className="h-4 w-4" />
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
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={`Edit ${option.value}`}
              onClick={() => openEdit(option.id, option.value)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700"
              aria-label={`Delete ${option.value}`}
              onClick={() => setPendingDelete(option.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit' : 'Add'} {title}
            </DialogTitle>
            <DialogDescription>This value appears in the invoice wizard.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`${category}-value`}>Value</Label>
            <Input
              id={`${category}-value`}
              value={value}
              placeholder={placeholder}
              autoFocus
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void save()
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={!value.trim() || mutations.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete this ${title.toLowerCase()}?`}
        description="Invoices already created keep the value they were saved with."
        onConfirm={() => {
          if (pendingDelete) void mutations.remove(pendingDelete).catch(applyIpcError)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
