import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import type { LoginInput, SessionState, SessionUser } from '@shared/contracts'
import { ipc } from '@/lib/ipc'

interface AuthContextValue {
  user: SessionUser | null
  session: SessionState | undefined
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  /** No account can sign in yet — fresh install, or an import with no passwords. */
  needsSetup: boolean
  login: (input: LoginInput) => Promise<SessionUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const SESSION_KEY = ['auth', 'session'] as const

/**
 * Session lives in the main process; this only mirrors it.
 *
 * The web version kept a JWT in localStorage whose payload embedded the whole
 * user row, password included, and read it back as
 * `response.data.user.sub.user`. There is no token here at all.
 */
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: ipc.auth.session,
    staleTime: Infinity
  })

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_KEY })
  }, [queryClient])

  const loginMutation = useMutation({
    mutationFn: ipc.auth.login,
    onSuccess: () => {
      // Master data is user-scoped: drop anything cached from before sign-in.
      void queryClient.invalidateQueries()
    }
  })

  const logoutMutation = useMutation({
    mutationFn: ipc.auth.logout,
    onSuccess: () => {
      queryClient.clear()
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
    }
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      isAuthenticated: Boolean(session?.user),
      isAdmin: session?.user?.role === 'admin',
      needsSetup: session?.needsSetup ?? false,
      login: (input) => loginMutation.mutateAsync(input),
      logout: async () => {
        await logoutMutation.mutateAsync()
      },
      refresh
    }),
    [session, isLoading, loginMutation, logoutMutation, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
