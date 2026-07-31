import { CH } from '@shared/ipc-channels'
import type { AppInfo, IpcChannel, IpcRequest, IpcResponse } from '@shared/contracts'
import type { ErrorCode } from '@shared/result'

/**
 * The renderer's only way to reach the main process.
 *
 * Replaces four overlapping client layers from the web app — lib/axios.ts,
 * lib/apiService.ts, services/api.ts and lib/dataService.ts — with one typed
 * module. Errors throw as IpcError so TanStack Query's error state and the
 * toast handler see them; nothing is silently swallowed.
 */

export class IpcError extends Error {
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'IpcError'
    this.code = code
    this.details = details
  }

  /** Field-level messages from a VALIDATION failure, for react-hook-form setError. */
  get fieldErrors(): Record<string, string[]> {
    return this.code === 'VALIDATION' && this.details
      ? (this.details as Record<string, string[]>)
      : {}
  }
}

/** Unwraps the Result envelope: returns data, or throws IpcError. */
export const call = async <K extends IpcChannel>(
  channel: K,
  payload: IpcRequest<K>
): Promise<IpcResponse<K>> => {
  const result = await window.api.invoke(channel, payload)
  if (result.ok) return result.data
  throw new IpcError(result.code, result.message, result.details)
}

export const ipc = {
  app: {
    info: (): Promise<AppInfo> => call(CH.app.info, undefined)
  }
}
