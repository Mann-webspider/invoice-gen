import { QueryClient } from '@tanstack/react-query'
import { IpcError } from './ipc'

/**
 * Local IPC has no network flakiness, so retries only add latency to a genuine
 * failure. Validation and not-found errors are never worth retrying at all.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof IpcError) return false
        return failureCount < 1
      }
    },
    mutations: {
      retry: false
    }
  }
})
