export { migrations } from './generated'

/**
 * Migration SQL is inlined into generated.ts by scripts/bundle-migrations.ts so
 * it ships inside the bundle. Reading .sql files from disk at runtime would
 * mean the packaged app has to locate a folder inside app.asar — a needless
 * failure mode on a client machine.
 *
 * Order matters: index + 1 becomes the database's PRAGMA user_version. Never
 * reorder or edit a migration that has already shipped; add a new one instead.
 */
