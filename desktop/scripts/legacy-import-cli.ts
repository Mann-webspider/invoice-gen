import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { importLegacyDatabase } from '../src/main/import/legacyImport'
import type { DuplicateStrategy } from '../src/main/import/legacyTypes'

/**
 * Runs the legacy importer outside Electron, for verifying a real client
 * database before the first-run wizard ever touches it.
 *
 *   npm run import:legacy -- --source ../backend/database --out ./tmp/import
 *   npm run import:legacy -- --source ../backend/database --out ./tmp/import --dry-run
 */

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}
const flag = (name: string): boolean => process.argv.includes(`--${name}`)

const sourceDir = resolve(arg('source') ?? '../backend/database')
const outDir = resolve(arg('out') ?? './tmp/import')
const strategy = (arg('duplicates') ?? 'keep-latest') as DuplicateStrategy
const dryRun = flag('dry-run')

if (!existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`)
  process.exit(1)
}

if (flag('fresh') && existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
mkdirSync(join(outDir, 'data'), { recursive: true })

const report = importLegacyDatabase({
  legacyDbFile: join(sourceDir, 'database.sqlite'),
  legacyUploadsDir: join(sourceDir, 'uploads'),
  legacyDataDir: join(sourceDir, 'data'),
  targetDbFile: join(outDir, 'data', 'invoice.db'),
  targetAssetsDir: join(outDir, 'assets'),
  targetDocumentsDir: join(outDir, 'documents'),
  duplicateStrategy: strategy,
  dryRun
})

console.log('\n=== Rows imported ===')
for (const [table, rows] of Object.entries(report.imported).sort()) {
  console.log(`  ${table.padEnd(22)} ${rows}`)
}

if (report.duplicateInvoices.length > 0) {
  console.log('\n=== Duplicate invoice numbers ===')
  for (const entry of report.duplicateInvoices) {
    console.log(
      `  ${entry.invoiceNumber}: kept ${entry.keptId}` +
        (entry.droppedIds.length ? `, dropped ${entry.droppedIds.join(', ')}` : '')
    )
  }
}

if (report.brokenReferences.length > 0) {
  console.log('\n=== Broken references ===')
  for (const ref of report.brokenReferences) {
    console.log(`  ${ref.table}.${ref.column} row ${ref.rowId} -> missing ${ref.missingId}`)
  }
}

if (report.orphanAssets.length > 0) {
  console.log('\n=== Orphan asset folders (exporter no longer exists) ===')
  for (const id of report.orphanAssets) console.log(`  ${id}`)
}

console.log('\n=== Invoice numbering seeds ===')
for (const seq of report.sequences) {
  console.log(`  exporter ${seq.exporterId}  ${seq.fiscalYear}  last=${seq.last}`)
}

console.log('\n=== Files ===')
console.log(`  asset files copied:    ${report.assetsCopied}`)
console.log(`  document files copied: ${report.documentsCopied}`)

if (report.warnings.length > 0) {
  console.log('\n=== Warnings ===')
  for (const warning of report.warnings) console.log(`  ${warning}`)
}

console.log(`\nCompleted in ${report.durationMs}ms -> ${outDir}`)
