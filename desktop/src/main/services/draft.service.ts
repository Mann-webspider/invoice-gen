import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { AppError } from '@shared/result'
import {
  WizardData,
  type DraftRecord,
  type DraftSaveInput,
  type DraftWithData
} from '@shared/contracts'
import { getDb } from '../db/client'
import { draft } from '../db/schema'
import { log } from '../log'

/**
 * Drafts are the only cross-step store.
 *
 * In the web app a draft was one of four places the same values lived, and it
 * was written double-encoded: the client did JSON.stringify on a value that was
 * already a JSON string, so every reader had to JSON.parse twice — see
 * useDraftForm.ts, which does `JSON.parse(JSON.parse(data))` and logs the
 * result. Here the column holds one level of JSON and the shape is validated on
 * the way in and on the way out.
 */

const toRecord = (row: typeof draft.$inferSelect): DraftRecord => ({
  id: row.id,
  invoiceNumber: row.invoiceNumber,
  lastPage: row.lastPage,
  isSubmitted: row.isSubmitted,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
})

export const listDrafts = (): DraftRecord[] =>
  getDb()
    .select()
    .from(draft)
    .where(eq(draft.isSubmitted, false))
    .orderBy(desc(draft.updatedAt))
    .all()
    .map(toRecord)

export const getDraft = (id: string): DraftWithData => {
  const row = getDb().select().from(draft).where(eq(draft.id, id)).get()
  if (!row) throw AppError.notFound('Draft')

  let parsed: unknown
  try {
    parsed = JSON.parse(row.data)
  } catch {
    throw new AppError('IO', 'This draft is corrupted and cannot be opened')
  }

  // Imported drafts came from the old form model and will be missing fields;
  // the schema's defaults fill them rather than the wizard crashing on undefined.
  const result = WizardData.safeParse(parsed)
  return {
    ...toRecord(row),
    data: result.success ? result.data : WizardData.parse({})
  }
}

/** Upsert. Called on a debounce while the client types, so it must stay cheap. */
export const saveDraft = (input: DraftSaveInput): DraftRecord => {
  const db = getDb()
  const now = new Date().toISOString()
  const serialized = JSON.stringify(input.data)

  if (input.id) {
    const result = db
      .update(draft)
      .set({
        data: serialized,
        lastPage: input.lastPage,
        invoiceNumber: input.invoiceNumber,
        updatedAt: now
      })
      .where(eq(draft.id, input.id))
      .run()
    if (result.changes === 0) throw AppError.notFound('Draft')

    return toRecord(db.select().from(draft).where(eq(draft.id, input.id)).get()!)
  }

  const id = randomUUID()
  db.insert(draft)
    .values({
      id,
      invoiceNumber: input.invoiceNumber,
      data: serialized,
      lastPage: input.lastPage,
      isSubmitted: false,
      createdAt: now,
      updatedAt: now
    })
    .run()

  log.info(`Created draft ${id}`)
  return toRecord(db.select().from(draft).where(eq(draft.id, id)).get()!)
}

export const removeDraft = (id: string): null => {
  const result = getDb().delete(draft).where(eq(draft.id, id)).run()
  if (result.changes === 0) throw AppError.notFound('Draft')
  return null
}

/** Marks a draft submitted once its invoice exists, so it leaves the list. */
export const markSubmitted = (id: string): void => {
  getDb()
    .update(draft)
    .set({ isSubmitted: true, updatedAt: new Date().toISOString() })
    .where(eq(draft.id, id))
    .run()
}
