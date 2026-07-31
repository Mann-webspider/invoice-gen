import { app } from 'electron'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Every writable path lives under app.getPath('userData'), never the install
 * directory — otherwise an app update would wipe the client's invoices. The old
 * web app stored the database, backups, logos and generated documents inside
 * backend/database/, i.e. inside the deployed application itself.
 *
 * Resolved lazily: app.getPath() caches on first call, and main/index.ts sets
 * the app name before anything here runs.
 *
 *   %APPDATA%/InvoiceGen/
 *   ├── data/invoice.db (+ -wal, -shm)
 *   ├── backups/backup_YYYY-MM-DD_HH-mm.db
 *   ├── assets/exporters/{id}/{header|footer|signature}.png
 *   └── documents/{fiscalYear}/{prefix}/{number}/
 */

const ensure = (dir: string): string => {
  mkdirSync(dir, { recursive: true })
  return dir
}

export const paths = {
  root: (): string => app.getPath('userData'),

  data: (): string => ensure(join(paths.root(), 'data')),
  dbFile: (): string => join(paths.data(), 'invoice.db'),

  backups: (): string => ensure(join(paths.root(), 'backups')),

  assets: (): string => ensure(join(paths.root(), 'assets')),
  exporterAssets: (exporterId: string): string =>
    ensure(join(paths.assets(), 'exporters', exporterId)),

  documents: (): string => ensure(join(paths.root(), 'documents')),
  /** Matches the web app's layout, e.g. documents/2025-26/INV/0089 */
  invoiceDocuments: (fiscalYear: string, prefix: string, number: string): string =>
    ensure(join(paths.documents(), fiscalYear, prefix, number)),

  logs: (): string => ensure(join(paths.root(), 'logs'))
}

/** Create the whole tree up front so first-run code never races on mkdir. */
export const ensureStorageTree = (): void => {
  paths.data()
  paths.backups()
  paths.assets()
  paths.documents()
  paths.logs()
}
