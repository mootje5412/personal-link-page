import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  clearSession,
  getStoredUser,
  saveSession,
  type AuthUser,
} from '../services/authApi'

type AuthContextValue = {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  loginSuccess: (user: AuthUser, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const value = useMemo(
    () => ({
      user,
      setUser,
      loginSuccess: (nextUser: AuthUser, token: string) => {
        saveSession({ user: nextUser, token })
        setUser(nextUser)
      },
      logout: () => {
        clearSession()
        setUser(null)
      },
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
