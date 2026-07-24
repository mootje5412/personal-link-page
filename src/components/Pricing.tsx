import './Pricing.css'

const plans = [
  {
    name: 'Başlangıç',
    price: '39',
    note: 'Denemek için',
    items: ['50 arama / ay', 'TC ve isim', 'Temel destek'],
  },
  {
    name: 'Standart',
    price: '79',
    note: 'Çoğu kullanıcı bunu alır',
    items: ['200 arama / ay', 'Tüm arama türleri', 'Öncelikli destek'],
    featured: true,
  },
  {
    name: 'Pro',
    price: '149',
    note: 'Yoğun kullanım',
    items: ['1000 arama / ay', 'Tüm arama türleri', '7/24 destek'],
  },
]

const Pricing = () => {
  return (
    <section id="fiyatlar" className="section pricing">
      <div className="container">
        <div className="section-head">
          <h2>Fiyatlar</h2>
          <p>Aylık paketler. İstediğin zaman iptal edebilirsin.</p>
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
                {plan.price} <span>₺/ay</span>
              </p>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button type="button" className={plan.featured ? 'btn plan-btn' : 'btn btn-outline plan-btn'}>
                Seç
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
