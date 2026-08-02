/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildContext } from './context'
import { setImageRegistry } from './loadImageBuffer'
import { initialSheetState, type SheetState } from './state'
import { buildCustomInvoice } from './sheets/customInvoice'
import { buildWorksheetCopy } from './sheets/worksheetCopy'
import { buildPackingList } from './sheets/packingList'
import { buildAnnexure } from './sheets/annexure'
import { buildVgm } from './sheets/vgm'
import { buildCustomerInvoice } from './sheets/ci'
import { buildPackingListCopy } from './sheets/pl'
import type { GeneratedWorkbook, LegacyInvoiceData, LoadedImage } from './types'

/**
 * Runs the seven sheets in order and returns their buffers.
 *
 * Order matters and is not incidental: the worksheet copy divides freight and
 * insurance by the running line count the custom invoice left behind, and the
 * annexure reads the product type the earlier sheets settled on. That coupling
 * was invisible when all seven lived in one function scope; SheetState makes it
 * explicit without changing what any of them compute.
 */

export interface GenerateResult {
  /** e.g. "0089 - POLAND - LCL" — the prefix the PDFs are named with. */
  fileName: string
  workbooks: GeneratedWorkbook[]
}

export type ProgressReporter = (step: string, title: string) => void

export const generateWorkbooks = async (
  data: LegacyInvoiceData,
  images: { header?: LoadedImage; footer?: LoadedImage; signature?: LoadedImage },
  onProgress: ProgressReporter = () => undefined
): Promise<GenerateResult> => {
  // The sheets fetch images by the same url key the data carries.
  setImageRegistry({
    [data.exporter?.header ?? '__header']: images.header,
    [data.exporter?.footer ?? '__footer']: images.footer,
    [data.exporter?.signature ?? '__signature']: images.signature
  })

  /**
   * Every sheet guards its image block with `if (signatureUrl)` and then
   * destructures the result, so a url that resolves to nothing crashes the
   * whole generation. The mapper hands over a url for any exporter that has an
   * id, whether or not a letterhead was ever uploaded — which is every company
   * added from inside the wizard. Clear the urls we have no image for, so the
   * guards do what they were written to do.
   */
  const withRealImages = {
    ...data,
    exporter: data.exporter && {
      ...data.exporter,
      header: images.header ? data.exporter.header : null,
      footer: images.footer ? data.exporter.footer : null,
      signature: images.signature ? data.exporter.signature : null
    }
  }

  const ctx = await buildContext(withRealImages, images)
  let state: SheetState = initialSheetState()
  // Sheets built so far. The worksheet copy reads cells straight off the custom
  // invoice's sheet, so the objects have to travel with the state.
  let built: Record<string, any> = {}

  const workbooks: GeneratedWorkbook[] = []
  const emit = async (workbook: any, fileName: string): Promise<void> => {
    workbooks.push({ fileName, buffer: await workbook.xlsx.writeBuffer() })
  }

  onProgress('CUSTOM_INVOICE', 'Custom invoice')
  const customInvoice = await buildCustomInvoice(ctx, state, built)
  state = customInvoice.state
  built = customInvoice.built
  await emit(customInvoice.workbook, 'CUSTOM_INVOICE.xlsx')

  // The worksheet copy is the FOB working sheet; a FOB invoice does not get one.
  if (ctx.termsOfDeliveryMain !== 'FOB') {
    onProgress('WORKSHEET_COPY', 'Worksheet copy')
    const worksheetCopy = await buildWorksheetCopy(ctx, state, built)
    state = worksheetCopy.state
  built = worksheetCopy.built
    await emit(worksheetCopy.workbook, 'WORKSHEET_COPY.xlsx')
  }

  onProgress('PACKING_LIST', 'Packing list')
  const packingList = await buildPackingList(ctx, state, built)
  state = packingList.state
  built = packingList.built
  await emit(packingList.workbook, 'PACKING_LIST.xlsx')

  onProgress('ANNEXURE', 'Annexure')
  const annexure = await buildAnnexure(ctx, state, built)
  state = annexure.state
  built = annexure.built
  await emit(annexure.workbook, 'ANNEXURE.xlsx')

  onProgress('VGM', 'VGM')
  const vgm = await buildVgm(ctx, state, built)
  state = vgm.state
  built = vgm.built
  await emit(vgm.workbook, 'VGM.xlsx')

  onProgress('CI', 'Customer invoice')
  const ci = await buildCustomerInvoice(ctx, state, built)
  state = ci.state
  built = ci.built
  await emit(ci.workbook, 'CI.xlsx')

  onProgress('PL', 'Packing list copy')
  const pl = await buildPackingListCopy(ctx, state, built)
  state = pl.state
  built = pl.built
  await emit(pl.workbook, 'PL.xlsx')

  const invoiceNo = String(data.invoice_number ?? '')
  const fileName =
    ctx.containerType === 'FCL'
      ? `${invoiceNo.split('/')[1]} - ${ctx.finalDestination} - ${ctx.marksAndNos}ft`
      : `${invoiceNo.split('/')[1]} - ${ctx.finalDestination} - ${ctx.containerType}`

  return { fileName, workbooks }
}
