import ScrollStack from './ScrollStack'
import './Features.css'

const searchTypes = [
  { name: 'TC Kimlik No', desc: '11 haneli TC ile tam kimlik bilgisi, doğum yeri, anne-baba adı' },
  { name: 'İsim & Soyisim', desc: 'Ad soyad ile kişi arama, TC ve iletişim bilgileri' },
  { name: 'Adres Sorgusu', desc: 'İl, ilçe, mahalle bazında kayıtlı kişi listesi' },
  { name: 'Aile Bilgisi', desc: 'Anne, baba, kardeş ve eş bilgilerine erişim' },
  { name: 'Telefon No', desc: 'GSM numarası ile sahip bilgisi sorgulama' },
  { name: 'IP & E-posta', desc: 'IP konum sorgusu ve e-posta ile kişi arama' },
]

const highlights = [
  { title: 'Hızlı', desc: 'Saniyeler içinde sonuç' },
  { title: 'Güvenli', desc: 'SSL şifreli bağlantı' },
  { title: 'Güncel', desc: 'Sürekli güncellenen veri' },
]

const Features = () => {
  return (
    <section id="ozellikler" className="section features">
      <div className="container features-layout">
        <div className="features-head-sticky">
          <span className="section-label">Özellikler</span>
          <h2>Tüm sorgu türleri tek panelde</h2>
          <p>VeriPanel&apos;de ihtiyacınız olan her türlü veri sorgusunu yapabilirsiniz.</p>
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
