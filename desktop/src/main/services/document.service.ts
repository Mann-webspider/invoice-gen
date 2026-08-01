import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { shell } from 'electron'
import { AppError } from '@shared/result'
import type { DocumentFile, GenerateDocumentsResult } from '@shared/contracts'
import { paths } from '../storage/paths'
import { log } from '../log'
import { getInvoice } from './invoice.service'
import { toLegacyInvoiceData } from '../docs/mapper'
import { generateWorkbooks } from '../docs/excel'
import { generateDocx } from '../docs/docx'
import { loadImage } from '../docs/excel/images'
import { setImageRegistry } from '../docs/excel/loadImageBuffer'

/**
 * Generates an invoice's documents and writes them to the documents tree.
 *
 * The web app made these in the browser, uploaded each workbook back to the
 * server over HTTP, and had PHP re-parse and merge them. Everything happens in
 * this process now: no upload, no round trip, and no temp files with colliding
 * names.
 */

/** documents/{fiscalYear}/{prefix}/{number}/ — same layout as the web app. */
const invoiceDirectory = (invoiceNumber: string): string => {
  const [prefix = 'INV', sequence = '0000', fiscalYear = 'unknown'] = invoiceNumber.split('/')
  return paths.invoiceDocuments(fiscalYear, prefix, sequence)
}

const describe = (directory: string, name: string): DocumentFile => {
  const file = join(directory, name)
  const stats = statSync(file)
  return {
    name,
    path: file,
    sizeBytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
    kind: name.toLowerCase().endsWith('.pdf')
      ? 'pdf'
      : name.toLowerCase().endsWith('.docx')
        ? 'docx'
        : 'xlsx'
  }
}

export const listDocuments = (invoiceId: string): DocumentFile[] => {
  const invoice = getInvoice(invoiceId)
  const directory = invoiceDirectory(invoice.invoice.invoice_number)
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((name) => !name.startsWith('.'))
    .map((name) => describe(directory, name))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const generateDocuments = async (
  invoiceId: string,
  onProgress: (step: string, title: string, status: 'running' | 'completed') => void
): Promise<GenerateDocumentsResult> => {
  const invoice = getInvoice(invoiceId)
  const data = toLegacyInvoiceData(invoice)

  const exporterId = invoice.invoice.exporter.id
  const assetDir = exporterId ? join(paths.assets(), 'exporters', exporterId) : ''
  const images = exporterId
    ? {
        header: loadImage(join(assetDir, 'header.png')),
        footer: loadImage(join(assetDir, 'footer.png')),
        signature: loadImage(join(assetDir, 'signature.png'))
      }
    : {}

  // The sheets ask for images by the keys the mapper wrote into the data.
  setImageRegistry({
    [`image:header:${exporterId}`]: images.header,
    [`image:footer:${exporterId}`]: images.footer,
    [`image:signature:${exporterId}`]: images.signature
  })

  const directory = invoiceDirectory(invoice.invoice.invoice_number)

  const result = await generateWorkbooks(data, images, (step, title) => {
    onProgress(step, title, 'running')
  })

  for (const workbook of result.workbooks) {
    writeFileSync(join(directory, workbook.fileName), Buffer.from(workbook.buffer))
    onProgress(workbook.fileName.replace('.xlsx', ''), workbook.fileName, 'completed')
  }

  onProgress('DOCX', 'Word document', 'running')
  const docxName = `${invoice.invoice.invoice_number.replace(/\//g, '-')}-doc.docx`
  writeFileSync(join(directory, docxName), await generateDocx(data))
  onProgress('DOCX', 'Word document', 'completed')

  log.info(`Generated ${result.workbooks.length + 1} documents for ${invoice.invoice.invoice_number}`)

  return {
    directory,
    baseFileName: result.fileName,
    files: listDocuments(invoiceId)
  }
}

/** Opens a document in whatever the client has associated with the type. */
export const openDocument = async (file: string): Promise<null> => {
  assertInsideDocuments(file)
  const error = await shell.openPath(file)
  if (error) throw new AppError('IO', error)
  return null
}

export const revealDocument = (file: string): null => {
  assertInsideDocuments(file)
  shell.showItemInFolder(file)
  return null
}

/**
 * The renderer passes a path back, so confirm it is inside the documents tree
 * before handing it to the shell. The web app's equivalent endpoint took a
 * client-supplied path and stripped '..' from it with str_replace.
 */
const assertInsideDocuments = (file: string): void => {
  const root = paths.documents()
  if (!file.startsWith(root)) throw AppError.forbidden('That file is outside the documents folder')
  if (!existsSync(file)) throw AppError.notFound('Document')
}
