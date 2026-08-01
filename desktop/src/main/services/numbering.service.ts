import { eq, and } from 'drizzle-orm'
import { AppError } from '@shared/result'
import type { AllocateNumberInput, AllocatedNumber } from '@shared/contracts'
import { getConnection, getDb } from '../db/client'
import { exporterMaster, invoiceSequence } from '../db/schema'
import { log } from '../log'

/**
 * Invoice number allocation.
 *
 * The web app did this:
 *
 *   $exporter = ExporterDropdown::find($id);
 *   $next = $exporter->last_invoice_number + 1;
 *   $exporter->update(['last_invoice_number' => $next]);
 *
 * — a read-modify-write with no transaction, no lock, and no UNIQUE constraint
 * on invoice.invoice_number to catch the result. The client's live database
 * contains INV/0018/2024-25 three times, written at 07:20:53, 07:22:59 and
 * 07:27:48 on 2025-10-08.
 *
 * Here the increment and the read of its result are one SQL statement, inside
 * one better-sqlite3 transaction, and invoice_number is UNIQUE.
 */

const PAD = 4

export const formatInvoiceNumber = (
  prefix: string,
  sequence: number,
  fiscalYear: string
): string => `${prefix}/${String(sequence).padStart(PAD, '0')}/${fiscalYear}`

/** Reserves the next number for an exporter and fiscal year. */
export const allocateInvoiceNumber = (input: AllocateNumberInput): AllocatedNumber => {
  const db = getDb()
  const connection = getConnection()

  const exporter = db
    .select()
    .from(exporterMaster)
    .where(eq(exporterMaster.id, input.exporterId))
    .get()
  if (!exporter) throw AppError.notFound('Exporter')

  const allocate = connection.transaction((): number => {
    const existing = db
      .select()
      .from(invoiceSequence)
      .where(
        and(
          eq(invoiceSequence.exporterId, input.exporterId),
          eq(invoiceSequence.fiscalYear, input.fiscalYear)
        )
      )
      .get()

    if (!existing) {
      db.insert(invoiceSequence)
        .values({ exporterId: input.exporterId, fiscalYear: input.fiscalYear, last: 1 })
        .run()
      return 1
    }

    const next = existing.last + 1
    db.update(invoiceSequence)
      .set({ last: next })
      .where(
        and(
          eq(invoiceSequence.exporterId, input.exporterId),
          eq(invoiceSequence.fiscalYear, input.fiscalYear)
        )
      )
      .run()
    return next
  })

  const sequence = allocate()
  const invoiceNumber = formatInvoiceNumber(
    exporter.companyPrefix,
    sequence,
    input.fiscalYear
  )

  log.info(`Allocated ${invoiceNumber}`)
  return { invoiceNumber, sequence, fiscalYear: input.fiscalYear }
}

/**
 * Called when an invoice is written, so a number reserved but abandoned (the
 * client closed the wizard) does not hold the sequence back, while a number
 * that was actually used always advances it.
 */
export const ensureSequenceAtLeast = (
  exporterId: string,
  fiscalYear: string,
  sequence: number
): void => {
  const db = getDb()
  const existing = db
    .select()
    .from(invoiceSequence)
    .where(
      and(
        eq(invoiceSequence.exporterId, exporterId),
        eq(invoiceSequence.fiscalYear, fiscalYear)
      )
    )
    .get()

  if (!existing) {
    db.insert(invoiceSequence).values({ exporterId, fiscalYear, last: sequence }).run()
    return
  }
  if (existing.last >= sequence) return

  db.update(invoiceSequence)
    .set({ last: sequence })
    .where(
      and(
        eq(invoiceSequence.exporterId, exporterId),
        eq(invoiceSequence.fiscalYear, fiscalYear)
      )
    )
    .run()
}

/** Trailing sequence in INV/0018/2024-25 -> 18. */
export const sequenceOf = (invoiceNumber: string): number => {
  const parts = invoiceNumber.split('/')
  if (parts.length < 2) return 0
  const parsed = Number.parseInt(parts[1], 10)
  return Number.isFinite(parsed) ? parsed : 0
}
