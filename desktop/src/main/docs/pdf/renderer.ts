import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { promisify } from 'node:util'
import ExcelJS from 'exceljs'
import { AppError } from '@shared/result'
import { log } from '../../log'

const run = promisify(execFile)

/**
 * xlsx -> pdf.
 *
 * Behind an interface because LibreOffice is the one thing this application
 * cannot install for the client. Swapping in a Chromium `printToPDF` renderer
 * later is a matter of adding a second implementation here; nothing else has to
 * change.
 */
export interface PdfRenderer {
  readonly name: string
  isAvailable: () => Promise<boolean>
  /** Converts one workbook and returns the written PDF path. */
  render: (xlsxPath: string, outputDir: string, pdfBaseName: string) => Promise<string>
}

/* ------------------------------------------------------------------ *
 * Locating LibreOffice
 * ------------------------------------------------------------------ */

const WINDOWS_CANDIDATES = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files\\LibreOffice 7\\program\\soffice.exe'
]

const UNIX_CANDIDATES = [
  '/usr/bin/soffice',
  '/usr/local/bin/soffice',
  '/opt/libreoffice/program/soffice',
  '/Applications/LibreOffice.app/Contents/MacOS/soffice'
]

/** Asks the registry where LibreOffice was installed, for non-default paths. */
const fromWindowsRegistry = async (): Promise<string | null> => {
  const keys = [
    'HKLM\\SOFTWARE\\LibreOffice\\UNO\\InstallPath',
    'HKLM\\SOFTWARE\\WOW6432Node\\LibreOffice\\UNO\\InstallPath'
  ]
  for (const key of keys) {
    try {
      const { stdout } = await run('reg', ['query', key, '/ve'])
      const match = stdout.match(/REG_SZ\s+(.+)/)
      if (!match) continue
      const candidate = join(match[1].trim(), 'soffice.exe')
      if (existsSync(candidate)) return candidate
    } catch {
      // Key absent — try the next one.
    }
  }
  return null
}

let cached: string | null | undefined

export const findLibreOffice = async (): Promise<string | null> => {
  if (cached !== undefined) return cached

  const candidates = process.platform === 'win32' ? WINDOWS_CANDIDATES : UNIX_CANDIDATES
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      cached = candidate
      log.info(`Found LibreOffice at ${candidate}`)
      return cached
    }
  }

  if (process.platform === 'win32') {
    const fromRegistry = await fromWindowsRegistry()
    if (fromRegistry) {
      cached = fromRegistry
      log.info(`Found LibreOffice via registry at ${fromRegistry}`)
      return cached
    }
  } else {
    try {
      const { stdout } = await run('which', ['soffice'])
      const found = stdout.trim()
      if (found) {
        cached = found
        return cached
      }
    } catch {
      // Not on PATH.
    }
  }

  cached = null
  log.warn('LibreOffice not found; PDF conversion is unavailable')
  return null
}

/** Lets the first-run screen re-check after the client installs it. */
export const forgetLibreOffice = (): void => {
  cached = undefined
}

/* ------------------------------------------------------------------ *
 * Conversion
 * ------------------------------------------------------------------ */

/**
 * Widens each sheet's print area to its content plus five rows, exactly as the
 * PHP did before handing the file to LibreOffice. Applied to a temporary copy
 * only — the workbook the client receives keeps its original setup.
 */
const withPrintArea = async (xlsxPath: string, destination: string): Promise<void> => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(xlsxPath)

  workbook.eachSheet((sheet) => {
    const lastRow = sheet.rowCount + 5
    const lastColumn = sheet.columnCount
    const columnLetter = sheet.getColumn(lastColumn).letter
    sheet.pageSetup = { ...sheet.pageSetup, printArea: `A1:${columnLetter}${lastRow}` }
  })

  await workbook.xlsx.writeFile(destination)
}

export const libreOfficeRenderer: PdfRenderer = {
  name: 'LibreOffice',

  isAvailable: async () => (await findLibreOffice()) !== null,

  render: async (xlsxPath, outputDir, pdfBaseName) => {
    const soffice = await findLibreOffice()
    if (!soffice) {
      throw new AppError(
        'DEPENDENCY_MISSING',
        'LibreOffice is required to produce PDFs and was not found on this machine.'
      )
    }

    // A unique directory per conversion. The PHP wrote its temp file to
    // sys_get_temp_dir() under a fixed name, so two invoices converting at once
    // overwrote each other's input.
    const workDir = mkdtempSync(join(tmpdir(), `invoicegen-${randomUUID().slice(0, 8)}-`))

    try {
      const stagedXlsx = join(workDir, `${pdfBaseName}.xlsx`)
      await withPrintArea(xlsxPath, stagedXlsx)

      // -env:UserInstallation gives this conversion its own LibreOffice profile,
      // so it works even when the client has LibreOffice open.
      await run(
        soffice,
        [
          `-env:UserInstallation=file:///${workDir.replace(/\\/g, '/')}/profile`,
          '--headless',
          '--norestore',
          '--convert-to',
          'pdf',
          stagedXlsx,
          '--outdir',
          workDir
        ],
        { timeout: 120_000, windowsHide: true }
      )

      const produced = readdirSync(workDir).find((name) => name.toLowerCase().endsWith('.pdf'))
      if (!produced) {
        throw new AppError('IO', `LibreOffice produced no PDF for ${basename(xlsxPath)}`)
      }

      const destination = join(outputDir, `${pdfBaseName}.pdf`)
      const { copyFileSync } = await import('node:fs')
      copyFileSync(join(workDir, produced), destination)
      return destination
    } finally {
      rmSync(workDir, { recursive: true, force: true })
    }
  }
}
