import { readFileSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'

/**
 * Merges the per-sheet PDFs into one.
 *
 * The PHP built a combined *workbook* first — loading all seven files into
 * PhpSpreadsheet, copying their sheets into one document, then running that
 * through LibreOffice a second time. Merging the PDFs that already exist gives
 * the same result for one less conversion pass and without PhpSpreadsheet's
 * sheet-copy limits.
 */
export const mergePdfs = async (sources: string[], destination: string): Promise<number> => {
  const merged = await PDFDocument.create()

  for (const source of sources) {
    const document = await PDFDocument.load(readFileSync(source))
    const pages = await merged.copyPages(document, document.getPageIndices())
    for (const page of pages) merged.addPage(page)
  }

  writeFileSync(destination, await merged.save())
  return merged.getPageCount()
}

/**
 * Order the sheets appear in the combined PDF, matching PdfController::convert.
 * A FOB invoice has no worksheet copy — that sheet is the working sheet used to
 * spread freight and insurance, which FOB terms do not carry.
 */
export const combineOrder = (paymentTerm: string): string[] => {
  const isFob = paymentTerm.trim().toUpperCase() === 'FOB'
  return [
    'CUSTOM_INVOICE',
    ...(isFob ? [] : ['WORKSHEET_COPY']),
    'PACKING_LIST',
    'ANNEXURE',
    'VGM',
    'CI',
    'PL'
  ]
}
