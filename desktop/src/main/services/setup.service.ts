import { dialog } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { AppError } from '@shared/result'
import type { ImportSummary, SetupState } from '@shared/contracts'
import { closeDatabase, getDb, openDatabase } from '../db/client'
import { importLegacyDatabase } from '../import/legacyImport'
import { findLibreOffice, forgetLibreOffice } from '../docs/pdf/renderer'
import { paths } from '../storage/paths'
import { log } from '../log'

/**
 * First run.
 *
 * Three things the client has to settle before the app is useful: whether to
 * bring the old system's data across, who signs in, and whether PDFs can be
 * produced on this machine. The web app had none of this — it was deployed by
 * hand onto a server that already had its database.
 */

const countRows = (table: string): number => {
  const row = getDb().get<{ n: number }>(sql.raw(`SELECT COUNT(*) AS n FROM ${table}`))
  return row?.n ?? 0
}

export const getSetupState = async (): Promise<SetupState> => {
  const libreOffice = await findLibreOffice()
  return {
    hasData: countRows('invoice') > 0 || countRows('exporter_master') > 0,
    invoiceCount: countRows('invoice'),
    exporterCount: countRows('exporter_master'),
    libreOfficePath: libreOffice,
    dataFolder: paths.root()
  }
}

/** Re-checks after the client installs LibreOffice without restarting. */
export const recheckLibreOffice = async (): Promise<SetupState> => {
  forgetLibreOffice()
  return getSetupState()
}

/**
 * Asks for the old `backend/database` folder and imports it.
 *
 * The picker looks for database.sqlite so the client can point at the folder
 * they were given rather than having to find the file inside it.
 */
export const importFromOldSystem = async (): Promise<ImportSummary | null> => {
  const picked = await dialog.showOpenDialog({
    title: 'Choose the previous system’s database folder',
    message: 'Select the folder that contains database.sqlite',
    properties: ['openDirectory']
  })
  if (picked.canceled || picked.filePaths.length === 0) return null

  const source = picked.filePaths[0]
  const legacyDbFile = existsSync(join(source, 'database.sqlite'))
    ? join(source, 'database.sqlite')
    : existsSync(join(source, 'database', 'database.sqlite'))
      ? join(source, 'database', 'database.sqlite')
      : null

  if (!legacyDbFile) {
    throw new AppError(
      'VALIDATION',
      'No database.sqlite in that folder. Choose the backend/database folder from the old system.'
    )
  }

  if (countRows('invoice') > 0) {
    throw AppError.conflict(
      'This machine already has invoices. Importing now would duplicate them; restore an empty backup first.'
    )
  }

  // The importer opens the target itself, so hand the file over.
  closeDatabase()
  try {
    const report = importLegacyDatabase({
      legacyDbFile,
      legacyUploadsDir: join(source, 'uploads'),
      legacyDataDir: join(source, 'data'),
      targetDbFile: paths.dbFile(),
      targetAssetsDir: paths.assets(),
      targetDocumentsDir: paths.documents(),
      duplicateStrategy: 'keep-latest'
    })

    log.info(`Imported from ${legacyDbFile}`)

    return {
      invoices: report.imported.invoice ?? 0,
      products: report.imported.invoice_product ?? 0,
      exporters: report.imported.exporter_master ?? 0,
      suppliers: report.imported.supplier_master ?? 0,
      drafts: report.imported.draft ?? 0,
      users: report.imported.users ?? 0,
      assetsCopied: report.assetsCopied,
      documentsCopied: report.documentsCopied,
      duplicateInvoices: report.duplicateInvoices.map((entry) => entry.invoiceNumber),
      warnings: report.warnings
    }
  } finally {
    openDatabase()
  }
}
