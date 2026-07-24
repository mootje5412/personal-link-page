import ScrollStack from './ScrollStack'
import './Features.css'

const searchTypes = [
  { name: 'TC Kimlik', desc: 'Kimlik numarası ile sorgulama' },
  { name: 'İsim', desc: 'Ad ve soyad ile arama' },
  { name: 'Adres', desc: 'Adres bilgisi sorgulama' },
  { name: 'Aile', desc: 'Aile bireyleri listesi' },
  { name: 'IP', desc: 'IP adresi sorgulama' },
  { name: 'E-posta', desc: 'E-posta ile arama' },
]

const highlights = [
  { title: 'Hızlı', desc: 'Saniyeler içinde sonuç' },
  { title: 'Güncel', desc: 'Düzenli güncellenen veri' },
  { title: 'Güvenli', desc: 'Şifreli bağlantı' },
]

const Features = () => {
  return (
    <section id="ozellikler" className="section features">
      <div className="container features-layout">
        <div className="features-head-sticky">
          <span className="section-label">Özellikler</span>
          <h2>Ne arayabilirsin?</h2>
          <p>Panelde kullanabileceğin tüm sorgu türleri.</p>
        </div>

        <ScrollStack items={searchTypes} />
      </div>

      <div className="container">
        <div className="highlights">
          {highlights.map((item) => (
            <div key={item.title} className="highlight">
              <strong>{item.title}</strong>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
