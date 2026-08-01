import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

/**
 * Client-side routing guard.
 *
 * Unlike the web app's version this is only a convenience: every mutating IPC
 * handler calls requireUser or requireAdmin in the main process, so hiding a
 * route is not what protects the data. In the web app this component was the
 * *only* check that existed, and the API behind it was fully anonymous.
 */
export const ProtectedRoute = ({
  children,
  requireAdmin = false
}: {
  children: ReactNode
  requireAdmin?: boolean
}): JSX.Element => {
  const { isAuthenticated, isAdmin, isLoading, needsSetup } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (needsSetup) return <Navigate to="/setup" replace />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
