import { Link } from 'react-router-dom'
import { IconArrow } from './icons/SearchIcons'
import './CtaBanner.css'

const CtaBanner = () => {
  return (
    <section className="cta-banner">
      <div className="container cta-inner">
        <div className="cta-copy">
          <span className="section-label">Başlayın</span>
          <h2>VeriPanel&apos;e hemen katılın</h2>
          <p>Binlerce kullanıcı gibi siz de dakikalar içinde sorgulamaya başlayın.</p>
        </div>
        <div className="cta-actions">
          <Link to="/kayit" className="btn">
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
