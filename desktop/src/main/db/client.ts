import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { paths } from '../storage/paths'
import { log } from '../log'
import * as schema from './schema'

export type Db = BetterSQLite3Database<typeof schema>

let connection: Database.Database | null = null
let db: Db | null = null

/**
 * better-sqlite3 is synchronous. For a single-user desktop app that is a
 * feature: transactions are ordinary function calls that cannot interleave, so
 * "read the last invoice number, add one, write it back" is atomic without any
 * extra locking — the exact operation that produced three copies of
 * INV/0018/2024-25 in the web app.
 */
export const openDatabase = (): Db => {
  if (db) return db

  const file = paths.dbFile()
  connection = new Database(file)

  // Survives an unclean shutdown (power loss mid-invoice) and allows reads
  // during a write.
  connection.pragma('journal_mode = WAL')
  // Off by default in SQLite. Without this every ON DELETE CASCADE in the
  // schema would be decorative.
  connection.pragma('foreign_keys = ON')
  connection.pragma('busy_timeout = 5000')
  connection.pragma('synchronous = NORMAL')

  db = drizzle(connection, { schema })
  log.info(`Opened database at ${file}`)
  return db
}

/** Throws if called before openDatabase — a wiring bug, not a runtime condition. */
export const getDb = (): Db => {
  if (!db) throw new Error('Database not opened yet')
  return db
}

export const getConnection = (): Database.Database => {
  if (!connection) throw new Error('Database not opened yet')
  return connection
}

export const closeDatabase = (): void => {
  connection?.close()
  connection = null
  db = null
}
