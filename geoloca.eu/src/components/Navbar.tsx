import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';

const links = [
  { href: '/#features', label: 'Features' },
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export default function Navbar() {
  const { user } = useAuth();
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
          <Link to="/" className="logo">
            Geo<span>Loca</span>
          </Link>

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
            {user ? (
              <Link to="/dashboard" className="nav-cta" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-login" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link to="/register" className="nav-cta" onClick={() => setOpen(false)}>
                  Free trial
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
