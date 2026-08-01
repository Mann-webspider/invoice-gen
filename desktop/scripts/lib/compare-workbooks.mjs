import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import ExcelJS from 'exceljs'

/**
 * Compares the workbooks this application produced against the ones the old web
 * application left on disk, cell by cell.
 *
 * Only values are compared, not formatting: `docs:compare` already proves the
 * port lays cells out identically to the original generator, so anything that
 * differs here is a difference in the data that reached it, which is the whole
 * question this script exists to answer.
 */

/** ExcelJS hands back rich text and formula wrappers; flatten to plain text. */
const asText = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((part) => part.text).join('')
    if ('result' in value) return asText(value.result)
    if ('text' in value) return String(value.text)
    if (value instanceof Date) return value.toISOString()
    return ''
  }
  // 14400 and "14400" are the same invoice total; only the shape differs.
  return String(value).trim()
}

const readSheet = async (path) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)
  const sheet = workbook.worksheets[0]
  const cells = new Map()
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const text = asText(cell.value)
      if (text !== '') cells.set(cell.address, text)
    })
  })
  return { name: sheet.name, cells }
}

/**
 * The produced files are named after the invoice, the originals after the
 * document; match on the document suffix both share.
 */
const findProduced = (folder, originalName) => {
  const stem = originalName.replace(/\.xlsx$/i, '')
  const candidates = readdirSync(folder).filter((entry) => entry.toLowerCase().endsWith('.xlsx'))
  return (
    candidates.find((entry) => entry === originalName) ??
    candidates.find((entry) => entry.toUpperCase().includes(stem.toUpperCase())) ??
    null
  )
}

export const compareWorkbooks = async (originalsFolder, producedFolder, mapping, invoiceNumber) => {
  const sheets = []

  for (const [originalName] of Object.entries(mapping)) {
    const originalPath = join(originalsFolder, originalName)
    if (!existsSync(originalPath)) {
      sheets.push({ name: originalName, missing: 'no original', differences: [], compared: 0 })
      continue
    }

    const producedName = findProduced(producedFolder, originalName)
    if (!producedName) {
      sheets.push({ name: originalName, missing: 'not produced', differences: [], compared: 0 })
      continue
    }

    const original = await readSheet(originalPath)
    const produced = await readSheet(join(producedFolder, producedName))

    const addresses = new Set([...original.cells.keys(), ...produced.cells.keys()])
    const differences = []
    for (const address of addresses) {
      const before = original.cells.get(address) ?? ''
      const after = produced.cells.get(address) ?? ''
      if (before === after) continue
      // The invoice number is the one value deliberately rewritten when the
      // script runs with --number; never report that as a discrepancy.
      if (before.includes(invoiceNumber) && after.includes(invoiceNumber)) continue
      differences.push({ cell: address, original: before, produced: after })
    }

    differences.sort((a, b) => a.cell.localeCompare(b.cell, undefined, { numeric: true }))

    /**
     * The cell-by-cell diff is only meaningful when both sheets have the same
     * shape. One extra printed line pushes everything below it down a row and
     * every cell after that reports as different, which says nothing about
     * whether any value was lost. This second pass ignores position and asks
     * the question that matters: is every value that was on the original still
     * somewhere on the new sheet, and has anything appeared that was not?
     */
    /**
     * Distinct values, not counts. A merged cell repeats its text across every
     * column it spans, so counting occurrences turns a one-column difference in
     * a merge range into dozens of phantom findings.
     */
    const before = new Set(original.cells.values())
    const after = new Set(produced.cells.values())

    const missing = [...before].filter(
      (value) => !after.has(value) && !value.includes(invoiceNumber)
    )
    const added = [...after].filter(
      (value) => !before.has(value) && !value.includes(invoiceNumber)
    )

    sheets.push({
      name: originalName,
      producedAs: producedName,
      compared: addresses.size,
      /** Values on the original that are nowhere on the new sheet. */
      missing: missing.sort(),
      /** Values on the new sheet that were nowhere on the original. */
      added: added.sort(),
      differences
    })
  }

  return {
    invoiceNumber,
    originalsFolder,
    producedFolder,
    totalMissing: sheets.reduce((sum, sheet) => sum + (sheet.missing?.length ?? 0), 0),
    totalAdded: sheets.reduce((sum, sheet) => sum + (sheet.added?.length ?? 0), 0),
    sheets
  }
}
