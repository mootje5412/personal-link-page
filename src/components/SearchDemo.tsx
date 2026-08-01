import { SearchTypeIcon, type SearchIconId } from './icons/SearchIcons'
import './SearchDemo.css'

type SearchType = {
  id: SearchIconId
  title: string
  desc: string
  placeholder: string
  tag: string
}

const searchTypes: SearchType[] = [
  {
    id: 'tc',
    title: 'TC Kimlik',
    desc: '11 haneli kimlik numarası ile tam kişi bilgilerine ulaşın.',
    placeholder: '12345678901',
    tag: 'Kimlik',
  },
  {
    id: 'isim',
    title: 'İsim Soyisim',
    desc: 'Ad ve soyad ile kişi araması yapın, TC ve iletişim bilgilerini görün.',
    placeholder: 'Ahmet Yılmaz',
    tag: 'Kişi',
  },
  {
    id: 'adres',
    title: 'Adres',
    desc: 'İl, ilçe veya mahalle bazında kayıtlı kişileri listeleyin.',
    placeholder: 'Kadıköy, İstanbul',
    tag: 'Konum',
  },
  {
    id: 'telefon',
    title: 'Telefon',
    desc: 'GSM numarası ile numara sahibinin bilgilerini sorgulayın.',
    placeholder: '05XX XXX XX XX',
    tag: 'GSM',
  },
  {
    id: 'aile',
    title: 'Aile',
    desc: 'TC ile anne, baba, kardeş ve eş bilgilerine erişin.',
    placeholder: '12345678901',
    tag: 'Aile',
  },
  {
    id: 'ip',
    title: 'IP Adresi',
    desc: 'IP adresi ile konum, ISP ve hostname bilgisi alın.',
    placeholder: '192.168.1.1',
    tag: 'Ağ',
  },
]

const SearchDemo = () => {
  return (
    <section id="sorgu" className="section search-demo">
      <div className="container">
        <div className="search-demo-top">
          <div className="section-head search-demo-head">
            <span className="section-label">Sorgu Türleri</span>
            <h2>Her veri türü için ayrı sorgu modülü</h2>
            <p>
              TC kimlikten telefon numarasına — ihtiyacınız olan her sorgu tipi
              VeriPanel&apos;de hazır ve optimize edilmiş şekilde sunulur.
            </p>
          </div>
        </div>

        <div className="search-grid">
          {searchTypes.map((type, index) => (
            <article key={type.id} className="search-card">
              <div className="search-card-top">
                <div className="search-card-icon-wrap">
                  <SearchTypeIcon id={type.id} />
                </div>
                <span className="search-card-tag">{type.tag}</span>
              </div>

              <div className="search-card-body">
                <span className="search-card-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{type.title}</h3>
                <p className="search-card-desc">{type.desc}</p>
              </div>

              <div className="search-card-footer">
                <div className="search-card-input">
                  <span className="search-card-input-label">Örnek sorgu</span>
                  <code>{type.placeholder}</code>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SearchDemo
