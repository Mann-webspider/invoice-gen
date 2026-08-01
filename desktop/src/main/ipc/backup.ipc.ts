import { z } from 'zod'
import { CH } from '@shared/ipc-channels'
import type { BackupFile } from '@shared/contracts'
import * as backups from '../services/backup.service'
import { requireAdmin, requireUser } from '../services/auth.service'
import { handle } from './guard'

const ByPath = z.object({ path: z.string().min(1) })

/**
 * Restoring replaces every invoice on the machine, so it is an administrator
 * action. In the web app the equivalent endpoint was anonymous.
 */
export const registerBackupIpc = (): void => {
  handle(CH.backup.list, null, (): BackupFile[] => {
    requireUser()
    return backups.listBackups()
  })

  handle(CH.backup.create, null, (): BackupFile => {
    requireUser()
    return backups.createBackup()
  })

  handle(CH.backup.remove, ByPath, (input) => {
    requireAdmin()
    return backups.removeBackup(input.path)
  })

  handle(CH.backup.export, ByPath, async (input) => {
    requireUser()
    return { savedTo: await backups.exportBackup(input.path) }
  })

  handle(CH.backup.restore, ByPath, (input) => {
    requireAdmin()
    return backups.restoreBackup(input.path)
  })

  handle(CH.backup.relaunch, null, () => {
    requireAdmin()
    return backups.relaunch()
  })
}
