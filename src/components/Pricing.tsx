import { Link } from 'react-router-dom'
import './Pricing.css'

const plans = [
  {
    name: 'Başlangıç',
    price: '59',
    note: 'Denemek için',
    items: ['75 arama / ay', 'TC ve isim', 'Temel destek'],
  },
  {
    name: 'Standart',
    price: '119',
    note: 'En popüler',
    items: ['300 arama / ay', 'Tüm arama türleri', 'Öncelikli destek'],
    featured: true,
  },
  {
    name: 'Pro',
    price: '199',
    note: 'Yoğun kullanım',
    items: ['1500 arama / ay', 'Tüm arama türleri', '7/24 destek'],
  },
]

const Pricing = () => {
  return (
    <section id="fiyatlar" className="section pricing">
      <div className="container">
        <div className="section-head">
          <span className="section-label">Fiyatlandırma</span>
          <h2>Paketler</h2>
          <p>Aylık abonelik. İstediğin zaman iptal.</p>
        </div>

        <div className="plans">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`plan${plan.featured ? ' plan-featured' : ''}`}
            >
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
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link to="/kayit" className={plan.featured ? 'btn plan-btn' : 'btn btn-outline plan-btn'}>
                Seç
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
