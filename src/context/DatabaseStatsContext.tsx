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

  const reload = useCallback(async (silent = false) => {
    try {
      const data = await fetchDatabaseStats()
      setDatabase(data)
      setError('')
    } catch {
      if (!silent) {
        setDatabase(null)
      }
      setError('Veritabanı istatistikleri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    const timer = window.setInterval(() => {
      reload()
    }, 30000)
    return () => window.clearInterval(timer)
  }, [reload])

  useEffect(() => {
    if (!database?.index_building && database?.status === 'ready') {
      return
    }

    const timer = window.setInterval(() => {
      reload(true)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [database?.index_building, database?.status, reload])

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
