import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DatabaseSummary, fetchDatabaseStats } from '../services/databaseApi'

type DatabaseStatsContextValue = {
  database: DatabaseSummary | null
  loading: boolean
  error: string
  reload: () => Promise<void>
}

const DatabaseStatsContext = createContext<DatabaseStatsContextValue | null>(null)

export function DatabaseStatsProvider({ children }: { children: ReactNode }) {
  const [database, setDatabase] = useState<DatabaseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const data = await fetchDatabaseStats()
      setDatabase(data)
      setError('')
    } catch {
      setDatabase(null)
      setError('Veritabanı istatistikleri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!database?.index_building) {
      return
    }

    const timer = window.setInterval(() => {
      reload()
    }, 5000)

    return () => window.clearInterval(timer)
  }, [database?.index_building, reload])

  const value = useMemo(
    () => ({ database, loading, error, reload }),
    [database, loading, error, reload],
  )

  return (
    <DatabaseStatsContext.Provider value={value}>
      {children}
    </DatabaseStatsContext.Provider>
  )
}

export function useDatabaseStats() {
  const context = useContext(DatabaseStatsContext)
  if (!context) {
    throw new Error('useDatabaseStats must be used within DatabaseStatsProvider')
  }
  return context
}
