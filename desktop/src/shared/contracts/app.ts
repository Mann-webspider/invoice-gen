import { z } from 'zod'

export const AppInfo = z.object({
  name: z.string(),
  version: z.string(),
  electron: z.string(),
  platform: z.string(),
  /** Root of the writable data tree (%APPDATA%/InvoiceGen). */
  userDataPath: z.string(),
  isPackaged: z.boolean()
})
export type AppInfo = z.infer<typeof AppInfo>

/** Progress push for the ProcessQueue panel during document generation. */
export const DocumentProgress = z.object({
  jobId: z.string(),
  step: z.string(),
  title: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  message: z.string().optional()
})
export type DocumentProgress = z.infer<typeof DocumentProgress>
