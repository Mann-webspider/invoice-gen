import { toast } from 'sonner'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { IpcError } from './ipc'

/**
 * Routes a failed mutation to the right place: field-level messages back onto
 * the form, everything else to a toast.
 *
 * The web app did neither — `apiService` returned null on failure and the axios
 * interceptor had empty branches, so a rejected save looked like a successful
 * one that simply changed nothing.
 */
export const applyIpcError = <T extends FieldValues>(
  error: unknown,
  setError?: UseFormSetError<T>
): void => {
  if (error instanceof IpcError && setError) {
    const fieldErrors = error.fieldErrors
    const entries = Object.entries(fieldErrors)
    if (entries.length > 0) {
      for (const [field, messages] of entries) {
        if (messages?.[0]) setError(field as Path<T>, { message: messages[0] })
      }
      return
    }
  }

  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

export const toastSuccess = (message: string): void => {
  toast.success(message)
}
