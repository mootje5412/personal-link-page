import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setToken } from '../services/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (login: string, password: string) => Promise<void>
  register: (data: { username: string; displayName: string; email?: string; phone?: string; password: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  updateProfile: (data: { displayName?: string; bio?: string; avatarUrl?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await api.me()
      setUser(me)
    } catch {
      setUser(null)
      setToken(null)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('loop_token')
    if (!token) {
      setLoading(false)
      return
    }
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(async (loginValue: string, password: string) => {
    const { user: loggedIn, token } = await api.login({ login: loginValue, password })
    setToken(token)
    setUser(loggedIn)
  }, [])

  const register = useCallback(async (data: { username: string; displayName: string; email?: string; phone?: string; password: string }) => {
    const { user: newUser, token } = await api.register(data)
    setToken(token)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (data: { displayName?: string; bio?: string; avatarUrl?: string }) => {
    const { user: updated } = await api.updateProfile(data)
    setUser(updated)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, updateProfile }),
    [user, loading, login, register, logout, refreshUser, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
