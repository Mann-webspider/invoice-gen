import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Inlines the .sql files drizzle-kit generates into a plain .ts module.
 *
 * Vite's `?raw` import would work inside the Electron bundle but not under tsx,
 * and the legacy importer has to run in both. A generated .ts module is boring
 * and works everywhere.
 *
 * Run via `npm run db:generate`.
 */

const migrationsDir = join(process.cwd(), 'src/main/db/migrations')

const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort()

const entries = files
  .map((file) => {
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    const name = file.replace(/\.sql$/, '')
    // Backtick-safe: the generated SQL contains none, but escape defensively.
    const escaped = sql.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
    return `  {\n    name: '${name}',\n    sql: \`${escaped}\`\n  }`
  })
  .join(',\n')

const output = `/* eslint-disable */
// GENERATED FILE — do not edit. Run \`npm run db:generate\` to regenerate.
// Source: src/main/db/migrations/*.sql

export const migrations: readonly { name: string; sql: string }[] = [
${entries}
]
`

writeFileSync(join(migrationsDir, 'generated.ts'), output, 'utf8')
// eslint-disable-next-line no-console
console.log(`Bundled ${files.length} migration(s): ${files.join(', ')}`)
