import { IconRefresh, IconShield, IconZap } from './icons/SearchIcons'
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
          <h2>Profesyonel sorgu altyapısı</h2>
          <p>
            Her sorgu türü optimize edilmiş motorlarla çalışır. Tek arayüzden
            tüm verilere erişin.
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
