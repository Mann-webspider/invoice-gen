import type Database from 'better-sqlite3'
import { log } from '../log'
import { migrations } from './migrations'

/**
 * Applies pending migrations, tracked by PRAGMA user_version.
 *
 * The web app had migration classes under backend/migrations that nothing ever
 * invoked automatically — the deployed schema was whatever had been applied by
 * hand. That is survivable on one server and not survivable once the database
 * lives on every client's laptop.
 *
 * Each migration runs inside a transaction together with its version bump, so a
 * failure leaves the database on the previous version rather than half-migrated.
 */
export const runMigrations = (connection: Database.Database): void => {
  const current = connection.pragma('user_version', { simple: true }) as number

  if (current > migrations.length) {
    throw new Error(
      `Database is at version ${current} but this build only knows ${migrations.length}. ` +
        'The application has been downgraded; install the newer version again.'
    )
  }

  if (current === migrations.length) {
    log.info(`Database schema up to date (version ${current})`)
    return
  }

  for (let version = current; version < migrations.length; version++) {
    const migration = migrations[version]
    const statements = migration.sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean)

    // pragma cannot be parameterised, and `version` is a loop counter, not input.
    const apply = connection.transaction(() => {
      for (const statement of statements) connection.exec(statement)
      connection.pragma(`user_version = ${version + 1}`)
    })

    apply()
    log.info(`Applied migration ${migration.name} (version ${version + 1})`)
  }
}
