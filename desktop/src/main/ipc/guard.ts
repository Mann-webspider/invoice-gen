import { ipcMain } from 'electron'
import { ZodError, type ZodType } from 'zod'
import { AppError, err, ok, type Result } from '@shared/result'
import { log } from '../log'

/**
 * Registers an IPC handler that always resolves to a Result envelope — it never
 * rejects, so the renderer has exactly one error path.
 *
 * Input is validated against a zod schema from shared/contracts before the
 * service sees it. The old backend validated almost nothing: controllers read
 * `$data['exporter']['company_name'] ?? "-"` and persisted the literal string
 * "-" when a field was missing, which is why placeholder dashes leaked into
 * printed invoices.
 */
export const handle = <Req, Res>(
  channel: string,
  schema: ZodType<Req> | null,
  handler: (input: Req) => Promise<Res> | Res
): void => {
  ipcMain.handle(channel, async (_event, raw: unknown): Promise<Result<Res>> => {
    try {
      const input = schema ? schema.parse(raw) : (raw as Req)
      return ok(await handler(input))
    } catch (error) {
      return toErrorResult(channel, error)
    }
  })
}

const toErrorResult = (channel: string, error: unknown): Result<never> => {
  if (error instanceof ZodError) {
    log.warn(`${channel}: validation failed`, error.issues)
    return err('VALIDATION', 'Some fields are invalid.', error.flatten().fieldErrors)
  }

  if (error instanceof AppError) {
    log.warn(`${channel}: ${error.code} - ${error.message}`)
    return err(error.code, error.message, error.details)
  }

  // Unexpected: log the full stack locally, return a safe message. The old
  // backend ran Slim's error middleware with displayErrorDetails=true and
  // returned stack traces to the client.
  log.error(`${channel}: unhandled error`, error)
  return err('INTERNAL', 'Something went wrong. See the log file for details.')
}
