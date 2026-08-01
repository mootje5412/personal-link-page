import './SearchDemo.css'

const searchTypes = [
  {
    id: 'tc',
    icon: '🪪',
    title: 'TC Kimlik',
    desc: '11 haneli kimlik numarası ile kişi bilgilerine ulaşın.',
    placeholder: '12345678901',
    example: 'Ad, soyad, doğum yeri, anne-baba adı',
  },
  {
    id: 'isim',
    icon: '👤',
    title: 'İsim Soyisim',
    desc: 'Ad ve soyad ile kişi araması yapın.',
    placeholder: 'Ahmet Yılmaz',
    example: 'TC, adres, telefon bilgileri',
  },
  {
    id: 'adres',
    icon: '📍',
    title: 'Adres',
    desc: 'Adres bilgisi ile kayıtlı kişileri bulun.',
    placeholder: 'Kadıköy, İstanbul',
    example: 'Bölgedeki kayıtlı kişiler',
  },
  {
    id: 'telefon',
    icon: '📱',
    title: 'Telefon',
    desc: 'Telefon numarası ile sahibini sorgulayın.',
    placeholder: '05XX XXX XX XX',
    example: 'İsim, TC, adres bilgisi',
  },
  {
    id: 'aile',
    icon: '👨‍👩‍👧',
    title: 'Aile',
    desc: 'TC ile anne, baba ve kardeş bilgilerini görün.',
    placeholder: '12345678901',
    example: 'Aile bireyleri listesi',
  },
  {
    id: 'ip',
    icon: '🌐',
    title: 'IP Adresi',
    desc: 'IP adresi ile konum ve sağlayıcı bilgisi alın.',
    placeholder: '192.168.1.1',
    example: 'Konum, ISP, hostname',
  },
]

const SearchDemo = () => {
  return (
    <section id="sorgu" className="section search-demo">
      <div className="container">
        <div className="section-head search-demo-head">
          <span className="section-label">Sorgu Türleri</span>
          <h2>Ne arayabilirsiniz?</h2>
          <p>VeriPanel ile TC kimlik, isim, adres, telefon ve daha birçok veri türünü saniyeler içinde sorgulayın.</p>
        </div>

        <div className="search-grid">
          {searchTypes.map((type) => (
            <article key={type.id} className="search-card">
              <div className="search-card-icon">{type.icon}</div>
              <h3>{type.title}</h3>
              <p className="search-card-desc">{type.desc}</p>
              <div className="search-card-input">
                <span>{type.placeholder}</span>
              </div>
              <p className="search-card-example">{type.example}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SearchDemo
