import './Features.css'

const items = [
  'TC kimlik sorgulama',
  'İsim arama',
  'Adres sorgulama',
  'Aile bireyleri',
  'IP adresi',
  'E-posta arama',
]

const Features = () => {
  return (
    <section id="ozellikler" className="block">
      <div className="container">
        <h2>Arama türleri</h2>
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Features
