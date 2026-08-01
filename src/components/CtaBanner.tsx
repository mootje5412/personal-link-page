import { Link } from 'react-router-dom'
import { IconArrow } from './icons/SearchIcons'
import './CtaBanner.css'

const CtaBanner = () => {
  return (
    <section className="cta-banner">
      <div className="container cta-inner">
        <div className="cta-copy">
          <span className="section-label">Hazır mısın?</span>
          <h2>Dakikalar içinde panele geç</h2>
          <p>Kayıt ol, API anahtarını al ve telefon sorgusuna hemen başla.</p>
        </div>
        <div className="cta-actions">
          <Link to="/kayit" className="btn btn-white">
            Ücretsiz kayıt
            <IconArrow />
          </Link>
          <Link to="/giris" className="btn btn-ghost">Giriş yap</Link>
        </div>
      </div>
    </section>
  )
}

export default CtaBanner
