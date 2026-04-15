import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  authLogin,
  authRegister,
  authLogout,
  authRefresh,
  getAccount,
  createAuthFetch,
} from '#/lib/api'
import type { User, AuthTokens } from '#/lib/api'
import { useAuthModal } from '#/context/auth-modal'

const STORAGE_KEY = 'garden:auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  refreshTokens: () => Promise<void>
  authFetch: ReturnType<typeof createAuthFetch>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, accessToken: null, refreshToken: null }
    return JSON.parse(raw) as AuthState
  } catch {
    return { user: null, accessToken: null, refreshToken: null }
  }
}

function writeStorage(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { openAuthModal } = useAuthModal()
  const [state, setState] = useState<AuthState>(readStorage)

  const setAndPersist = useCallback((next: AuthState) => {
    setState(next)
    if (next.accessToken) {
      writeStorage(next)
    } else {
      clearStorage()
    }
  }, []) // setState is stable; writeStorage/clearStorage are module-level

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authLogin(email, password)
    const user = await getAccount(tokens.accessToken)
    setAndPersist({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
  }, [setAndPersist])

  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const tokens = await authRegister(email, password, firstName, lastName)
      const user = await getAccount(tokens.accessToken)
      setAndPersist({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
    },
    [setAndPersist],
  )

  const loginWithTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    const user = await getAccount(accessToken)
    setAndPersist({ user, accessToken, refreshToken })
  }, [setAndPersist])

  const logout = useCallback(async () => {
    if (state.refreshToken) {
      try {
        await authLogout(state.refreshToken)
      } catch {
        // best-effort; clear local state regardless
      }
    }
    setAndPersist({ user: null, accessToken: null, refreshToken: null })
  }, [state.refreshToken, setAndPersist])

  const refreshTokens = useCallback(async () => {
    if (!state.refreshToken) throw new Error('No refresh token')
    const tokens = await authRefresh(state.refreshToken)
    setAndPersist({ ...state, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
  }, [state, setAndPersist])

  const authFetch = useMemo(
    () =>
      createAuthFetch({
        getTokens: () => ({ accessToken: state.accessToken, refreshToken: state.refreshToken }),
        onTokensRefreshed: (tokens: AuthTokens) => {
          setState(prev => {
            const next: AuthState = { ...prev, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
            writeStorage(next)
            return next
          })
        },
        onAuthFailure: () => {
          setState({ user: null, accessToken: null, refreshToken: null })
          clearStorage()
          openAuthModal('login')
        },
      }),
    // tokens are the only fields createAuthFetch reads from state; including full state would recreate authFetch on every update
    [state.accessToken, state.refreshToken, openAuthModal],
  )

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isAuthenticated: !!state.user,
        login,
        register,
        loginWithTokens,
        logout,
        refreshTokens,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
