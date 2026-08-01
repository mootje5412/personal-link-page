import './StatsBar.css'

const stats = [
  { value: '50K+', label: 'Günlük sorgu', detail: 'Aktif kullanıcı trafiği' },
  { value: '12+', label: 'Sorgu modülü', detail: 'TC, isim, adres ve daha fazlası' },
  { value: '<1sn', label: 'Ortalama yanıt', detail: 'Optimize edilmiş altyapı' },
  { value: '7/24', label: 'Erişim', detail: 'Kesintisiz panel' },
]

const StatsBar = () => {
  return (
    <section className="stats-bar section-dark" aria-label="Platform istatistikleri">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <strong className="stat-value">{stat.value}</strong>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-detail">{stat.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsBar
