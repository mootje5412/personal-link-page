import './StatsBar.css'

const stats = [
  { value: '50K+', label: 'Günlük sorgu' },
  { value: '12+', label: 'Sorgu türü' },
  { value: '<1sn', label: 'Ortalama yanıt' },
  { value: '7/24', label: 'Kesintisiz erişim' },
]

const StatsBar = () => {
  return (
    <section className="stats-bar section-dark">
      <div className="container stats-inner">
        {stats.map((stat, i) => (
          <div key={stat.label} className="stat-item">
            {i > 0 && <div className="stat-divider" aria-hidden="true" />}
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatsBar
