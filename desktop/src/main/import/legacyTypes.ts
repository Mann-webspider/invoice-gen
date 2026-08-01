/**
 * Row shapes as they actually exist in the web app's database.sqlite.
 *
 * Every field is `unknown`-ish on purpose: columns declared INT hold 30503.98,
 * '583 BOX' and '-', and NOT NULL was rarely enforced, so nothing here can be
 * trusted to have the type its DDL claims. `text()` and `num()` in
 * legacyImport.ts do the narrowing.
 */

export type LegacyValue = string | number | null | undefined | Buffer

export interface LegacyRow {
  [column: string]: LegacyValue
}

/** Strategy for the duplicate invoice numbers the live database contains. */
export type DuplicateStrategy = 'keep-latest' | 'keep-all-suffixed'

export interface ImportOptions {
  legacyDbFile: string
  /** backend/database/uploads — copied to assets/. Optional. */
  legacyUploadsDir?: string
  /** backend/database/data — copied to documents/. Optional. */
  legacyDataDir?: string
  targetDbFile: string
  targetAssetsDir: string
  targetDocumentsDir: string
  /**
   * How to resolve rows sharing an invoice number. The live data has
   * INV/0018/2024-25 three times.
   */
  duplicateStrategy?: DuplicateStrategy
  /** Roll everything back at the end. Used by the verification run. */
  dryRun?: boolean
}

export interface ImportReport {
  /** table -> rows written */
  imported: Record<string, number>
  /** Invoices skipped or renamed because their number was already taken. */
  duplicateInvoices: { invoiceNumber: string; keptId: string; droppedIds: string[] }[]
  /** Referenced ids that did not resolve; the row was still imported. */
  brokenReferences: { table: string; rowId: string; column: string; missingId: string }[]
  /** Master data that no longer had a matching row, e.g. asset folders. */
  orphanAssets: string[]
  assetsCopied: number
  documentsCopied: number
  /** Sequence seeds written, for the client to sanity-check numbering. */
  sequences: { exporterId: string; fiscalYear: string; last: number }[]
  warnings: string[]
  durationMs: number
}
