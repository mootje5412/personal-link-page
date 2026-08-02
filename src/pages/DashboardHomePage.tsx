import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDatabaseStats } from '../context/DatabaseStatsContext'
import { databaseStatusLabel, formatCount } from '../services/databaseApi'
import './DashboardHomePage.css'

const DashboardHomePage = () => {
  const { user } = useAuth()
  const { database, loading, error } = useDatabaseStats()

  const status = database
    ? databaseStatusLabel(database.status, database.index_building)
    : loading
      ? 'Yükleniyor…'
      : '—'

  return (
    <div className="dashboard-home">
      <header className="dashboard-home-hero">
        <p className="dashboard-home-kicker">Gösterge paneli</p>
        <h1>Hoş geldin, {user?.username ?? 'kullanıcı'} 👋</h1>
        <p className="dashboard-home-lead">
          VeriPanel&apos;e tekrar hoş geldin. Aşağıda veritabanı özetini görebilir, soldaki menüden telefon sorgusu yapabilirsin.
        </p>
      </header>

      <section className="dashboard-home-stats" aria-label="Veritabanı istatistikleri">
        <article className="dashboard-stat-card dashboard-stat-card--primary">
          <span className="dashboard-stat-label">Toplam satır</span>
          <strong className="dashboard-stat-value">
            {loading ? '…' : formatCount(database?.total_lines)}
          </strong>
          <p className="dashboard-stat-hint">Tüm dosyalardaki satır sayısı</p>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Veri satırı</span>
          <strong className="dashboard-stat-value">
            {loading ? '…' : formatCount(database?.total_data_lines)}
          </strong>
          <p className="dashboard-stat-hint">Boş olmayan satırlar</p>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">İndekslenen kayıt</span>
          <strong className="dashboard-stat-value">
            {loading ? '…' : formatCount(database?.indexed_records)}
          </strong>
          <p className="dashboard-stat-hint">Aranabilir kayıt sayısı</p>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Durum</span>
          <strong className="dashboard-stat-value dashboard-stat-value--status">{status}</strong>
          <p className="dashboard-stat-hint">
            {database?.index_building ? 'İndeks tamamlanınca sorgu açılır' : 'Sistem aramaya hazır'}
          </p>
        </article>
      </section>

      {error && <p className="dashboard-home-error">{error}</p>}

      <section className="dashboard-home-action">
        <div>
          <h2>Telefon sorgusu</h2>
          <p>Numara girerek veritabanında hızlı arama yap.</p>
        </div>
        <Link to="/panel/sorgu/telefon" className="btn dashboard-home-action-btn">
          Sorguya git
        </Link>
      </section>
    </div>
  )
}

export default DashboardHomePage
