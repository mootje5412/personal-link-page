import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div>
            <p className="footer-name">Apex Panel</p>
            <p className="footer-desc">Türk arama paneli</p>
          </div>
          <div className="footer-links">
            <a href="#ozellikler">Özellikler</a>
            <a href="#fiyatlar">Fiyatlar</a>
          </div>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} Apex Panel</p>
      </div>
    </footer>
  )
}

export default Footer
