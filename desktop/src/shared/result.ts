/**
 * Uniform result envelope for every IPC call.
 *
 * The old web client swallowed failures: `lib/apiService.ts` returned `null` on
 * error and the axios interceptor had empty `// handled silently` branches, so a
 * failed save looked identical to an empty response. Every handler here returns
 * an explicit Ok or Err, and the renderer unwraps it in one place.
 */

export type ErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DEPENDENCY_MISSING'
  | 'IO'
  | 'INTERNAL'

export interface Ok<T> {
  ok: true
  data: T
}

export interface Err {
  ok: false
  code: ErrorCode
  message: string
  /** Field-level issues for VALIDATION, stack/context for INTERNAL. Never shown raw to the user. */
  details?: unknown
}

export type Result<T> = Ok<T> | Err

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data })

export const err = (code: ErrorCode, message: string, details?: unknown): Err =>
  details === undefined ? { ok: false, code, message } : { ok: false, code, message, details }

/** Domain error carrying an ErrorCode, so services can throw and the IPC guard maps it. */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }

  static notFound(what: string): AppError {
    return new AppError('NOT_FOUND', `${what} not found`)
  }

  static conflict(message: string): AppError {
    return new AppError('CONFLICT', message)
  }

  static unauthorized(message = 'Not signed in'): AppError {
    return new AppError('UNAUTHORIZED', message)
  }

  static forbidden(message = 'Administrator access required'): AppError {
    return new AppError('FORBIDDEN', message)
  }
}
