import './Pricing.css'

const plans = [
  {
    name: 'Başlangıç',
    price: '39',
    details: ['50 arama', 'TC ve isim', 'Temel destek'],
  },
  {
    name: 'Standart',
    price: '79',
    details: ['200 arama', 'Tüm arama türleri', 'Öncelikli destek'],
  },
  {
    name: 'Pro',
    price: '149',
    details: ['1000 arama', 'Tüm arama türleri', '7/24 destek'],
  },
]

const Pricing = () => {
  return (
    <section id="fiyatlar" className="block pricing">
      <div className="container">
        <h2>Fiyatlar</h2>
        <div className="plans">
          {plans.map((plan) => (
            <div key={plan.name} className="plan">
              <div className="plan-top">
                <span className="plan-name">{plan.name}</span>
                <span className="plan-price">{plan.price} ₺<small>/ay</small></span>
              </div>
              <ul>
                {plan.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
