import { Link } from 'react-router-dom'
import './HowItWorks.css'

const steps = [
  {
    num: '01',
    title: 'Kayıt ol',
    desc: 'Kullanıcı adı ve şifre ile saniyeler içinde hesap oluşturun.',
  },
  {
    num: '02',
    title: 'Paket seç',
    desc: 'İhtiyacınıza uygun günlük sorgu limitine sahip paketi seçin.',
  },
  {
    num: '03',
    title: 'Sorgula',
    desc: 'TC, isim, adres veya telefon ile anında sonuç alın.',
  },
]

const HowItWorks = () => {
  return (
    <section id="nasil-calisir" className="section section-dark how-it-works">
      <div className="container">
        <div className="section-head how-head">
          <span className="section-label">Nasıl Çalışır</span>
          <h2>3 adımda başlayın</h2>
          <p>VeriPanel&apos;e kaydolun, paketinizi seçin ve hemen sorgulamaya başlayın.</p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <article key={step.num} className="step-card">
              <span className="step-num">{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
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
