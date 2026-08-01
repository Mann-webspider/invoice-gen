import { hash, verify } from '@node-rs/argon2'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { AppError } from '@shared/result'
import type {
  ChangePasswordInput,
  CreateAdminInput,
  LoginInput,
  SessionState,
  SessionUser,
  SetPasswordInput
} from '@shared/contracts'
import { getDb } from '../db/client'
import { users } from '../db/schema'
import { log } from '../log'

/**
 * Local, single-machine authentication.
 *
 * No JWT and no token_sessions table. The web app signed a token whose `sub`
 * claim was the entire user row — including the clear-text password — stored it
 * in localStorage, and fell back to the literal secret 'your-secret-key' when
 * JWT_SECRET was unset (which it was, in the deployed .env). None of that has a
 * purpose here: the renderer cannot reach the database except through IPC, so
 * the session is simply a variable in this process.
 */

let currentUser: SessionUser | null = null

const toSessionUser = (row: typeof users.$inferSelect): SessionUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role
})

/** Imported accounts arrive with an empty hash and cannot sign in until set. */
const hasPassword = (row: typeof users.$inferSelect): boolean => row.passwordHash !== ''

const hashPassword = (plain: string): Promise<string> =>
  hash(plain, {
    // OWASP's second recommended Argon2id profile: 19 MiB, 2 passes.
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  })

export const getSession = (): SessionState => {
  const db = getDb()
  const all = db.select().from(users).all()

  const pending = all.filter((row) => !hasPassword(row))
  const active = all.filter(hasPassword)

  return {
    user: currentUser,
    // Nobody can sign in: either a fresh install, or a database imported from
    // the web app whose passwords were not worth migrating.
    needsSetup: active.length === 0,
    pendingAccounts: pending.map(toSessionUser)
  }
}

export const login = async (input: LoginInput): Promise<SessionUser> => {
  const db = getDb()
  const row = db
    .select()
    .from(users)
    .where(eq(users.email, input.email.trim().toLowerCase()))
    .get()

  // Same message and roughly the same cost whether the account exists or not,
  // so the response does not reveal which emails are registered.
  const invalid = new AppError('UNAUTHORIZED', 'Email or password is incorrect')

  if (!row || !hasPassword(row)) {
    await hashPassword(input.password)
    throw invalid
  }

  const matches = await verify(row.passwordHash, input.password)
  if (!matches) throw invalid

  currentUser = toSessionUser(row)
  log.info(`Signed in as ${row.email}`)
  return currentUser
}

export const logout = (): null => {
  if (currentUser) log.info(`Signed out ${currentUser.email}`)
  currentUser = null
  return null
}

/** First-run: create the initial administrator and sign them in. */
export const createAdmin = async (input: CreateAdminInput): Promise<SessionUser> => {
  const db = getDb()
  const email = input.email.trim().toLowerCase()

  const existing = db.select().from(users).where(eq(users.email, email)).get()
  if (existing) throw AppError.conflict('An account with that email already exists')

  const now = new Date().toISOString()
  const row: typeof users.$inferInsert = {
    id: randomUUID(),
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    role: 'admin',
    createdAt: now,
    updatedAt: now
  }

  db.insert(users).values(row).run()
  currentUser = { id: row.id, name: row.name, email, role: 'admin' }
  log.info(`Created administrator ${email}`)
  return currentUser
}

/**
 * Gives one of the imported, password-less accounts a password, then signs in
 * as it. Refuses accounts that already have one — changing an existing password
 * requires the current password, via changePassword.
 */
export const setPassword = async (input: SetPasswordInput): Promise<SessionUser> => {
  const db = getDb()
  const row = db.select().from(users).where(eq(users.id, input.userId)).get()
  if (!row) throw AppError.notFound('Account')
  if (hasPassword(row)) {
    throw AppError.conflict('That account already has a password')
  }

  db.update(users)
    .set({ passwordHash: await hashPassword(input.password), updatedAt: new Date().toISOString() })
    .where(eq(users.id, row.id))
    .run()

  currentUser = toSessionUser(row)
  log.info(`Password set for ${row.email}`)
  return currentUser
}

export const changePassword = async (input: ChangePasswordInput): Promise<null> => {
  const session = requireUser()
  const db = getDb()
  const row = db.select().from(users).where(eq(users.id, session.id)).get()
  if (!row) throw AppError.notFound('Account')

  const matches = hasPassword(row) && (await verify(row.passwordHash, input.currentPassword))
  if (!matches) throw new AppError('UNAUTHORIZED', 'Current password is incorrect')

  db.update(users)
    .set({ passwordHash: await hashPassword(input.password), updatedAt: new Date().toISOString() })
    .where(eq(users.id, row.id))
    .run()

  log.info(`Password changed for ${row.email}`)
  return null
}

/* ------------------------------------------------------------------ *
 * Guards — used by IPC handlers, not by the renderer
 * ------------------------------------------------------------------ */

/**
 * Every mutating handler calls one of these. In the web app no route had any
 * authorisation at all: ProtectedRoute ran in the browser, so `DELETE
 * /api/invoice/all` and `POST /api/database/restore/upload` were open to
 * anyone who could reach the host.
 */
export const requireUser = (): SessionUser => {
  if (!currentUser) throw AppError.unauthorized()
  return currentUser
}

export const requireAdmin = (): SessionUser => {
  const user = requireUser()
  if (user.role !== 'admin') throw AppError.forbidden()
  return user
}

/** Test seam. */
export const __setCurrentUser = (user: SessionUser | null): void => {
  currentUser = user
}
