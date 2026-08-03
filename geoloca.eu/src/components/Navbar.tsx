import { useEffect, useState } from 'react';
import './Navbar.css';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-wrap">
        <div className="container nav-inner">
          <a href="#" className="logo">
            Geo<span>Loca</span>
          </a>

          <button
            type="button"
            className={`nav-toggle ${open ? 'open' : ''}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>

          <nav className={`nav-links ${open ? 'open' : ''}`}>
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <a href="#pricing" className="nav-cta" onClick={() => setOpen(false)}>
              Free trial
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
