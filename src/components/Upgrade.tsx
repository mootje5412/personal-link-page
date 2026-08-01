import { Link } from 'react-router-dom'
import { IconArrow } from './icons/SearchIcons'
import './Upgrade.css'

const tiers = [
  {
    name: 'Başlangıç',
    limit: '200',
    price: '59',
    highlight: false,
  },
  {
    name: 'Standart',
    limit: '1.000',
    price: '119',
    highlight: true,
    badge: 'Önerilen',
  },
  {
    name: 'Pro',
    limit: '5.000',
    price: '199',
    highlight: false,
    badge: 'En yüksek limit',
  },
]

const perks = [
  'Telefon sorgusu modülü',
  'Daha yüksek günlük sorgu limiti',
  'Öncelikli sunucu yanıt süresi',
  'Panel ve API erişimi',
]

const Upgrade = () => {
  return (
    <section id="yukselt" className="section upgrade">
      <div className="container">
        <div className="upgrade-layout">
          <div className="upgrade-copy">
            <span className="section-label">Yükselt</span>
            <h2>Limitin yetmedi mi? Paketini yükselt</h2>
            <p>
              Başlangıç paketinden Pro&apos;ya kadar istediğin zaman geçiş yap.
              Yükseltme anında aktif olur — ek kurulum gerekmez.
            </p>

            <ul className="upgrade-perks">
              {perks.map((perk) => (
                <li key={perk}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {perk}
                </li>
              ))}
            </ul>

            <div className="upgrade-actions">
              <Link to="/kayit" className="btn">
                Hemen yükselt
                <IconArrow />
              </Link>
              <a href="#fiyatlar" className="btn btn-ghost">Paketleri karşılaştır</a>
            </div>
          </div>

          <div className="upgrade-cards">
            {tiers.map((tier) => (
              <article
                key={tier.name}
                className={`upgrade-card${tier.highlight ? ' upgrade-card-featured' : ''}`}
              >
                {tier.badge && <span className="upgrade-card-badge">{tier.badge}</span>}
                <h3>{tier.name}</h3>
                <p className="upgrade-card-limit">
                  <strong>{tier.limit}</strong>
                  <span>sorgu / gün</span>
                </p>
                <p className="upgrade-card-price">
                  {tier.price}
                  <span>₺/ay</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Upgrade
