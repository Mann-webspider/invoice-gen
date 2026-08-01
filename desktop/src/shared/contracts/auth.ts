import { z } from 'zod'

export const Role = z.enum(['admin', 'user'])
export type Role = z.infer<typeof Role>

export const SessionUser = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: Role
})
export type SessionUser = z.infer<typeof SessionUser>

/**
 * What the renderer needs to decide which screen to show on launch.
 *
 * `needsSetup` covers two cases: a brand new install with no accounts, and a
 * database imported from the web app, whose users arrived without passwords
 * because the old table stored them in clear text.
 */
export const SessionState = z.object({
  user: SessionUser.nullable(),
  needsSetup: z.boolean(),
  /** Accounts that exist but have no password yet, for the setup screen. */
  pendingAccounts: z.array(SessionUser)
})
export type SessionState = z.infer<typeof SessionState>

export const LoginInput = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required')
})
export type LoginInput = z.infer<typeof LoginInput>

/** Shared password policy. Deliberately modest — this is a local, single-user app. */
const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(200, 'That password is too long')

export const SetPasswordInput = z
  .object({
    userId: z.string().min(1),
    password,
    confirmPassword: z.string()
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })
export type SetPasswordInput = z.infer<typeof SetPasswordInput>

export const CreateAdminInput = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email address'),
    password,
    confirmPassword: z.string()
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })
export type CreateAdminInput = z.infer<typeof CreateAdminInput>

export const ChangePasswordInput = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    password,
    confirmPassword: z.string()
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>

/* ------------------------------------------------------------------ *
 * First run
 * ------------------------------------------------------------------ */

export const SetupState = z.object({
  /** True once anything has been imported or created on this machine. */
  hasData: z.boolean(),
  invoiceCount: z.number(),
  exporterCount: z.number(),
  /** null when LibreOffice is not installed, so PDFs cannot be produced. */
  libreOfficePath: z.string().nullable(),
  dataFolder: z.string()
})
export type SetupState = z.infer<typeof SetupState>

export const ImportSummary = z.object({
  invoices: z.number(),
  products: z.number(),
  exporters: z.number(),
  suppliers: z.number(),
  drafts: z.number(),
  users: z.number(),
  assetsCopied: z.number(),
  documentsCopied: z.number(),
  /** Invoice numbers that appeared more than once; the newest was kept. */
  duplicateInvoices: z.array(z.string()),
  warnings: z.array(z.string())
})
export type ImportSummary = z.infer<typeof ImportSummary>
