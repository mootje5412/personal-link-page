import { Link } from 'react-router-dom'
import './Pricing.css'

const plans = [
  {
    name: 'Başlangıç',
    price: '59',
    note: 'Denemek için ideal',
    items: ['200 sorgu / gün', 'Telefon sorgusu', 'Temel destek', 'Web panel erişimi'],
  },
  {
    name: 'Standart',
    price: '119',
    note: 'En popüler paket',
    items: ['1.000 sorgu / gün', 'Telefon sorgusu', 'Öncelikli destek', 'API erişimi'],
    featured: true,
  },
  {
    name: 'Pro',
    price: '199',
    note: 'Yoğun kullanım için',
    items: ['5.000 sorgu / gün', 'Telefon sorgusu', '7/24 VIP destek', 'API + toplu sorgu'],
  },
]

const Pricing = () => {
  return (
    <section id="fiyatlar" className="section pricing">
      <div className="container">
        <div className="section-head">
          <span className="section-label">Fiyatlandırma</span>
          <h2>Size uygun paketi seçin</h2>
          <p>Günlük sorgu limiti ile aylık abonelik. İstediğiniz zaman iptal edebilirsiniz.</p>
        </div>

        <div className="plans">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`plan${plan.featured ? ' plan-featured' : ''}`}
            >
              {plan.featured && <span className="plan-badge">Popüler</span>}
              <div className="plan-head">
                <h3>{plan.name}</h3>
                <p className="plan-note">{plan.note}</p>
              </div>
              <p className="plan-price">
                <span className="plan-amount">{plan.price}</span>
                <span className="plan-currency">₺/ay</span>
              </p>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/kayit" className={plan.featured ? 'btn plan-btn' : 'btn btn-outline plan-btn'}>
                Paketi seç
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
