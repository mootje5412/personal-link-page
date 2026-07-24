import './MobileNav.css'

const MobileNav = () => {
  return (
    <nav className="mobile-nav" aria-label="Mobil navigasyon">
      <a href="#features" className="mobile-nav-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Özellikler</span>
      </a>
      <a href="#pricing" className="mobile-nav-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
        <span>Fiyatlar</span>
      </a>
      <a href="#pricing" className="mobile-nav-link mobile-nav-cta">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Başla</span>
      </a>
    </nav>
  )
}

export default MobileNav
