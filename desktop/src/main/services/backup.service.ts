import Database from 'better-sqlite3'
import { app, dialog } from 'electron'
import { copyFileSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { AppError } from '@shared/result'
import type { BackupFile, RestoreResult } from '@shared/contracts'
import { closeDatabase, getConnection, openDatabase } from '../db/client'
import { migrations } from '../db/migrations'
import { paths } from '../storage/paths'
import { log } from '../log'

/**
 * Local database backups.
 *
 * `VACUUM INTO` writes a consistent copy while the database is open, which is
 * the difference that matters: the web app's backup copied the file with the
 * server still writing to it, and its WAL sidecar was not copied at all, so a
 * backup taken under load could be torn.
 */

const stamp = (): string =>
  new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+$/, '')

const describe = (file: string): BackupFile => {
  const stats = statSync(file)
  return {
    name: basename(file),
    path: file,
    sizeBytes: stats.size,
    createdAt: stats.mtime.toISOString()
  }
}

export const listBackups = (): BackupFile[] => {
  const directory = paths.backups()
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((name) => name.endsWith('.db'))
    .map((name) => describe(join(directory, name)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const createBackup = (): BackupFile => {
  const destination = join(paths.backups(), `backup_${stamp()}.db`)
  if (existsSync(destination)) throw AppError.conflict('A backup with that name already exists')

  // VACUUM INTO cannot use a bound parameter for the path.
  getConnection().exec(`VACUUM INTO '${destination.replace(/'/g, "''")}'`)
  log.info(`Created backup ${destination}`)
  return describe(destination)
}

export const removeBackup = (file: string): null => {
  assertIsBackup(file)
  rmSync(file)
  log.info(`Deleted backup ${basename(file)}`)
  return null
}

/** Copies a backup somewhere the client chooses — a USB stick, a synced folder. */
export const exportBackup = async (file: string): Promise<string | null> => {
  assertIsBackup(file)
  const result = await dialog.showSaveDialog({
    title: 'Save a copy of this backup',
    defaultPath: basename(file),
    filters: [{ name: 'SQLite database', extensions: ['db'] }]
  })
  if (result.canceled || !result.filePath) return null

  copyFileSync(file, result.filePath)
  return result.filePath
}

/**
 * Replaces the live database with a backup.
 *
 * The candidate is opened and checked before anything is overwritten, and the
 * current database is set aside first. The web app accepted any upload whose
 * MIME type was application/octet-stream and wrote it straight over the live
 * file — on an endpoint that required no authentication.
 */
export const restoreBackup = (file: string): RestoreResult => {
  const source = existsSync(file) ? file : null
  if (!source) throw AppError.notFound('Backup')

  verifyCandidate(source)

  const live = paths.dbFile()
  const safety = join(paths.backups(), `pre-restore_${stamp()}.db`)

  // Take a copy of what is about to be replaced, so a restore is undoable.
  getConnection().exec(`VACUUM INTO '${safety.replace(/'/g, "''")}'`)
  closeDatabase()

  try {
    copyFileSync(source, live)
    // The old WAL and shm belong to the database that was just replaced.
    for (const suffix of ['-wal', '-shm']) {
      if (existsSync(live + suffix)) rmSync(live + suffix)
    }
  } catch (error) {
    // Put the original back before surfacing the failure.
    copyFileSync(safety, live)
    openDatabase()
    throw new AppError('IO', `Restore failed and the previous database was put back: ${error}`)
  }

  openDatabase()
  log.info(`Restored from ${basename(source)}`)

  return {
    restoredFrom: basename(source),
    safetyCopy: basename(safety),
    // A restore swaps the schema out from under every open query.
    requiresRestart: true
  }
}

/** Opens the candidate read-only and refuses anything that is not this app's database. */
const verifyCandidate = (file: string): void => {
  let candidate: Database.Database
  try {
    candidate = new Database(file, { readonly: true, fileMustExist: true })
  } catch {
    throw new AppError('VALIDATION', 'That file is not a readable SQLite database')
  }

  // better-sqlite3 opens lazily, so a file that is not a database only fails on
  // the first statement. Without this the client picking the wrong file saw
  // "Something went wrong" instead of being told what was wrong with it.
  try {
    inspect(candidate)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('VALIDATION', 'That file is not a valid SQLite database')
  } finally {
    candidate.close()
  }
}

const inspect = (candidate: Database.Database): void => {
  {
    const integrity = candidate.pragma('integrity_check', { simple: true })
    if (integrity !== 'ok') {
      throw new AppError('VALIDATION', `That backup is damaged: ${String(integrity)}`)
    }

    const version = candidate.pragma('user_version', { simple: true }) as number
    if (version === 0) {
      throw new AppError('VALIDATION', 'That database has no schema version and is not a backup of this application')
    }
    if (version > migrations.length) {
      throw new AppError(
        'VALIDATION',
        `That backup was made by a newer version of the application (schema ${version}, this build knows ${migrations.length}).`
      )
    }

    const hasInvoices = candidate
      .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='invoice'")
      .get()
    if (!hasInvoices) {
      throw new AppError('VALIDATION', 'That database does not contain invoice data')
    }
  }
}

const assertIsBackup = (file: string): void => {
  if (!file.startsWith(paths.backups())) {
    throw AppError.forbidden('That file is outside the backups folder')
  }
  if (!existsSync(file)) throw AppError.notFound('Backup')
}

/** Lets the renderer offer a restart after a restore. */
export const relaunch = (): null => {
  app.relaunch()
  app.exit(0)
  return null
}
