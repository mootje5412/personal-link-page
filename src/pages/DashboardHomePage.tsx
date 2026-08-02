import { useAuth } from '../context/AuthContext'
import { useDatabaseStats } from '../context/DatabaseStatsContext'
import { databaseStatusLabel, formatCount } from '../services/databaseApi'
import './DashboardHomePage.css'

const DashboardHomePage = () => {
  const { user } = useAuth()
  const { database, error } = useDatabaseStats()

  const hasStats = Boolean(database && database.total_lines != null && database.total_lines > 0)
  const status = database
    ? databaseStatusLabel(database.status, database.index_building)
    : 'Hazırlanıyor'

  return (
    <div className="dashboard-home">
      <header className="dashboard-home-hero">
        <p className="dashboard-home-kicker">Gösterge paneli</p>
        <h1>Hoş geldin, {user?.username ?? 'kullanıcı'}</h1>
        <p className="dashboard-home-lead">
          VeriPanel&apos;e hoş geldin. Soldaki menüden telefon sorgusu yapabilirsin.
        </p>
      </header>

      {hasStats ? (
        <section className="dashboard-home-stats" aria-label="Veritabanı istatistikleri">
          <article className="dashboard-stat-card dashboard-stat-card--primary">
            <span className="dashboard-stat-label">Toplam satır</span>
            <strong className="dashboard-stat-value">{formatCount(database?.total_lines)}</strong>
            <p className="dashboard-stat-hint">Veritabanındaki toplam veri satırı</p>
          </article>

          <article className="dashboard-stat-card">
            <span className="dashboard-stat-label">Durum</span>
            <strong className="dashboard-stat-value dashboard-stat-value--status">{status}</strong>
            <p className="dashboard-stat-hint">
              {database?.index_building ? 'İndeks güncelleniyor' : 'Arama kullanılabilir'}
            </p>
          </article>
        </section>
      ) : (
        <p className="dashboard-home-preparing" role="status">
          Veritabanı hazırlanıyor…
        </p>
      )}

      {error && <p className="dashboard-home-error">{error}</p>}
    </div>
  )
}

export default DashboardHomePage
