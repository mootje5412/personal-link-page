import { useEffect, useState } from 'react';
import './Navbar.css';

const links = [
  { href: '#how', label: 'How it works' },
  { href: '#countries', label: 'Countries' },
  { href: '#setup', label: 'Setup' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <nav className="navbar-shell">
        <div className="navbar-inner">
          <a href="#" className="logo">
            <span className="logo-mark">G</span>
            GeoLoca
          </a>

          <button
            type="button"
            className={`menu-btn ${open ? 'open' : ''}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>

          <ul className={`nav-links ${open ? 'open' : ''}`}>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#setup" className="nav-cta" onClick={() => setOpen(false)}>
                Get started
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
