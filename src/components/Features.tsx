import { IconRefresh, IconShield, IconZap } from './icons/SearchIcons'
import ScrollStack from './ScrollStack'
import './Features.css'

const searchTypes = [
  { name: 'Telefon No', desc: 'GSM numarası ile sahip bilgisi sorgulama' },
  { name: 'Hızlı Sonuç', desc: 'Numara gir, isim ve iletişim bilgilerini anında gör' },
  { name: 'Temiz Panel', desc: 'Sade arayüz, telefon sorgusuna odaklı deneyim' },
]

const highlights = [
  { icon: IconZap, title: 'Hızlı', desc: 'Ortalama yanıt süresi 1 saniyenin altında' },
  { icon: IconShield, title: 'Güvenli', desc: 'Uçtan uca SSL şifreli bağlantı' },
  { icon: IconRefresh, title: 'Güncel', desc: 'Sürekli güncellenen veri tabanı' },
]

const Features = () => {
  return (
    <section id="ozellikler" className="section features">
      <div className="container features-layout">
        <div className="features-head-sticky">
          <span className="section-label">Özellikler</span>
          <h2>Telefon sorgu altyapısı</h2>
          <p>
            Telefon sorgusu optimize edilmiş motorla çalışır. Tek arayüzden
            numara sahibi bilgilerine erişin.
          </p>
        </div>

        <ScrollStack items={searchTypes} />
      </div>

      <div className="container">
        <div className="highlights">
          {highlights.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="highlight">
              <div className="highlight-icon">
                <Icon />
              </div>
              <div className="highlight-text">
                <strong>{title}</strong>
                <span>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
