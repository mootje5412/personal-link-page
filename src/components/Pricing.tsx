import './Pricing.css'

const plans = [
  {
    name: 'Başlangıç',
    price: '39',
    period: 'ay',
    description: 'Denemek isteyenler için',
    features: [
      '50 arama hakkı',
      'TC kimlik sorgulama',
      'İsim arama',
      'Temel destek',
    ],
    cta: 'Başla',
    featured: false,
  },
  {
    name: 'Standart',
    price: '79',
    period: 'ay',
    description: 'En çok tercih edilen paket',
    features: [
      '200 arama hakkı',
      'Tüm arama türleri',
      'Adres ve aile sorgulama',
      'IP ve e-posta arama',
      'Öncelikli destek',
    ],
    cta: 'Hemen Al',
    featured: true,
  },
  {
    name: 'Pro',
    price: '149',
    period: 'ay',
    description: 'Yoğun kullanım için',
    features: [
      '1000 arama hakkı',
      'Sınırsız arama türü',
      'Hızlı yanıt garantisi',
      '7/24 destek',
      'Erken erişim özellikleri',
    ],
    cta: 'Pro Ol',
    featured: false,
  },
]

const Pricing = () => {
  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span>Fiyatlandırma</span>
          </div>
          <h2 className="section-title">
            Uygun Fiyatlar,<br />
            <span className="gradient-text">Tam Erişim</span>
          </h2>
          <p className="section-description">
            Gizli ücret yok. İhtiyacınıza uygun paketi seçin, hemen kullanmaya başlayın.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card ${plan.featured ? 'pricing-card-featured' : ''}`}
            >
              {plan.featured && <span className="pricing-tag">Popüler</span>}
              <div className="pricing-card-header">
                <h3 className="pricing-name">{plan.name}</h3>
                <p className="pricing-subtitle">{plan.description}</p>
              </div>
              <div className="pricing-price">
                <span className="price-amount">{plan.price}</span>
                <span className="price-currency">₺</span>
                <span className="price-period">/{plan.period}</span>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`pricing-button ${plan.featured ? 'pricing-button-primary' : ''}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-note">
          <p>Tüm paketlerde güvenli ödeme. İstediğiniz zaman iptal edebilirsiniz.</p>
        </div>
      </div>
    </section>
  )
}

export default Pricing
