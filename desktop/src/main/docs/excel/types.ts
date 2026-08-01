/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The shape the ExcelJS code reads.
 *
 * This is deliberately the web app's `getInvoiceById` response, typo for typo:
 * `currancy_type`, `product_details.nos`, `product_section`. The generator has
 * 8,000 lines of cell arithmetic keyed off these names, and renaming them would
 * mean editing every one of those lines. The typos die at the database layer
 * instead — mapper.ts translates from the normalised tables into this shape.
 */
export interface LegacyInvoiceData {
  invoice_number: string
  invoice_date: string
  integrated_tax: string
  payment_term: string
  product_type: string
  currancy_type: string
  currancy_rate: string | number
  exporter: Record<string, any>
  buyer: Record<string, any>
  shipping: Record<string, any>
  package: Record<string, any>
  product_details: Record<string, any>
  suppliers: Record<string, any>[]
  annexure: Record<string, any>
  vgm: Record<string, any>
  [key: string]: any
}

/** An image read off disk, with the dimensions ExcelJS needs to place it. */
export interface LoadedImage {
  buffer: ArrayBuffer
  extension: string
  width: number
  height: number
}

/** One generated file, before it is written to the documents tree. */
export interface GeneratedWorkbook {
  fileName: string
  buffer: ArrayBuffer
}
