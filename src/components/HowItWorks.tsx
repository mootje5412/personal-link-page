import { Link } from 'react-router-dom'
import './HowItWorks.css'

const steps = [
  {
    num: '01',
    title: 'Hesap oluştur',
    desc: 'Kullanıcı adı ve şifre ile kayıt olun. E-posta isteğe bağlıdır.',
  },
  {
    num: '02',
    title: 'Paketinizi seçin',
    desc: 'Günlük sorgu limitinize uygun planı seçin ve panelinize erişin.',
  },
  {
    num: '03',
    title: 'Sorgulamaya başlayın',
    desc: 'TC, isim, adres veya telefon — anında sonuç alın.',
  },
]

const HowItWorks = () => {
  return (
    <section id="nasil-calisir" className="section section-dark how-it-works">
      <div className="how-bg" aria-hidden="true" />

      <div className="container">
        <div className="section-head how-head">
          <span className="section-label">Nasıl Çalışır</span>
          <h2>Dakikalar içinde hazır</h2>
          <p>Üç basit adımda kayıt olun ve sorgulamaya başlayın.</p>
        </div>

        <div className="steps-track">
          {steps.map((step, index) => (
            <article key={step.num} className="step-card">
              <div className="step-marker">
                <span className="step-num">{step.num}</span>
                {index < steps.length - 1 && <span className="step-line" aria-hidden="true" />}
              </div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="how-cta">
          <Link to="/kayit" className="btn btn-white">Ücretsiz kayıt ol</Link>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
