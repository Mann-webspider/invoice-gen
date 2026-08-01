import { randomUUID } from 'node:crypto'
import { asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { AppError } from '@shared/result'
import {
  ArnInput,
  CountryOptionInput,
  DropdownOptionInput,
  ExporterInput,
  ProductCategoryInput,
  ProductSizeInput,
  SupplierInput,
  type MasterEntity,
  type MasterListInput,
  type MasterRecordMap,
  type MasterReorderInput
} from '@shared/contracts'
import { getDb } from '../db/client'
import {
  arnMaster,
  countryOption,
  dropdownOption,
  exporterMaster,
  invoiceSequence,
  productCategory,
  productSize,
  supplierMaster
} from '../db/schema'
import { exporterImageFlags } from './asset.service'

/**
 * One service for every master list.
 *
 * Replaces DropdownController, Productcontroller, buyercontroller,
 * SupplierDropdown handling and the ARN routes — five PHP controllers whose
 * create/read/update/delete bodies were near-identical apart from the table and
 * the field names.
 *
 * Each entity contributes a schema, a reader and a writer; everything else
 * (validation, id generation, timestamps, error shape) is shared.
 */

type AnyRecord = MasterRecordMap[MasterEntity]

interface EntityHandler {
  schema: z.ZodTypeAny
  list: (filter?: string) => AnyRecord[]
  create: (data: unknown) => AnyRecord
  update: (id: string, data: unknown) => AnyRecord
  remove: (id: string) => void
  reorder?: (ids: string[]) => void
}

const now = (): string => new Date().toISOString()

/* ------------------------------------------------------------------ *
 * Exporter
 * ------------------------------------------------------------------ */

const readSequences = (exporterId: string): { fiscalYear: string; last: number }[] =>
  getDb()
    .select({ fiscalYear: invoiceSequence.fiscalYear, last: invoiceSequence.last })
    .from(invoiceSequence)
    .where(eq(invoiceSequence.exporterId, exporterId))
    .orderBy(asc(invoiceSequence.fiscalYear))
    .all()

const toExporterRecord = (row: typeof exporterMaster.$inferSelect): AnyRecord => {
  const sequences = readSequences(row.id)
  const latest = sequences[sequences.length - 1]
  return {
    id: row.id,
    companyName: row.companyName,
    companyAddress: row.companyAddress,
    contactNumber: row.contactNumber,
    email: row.email,
    taxId: row.taxId,
    ieCode: row.ieCode,
    panNumber: row.panNumber,
    gstinNumber: row.gstinNumber,
    stateCode: row.stateCode,
    authorizedName: row.authorizedName,
    authorizedDesignation: row.authorizedDesignation,
    companyPrefix: row.companyPrefix,
    invoiceYear: latest?.fiscalYear ?? '',
    lastInvoiceNumber: latest?.last ?? 0,
    images: exporterImageFlags(row.id),
    sequences
  }
}

/** Keeps invoice_sequence in step with what the Admin form shows. */
const upsertSequence = (exporterId: string, fiscalYear: string, last: number): void => {
  getDb()
    .insert(invoiceSequence)
    .values({ exporterId, fiscalYear, last })
    .onConflictDoUpdate({
      target: [invoiceSequence.exporterId, invoiceSequence.fiscalYear],
      set: { last }
    })
    .run()
}

const exporterHandler: EntityHandler = {
  schema: ExporterInput,
  list: () =>
    getDb()
      .select()
      .from(exporterMaster)
      .orderBy(asc(exporterMaster.companyName))
      .all()
      .map(toExporterRecord),

  create: (data) => {
    const input = ExporterInput.parse(data)
    const id = randomUUID()
    const timestamp = now()
    const { invoiceYear, lastInvoiceNumber, ...columns } = input

    getDb()
      .insert(exporterMaster)
      .values({ id, ...columns, createdAt: timestamp, updatedAt: timestamp })
      .run()
    upsertSequence(id, invoiceYear, lastInvoiceNumber)

    return toExporterRecord(
      getDb().select().from(exporterMaster).where(eq(exporterMaster.id, id)).get()!
    )
  },

  update: (id, data) => {
    const input = ExporterInput.parse(data)
    const { invoiceYear, lastInvoiceNumber, ...columns } = input

    const result = getDb()
      .update(exporterMaster)
      .set({ ...columns, updatedAt: now() })
      .where(eq(exporterMaster.id, id))
      .run()
    if (result.changes === 0) throw AppError.notFound('Exporter')
    upsertSequence(id, invoiceYear, lastInvoiceNumber)

    return toExporterRecord(
      getDb().select().from(exporterMaster).where(eq(exporterMaster.id, id)).get()!
    )
  },

  remove: (id) => {
    const result = getDb().delete(exporterMaster).where(eq(exporterMaster.id, id)).run()
    if (result.changes === 0) throw AppError.notFound('Exporter')
  }
}

/* ------------------------------------------------------------------ *
 * Simple entities
 * ------------------------------------------------------------------ */

/**
 * Builds a handler for a flat table whose columns map one-to-one onto its zod
 * schema. Covers supplier, ARN, product category and product size.
 */
const flatHandler = <TSchema extends z.ZodObject<z.ZodRawShape>>(config: {
  schema: TSchema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any
  label: string
  orderColumn: string
  timestamps: boolean
}): EntityHandler => {
  const { schema, table, label, orderColumn, timestamps } = config

  const read = (id: string): AnyRecord => {
    const row = getDb().select().from(table).where(eq(table.id, id)).get()
    if (!row) throw AppError.notFound(label)
    return stripTimestamps(row) as AnyRecord
  }

  return {
    schema,
    list: () =>
      getDb()
        .select()
        .from(table)
        .orderBy(asc(table[orderColumn]))
        .all()
        .map((row: Record<string, unknown>) => stripTimestamps(row) as AnyRecord),

    create: (data) => {
      const input = schema.parse(data)
      const id = randomUUID()
      const timestamp = now()
      getDb()
        .insert(table)
        .values(
          timestamps
            ? { id, ...input, createdAt: timestamp, updatedAt: timestamp }
            : { id, ...input }
        )
        .run()
      return read(id)
    },

    update: (id, data) => {
      const input = schema.parse(data)
      const result = getDb()
        .update(table)
        .set(timestamps ? { ...input, updatedAt: now() } : { ...input })
        .where(eq(table.id, id))
        .run()
      if (result.changes === 0) throw AppError.notFound(label)
      return read(id)
    },

    remove: (id) => {
      const result = getDb().delete(table).where(eq(table.id, id)).run()
      if (result.changes === 0) throw AppError.notFound(label)
    }
  }
}

const stripTimestamps = (row: Record<string, unknown>): Record<string, unknown> => {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = row
  return rest
}

/* ------------------------------------------------------------------ *
 * Ordered entities
 * ------------------------------------------------------------------ */

/**
 * Country options and generic dropdown options are user-ordered. The web app
 * had no ordering column at all — its "reorder" endpoint rewrote every row's
 * value in place, so ids changed meaning.
 */
const orderedHandler = (config: {
  schema: z.ZodObject<z.ZodRawShape>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any
  label: string
  /** dropdownOption scopes both ordering and listing by category. */
  scoped: boolean
}): EntityHandler => {
  const { schema, table, label, scoped } = config

  const read = (id: string): AnyRecord => {
    const row = getDb().select().from(table).where(eq(table.id, id)).get()
    if (!row) throw AppError.notFound(label)
    return stripTimestamps(row) as AnyRecord
  }

  const nextPosition = (category?: string): number => {
    const row = getDb()
      .select({ max: sql<number>`COALESCE(MAX(${table.position}), -1)` })
      .from(table)
      .where(scoped && category ? eq(table.category, category) : undefined)
      .get()
    return (row?.max ?? -1) + 1
  }

  return {
    schema,

    list: (filter) =>
      getDb()
        .select()
        .from(table)
        .where(scoped && filter ? eq(table.category, filter) : undefined)
        .orderBy(asc(table.position))
        .all()
        .map((row: Record<string, unknown>) => stripTimestamps(row) as AnyRecord),

    create: (data) => {
      const input = schema.parse(data) as Record<string, unknown>
      const id = randomUUID()
      const timestamp = now()
      getDb()
        .insert(table)
        .values({
          id,
          ...input,
          position: nextPosition(input.category as string | undefined),
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .run()
      return read(id)
    },

    update: (id, data) => {
      const input = schema.parse(data)
      const result = getDb()
        .update(table)
        .set({ ...input, updatedAt: now() })
        .where(eq(table.id, id))
        .run()
      if (result.changes === 0) throw AppError.notFound(label)
      return read(id)
    },

    remove: (id) => {
      const result = getDb().delete(table).where(eq(table.id, id)).run()
      if (result.changes === 0) throw AppError.notFound(label)
    },

    reorder: (ids) => {
      const db = getDb()
      // One transaction: a half-applied order would be visible to the next read.
      db.transaction((tx) => {
        ids.forEach((id, position) => {
          tx.update(table).set({ position, updatedAt: now() }).where(eq(table.id, id)).run()
        })
      })
    }
  }
}

/* ------------------------------------------------------------------ *
 * Registry
 * ------------------------------------------------------------------ */

const handlers: Record<MasterEntity, EntityHandler> = {
  exporter: exporterHandler,
  supplier: flatHandler({
    schema: SupplierInput,
    table: supplierMaster,
    label: 'Supplier',
    orderColumn: 'name',
    timestamps: true
  }),
  arn: flatHandler({
    schema: ArnInput,
    table: arnMaster,
    label: 'ARN declaration',
    orderColumn: 'arn',
    timestamps: true
  }),
  productCategory: flatHandler({
    schema: ProductCategoryInput,
    table: productCategory,
    label: 'Product category',
    orderColumn: 'description',
    timestamps: true
  }),
  productSize: flatHandler({
    schema: ProductSizeInput,
    table: productSize,
    label: 'Product size',
    orderColumn: 'size',
    timestamps: true
  }),
  countryOption: orderedHandler({
    schema: CountryOptionInput,
    table: countryOption,
    label: 'Destination',
    scoped: false
  }),
  dropdownOption: orderedHandler({
    schema: DropdownOptionInput,
    table: dropdownOption,
    label: 'Dropdown option',
    scoped: true
  })
}

const handlerFor = (entity: MasterEntity): EntityHandler => handlers[entity]

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export const listMaster = (input: MasterListInput): AnyRecord[] =>
  handlerFor(input.entity).list(input.category)

export const createMaster = (entity: MasterEntity, data: unknown): AnyRecord =>
  handlerFor(entity).create(data)

export const updateMaster = (entity: MasterEntity, id: string, data: unknown): AnyRecord =>
  handlerFor(entity).update(id, data)

export const removeMaster = (entity: MasterEntity, id: string): null => {
  handlerFor(entity).remove(id)
  return null
}

export const reorderMaster = (input: MasterReorderInput): null => {
  const handler = handlerFor(input.entity)
  if (!handler.reorder) {
    throw new AppError('VALIDATION', `${input.entity} cannot be reordered`)
  }
  handler.reorder(input.ids)
  return null
}

/** Used by the dropdown widgets to discover which categories exist. */
export const listDropdownCategories = (): string[] =>
  getDb()
    .selectDistinct({ category: dropdownOption.category })
    .from(dropdownOption)
    .orderBy(asc(dropdownOption.category))
    .all()
    .map((row) => row.category)
