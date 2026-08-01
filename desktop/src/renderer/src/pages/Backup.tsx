import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, HardDriveDownload, Loader2, Plus, RotateCcw, Trash } from 'lucide-react'

import type { BackupFile } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog'
import { useAuth } from '@/context/AuthContext'
import { ipc } from '@/lib/ipc'
import { applyIpcError, toastSuccess } from '@/lib/form'

const formatSize = (bytes: number): string =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

export const Backup = (): JSX.Element => {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<BackupFile | null>(null)
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(null)

  const backups = useQuery({ queryKey: ['backups'], queryFn: ipc.backup.list })
  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['backups'] })
  }

  const create = useMutation({
    mutationFn: ipc.backup.create,
    onSuccess: (file) => {
      invalidate()
      toastSuccess(`Backup created (${formatSize(file.sizeBytes)})`)
    },
    onError: (error) => applyIpcError(error)
  })

  const remove = useMutation({
    mutationFn: ipc.backup.remove,
    onSuccess: () => {
      invalidate()
      toastSuccess('Backup deleted')
    },
    onError: (error) => applyIpcError(error)
  })

  const exportCopy = useMutation({
    mutationFn: ipc.backup.export,
    onSuccess: (result) => {
      if (result.savedTo) toastSuccess(`Saved to ${result.savedTo}`)
    },
    onError: (error) => applyIpcError(error)
  })

  const restore = useMutation({
    mutationFn: ipc.backup.restore,
    onSuccess: (result) => {
      queryClient.clear()
      toastSuccess(
        `Restored from ${result.restoredFrom}. The previous database was kept as ${result.safetyCopy}.`
      )
    },
    onError: (error) => applyIpcError(error)
  })

  const visible = (backups.data ?? []).filter((file) =>
    file.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900">Backup</h1>
          <p className="mt-1 text-sm text-gray-500">
            A backup is a complete copy of every invoice, draft and setting on this computer, taken
            at one moment. Make one before any large change.
          </p>
        </div>
        <Button size="lg" disabled={create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          Back up now
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Backups on this computer</CardTitle>
          <Input
            value={search}
            placeholder="Search"
            className="max-w-xs"
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          {backups.isPending ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : visible.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              {backups.data?.length === 0
                ? 'No backups yet. Press “Back up now” to make the first one.'
                : 'Nothing matches that search.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((file) => (
                  <TableRow key={file.path}>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(file.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{formatSize(file.sizeBytes)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          title="Save a copy somewhere else, such as a USB drive"
                          onClick={() => exportCopy.mutate(file.path)}
                        >
                          <Download />
                          Save a copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isAdmin}
                          title={
                            isAdmin
                              ? 'Replace everything on this computer with this backup'
                              : 'Only an administrator can restore'
                          }
                          onClick={() => setPendingRestore(file)}
                        >
                          <RotateCcw />
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-700"
                          disabled={!isAdmin}
                          aria-label={`Delete ${file.name}`}
                          onClick={() => setPendingDelete(file)}
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

      <Card>
        <CardContent className="p-4 text-sm text-gray-600 flex gap-3">
          <HardDriveDownload className="h-5 w-5 shrink-0 text-gray-400" />
          <p>
            Backups live next to the database in this machine&apos;s application data folder, so
            they are lost with the machine. Use <strong>Save a copy</strong> to keep one somewhere
            else.
          </p>
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingRestore !== null}
        onOpenChange={(open) => !open && setPendingRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore {pendingRestore?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Every invoice, draft and setting on this machine is replaced by the contents of this
              backup. The current database is kept as a pre-restore copy first, so this can be
              undone. Restart the application afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRestore) restore.mutate(pendingRestore.path)
                setPendingRestore(null)
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name ?? 'this backup'}?`}
        description="The backup file is removed from this machine. The live database is not affected."
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.path)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
