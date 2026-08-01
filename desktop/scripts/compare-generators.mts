import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import ExcelJS from 'exceljs'

/**
 * Golden-file comparison.
 *
 * Runs the untouched ui/src/lib/excelGenerator.ts and the ported
 * desktop/src/main/docs/excel on identical input, then diffs every cell of
 * every sheet. The original is browser code, so a temporary derivative is
 * written with its three browser-only dependencies stubbed — the 8,000 lines of
 * cell arithmetic are not touched.
 */

const ROOT = 'D:/workspace/Web-app/invoice-gen'
const SCRATCH =
  'C:/Users/maand/AppData/Local/Temp/claude/D--workspace-Web-app-invoice-gen/f90c74a1-ad22-4ce6-98a5-67337f9a780f/scratchpad'

/* ---------- build a runnable copy of the original ---------- */

const original = readFileSync(`${ROOT}/ui/src/lib/excelGenerator.ts`, 'utf8')

const patched = original
  .replace(`import { saveAs } from 'file-saver';`, '')
  .replace(`import { Palette } from 'lucide-react';`, '')
  // The original fetches its logos over HTTP and measures them with
  // createImageBitmap. Both sides are given the same images from disk instead,
  // so the image-placement code runs identically in each.
  .replace(
    /export const loadImageBuffer = async \([\s\S]*?\n\};/,
    `export const loadImageBuffer = async (url: string): Promise<any> =>
      (globalThis as any).__testImages?.[url];`
  )

mkdirSync('scripts/.tmp-orig', { recursive: true })
writeFileSync('scripts/.tmp-orig/excelGenerator.ts', patched, 'utf8')

/* ---------- run both ---------- */

const data = JSON.parse(readFileSync('scripts/fixture-invoice.json', 'utf8'))

/* ---------- give both sides the same images ---------- */

const { loadImage } = await import(`file:///${ROOT}/desktop/src/main/docs/excel/images.ts`)

const assetDir = `${ROOT}/backend/database/uploads/exporters/${data.exporter.id ?? ''}`
const exporterAssetDir = readFileSync
  ? `${ROOT}/backend/database/uploads/exporters/9f8f3e9d-a6aa-4ffc-8db4-9ea139969444`
  : assetDir

const images = {
  header: loadImage(`${exporterAssetDir}/header.png`),
  footer: loadImage(`${exporterAssetDir}/footer.png`),
  signature: loadImage(`${exporterAssetDir}/signature.png`)
}
console.log(
  'images:',
  Object.entries(images)
    .map(([k, v]: [string, any]) => `${k}=${v ? `${v.width}x${v.height}` : 'missing'}`)
    .join(' ')
)
;(globalThis as any).__testImages = {
  [data.exporter.header]: images.header,
  [data.exporter.footer]: images.footer,
  [data.exporter.signature]: images.signature
}

const { generateInvoiceExcel } = await import('./.tmp-orig/excelGenerator.ts')
const { generateWorkbooks } = await import(
  `file:///${ROOT}/desktop/src/main/docs/excel/index.ts`
)

console.log('running original…')
const before = await generateInvoiceExcel(structuredClone(data))
console.log('running ported…')
const after = await generateWorkbooks(structuredClone(data), images)

console.log(`\noriginal fileName: ${before.fileName}`)
console.log(`ported   fileName: ${after.fileName}`)
console.log(
  `original sheets: ${before.allBuffers.map((b: any) => b.fileName).join(', ')}`
)
console.log(`ported   sheets: ${after.workbooks.map((b: any) => b.fileName).join(', ')}`)

/* ---------- compare ---------- */

const describe = (cell: ExcelJS.Cell): string =>
  JSON.stringify({
    v: cell.value instanceof Date ? cell.value.toISOString() : cell.value,
    f: cell.numFmt ?? null,
    b: cell.border ?? null,
    a: cell.alignment ?? null,
    n: cell.font ?? null,
    l: cell.fill ?? null
  })

const readSheets = async (buffer: ArrayBuffer): Promise<Map<string, Map<string, string>>> => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as never)
  const sheets = new Map<string, Map<string, string>>()

  workbook.eachSheet((sheet) => {
    const cells = new Map<string, string>()
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = `${rowNumber}:${colNumber}`
        const value = describe(cell)
        // Skip cells that are entirely empty in both, to keep the diff readable.
        if (value !== '{"v":null,"f":null,"b":null,"a":null,"n":null,"l":null}') {
          cells.set(key, value)
        }
      })
    })
    // Merges and column widths are part of the printed layout.
    const extras: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const range of Object.keys((sheet as any)._merges ?? {})) extras.push(`merge:${range}`)
    sheet.columns?.forEach((column, index) => {
      if (column?.width) extras.push(`width:${index}:${column.width}`)
      if (column?.hidden) extras.push(`hidden:${index}`)
    })
    cells.set('__layout__', extras.sort().join('|'))
    sheets.set(sheet.name, cells)
  })
  return sheets
}

let totalCells = 0
let mismatches = 0
const report: string[] = []

for (const originalFile of before.allBuffers) {
  const portedFile = after.workbooks.find((w: any) => w.fileName === originalFile.fileName)
  if (!portedFile) {
    report.push(`MISSING in ported: ${originalFile.fileName}`)
    mismatches++
    continue
  }

  const a = await readSheets(originalFile.buffer)
  const b = await readSheets(portedFile.buffer)

  for (const [sheetName, cellsA] of a) {
    const cellsB = b.get(sheetName)
    if (!cellsB) {
      report.push(`${originalFile.fileName}: sheet ${sheetName} missing in ported`)
      mismatches++
      continue
    }

    const keys = new Set([...cellsA.keys(), ...cellsB.keys()])
    for (const key of keys) {
      totalCells++
      const va = cellsA.get(key)
      const vb = cellsB.get(key)
      if (va !== vb) {
        mismatches++
        if (report.length < 25) {
          report.push(`${originalFile.fileName} [${sheetName}] ${key}\n    original: ${va}\n    ported:   ${vb}`)
        }
      }
    }
  }
}

console.log(`\n=== compared ${totalCells} cells across ${before.allBuffers.length} workbooks ===`)
if (mismatches === 0) {
  console.log('IDENTICAL — every cell, format, border, merge and column width matches.')
} else {
  console.log(`${mismatches} mismatches`)
  console.log(report.join('\n'))
}
