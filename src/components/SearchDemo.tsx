import { SearchTypeIcon } from './icons/SearchIcons'
import './SearchDemo.css'

const SearchDemo = () => {
  return (
    <section id="sorgu" className="section search-demo">
      <div className="container">
        <div className="search-demo-top">
          <div className="section-head search-demo-head">
            <span className="section-label">Telefon Sorgusu</span>
            <h2>GSM numarası ile anında kişi bilgisi</h2>
            <p>
              VeriPanel şu an telefon sorgusuna odaklı. Numara gir, veritabanında
              anında arama yap — isim, e-posta ve kimlik bilgilerini gör.
            </p>
          </div>
        </div>

        <div className="search-grid search-grid--single">
          <article className="search-card">
            <div className="search-card-top">
              <div className="search-card-icon-wrap">
                <SearchTypeIcon id="telefon" />
              </div>
              <span className="search-card-tag">GSM</span>
            </div>

            <div className="search-card-body">
              <span className="search-card-index">01</span>
              <h3>Telefon</h3>
              <p className="search-card-desc">
                GSM numarası ile numara sahibinin bilgilerini anında sorgula.
              </p>
            </div>

            <div className="search-card-footer">
              <div className="search-card-input">
                <span className="search-card-input-label">Örnek sorgu</span>
                <code>05XX XXX XX XX</code>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default SearchDemo
