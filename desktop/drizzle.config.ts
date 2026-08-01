import { defineConfig } from 'drizzle-kit'

/**
 * Only used at development time to generate migration SQL from schema.ts
 * (`npm run db:generate`). The app itself never reads this file — it applies
 * the generated migrations from src/main/db/migrations at startup.
 */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schema.ts',
  out: './src/main/db/migrations'
})
