import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import T from './T.jsx';

const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/** Ikon-ikon dropdown bahasa & hamburger menu (tanpa eksternal dependensi) */
const GlobeIcon = () => (
  <svg className="globe-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/**
 * Navbar reaktif:
 * - scroll => efek .scrolled
 * - mobile menu toggle
 * - bahasa ID/EN dengan state global
 * - tombol Masuk/Daftar membuka AuthModal
 * - profil user saat sudah login
 */
export default function Navbar() {
  const { lang, setLang, t, session, logout, openAuth } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const wrapperRef = useRef(null);

  // Efek navbar saat scroll
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);

      // Scroll-spy hanya relevan di halaman beranda
      if (location.pathname === '/') {
        const sections = document.querySelectorAll('section[id], header[id]');
        let current = '';
        sections.forEach((s) => {
          const top = s.offsetTop - 120;
          if (window.scrollY >= top && window.scrollY < top + s.offsetHeight) {
            current = s.id;
          }
        });
        setActiveSection(current);
      } else {
        setActiveSection('');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  // Tutup dropdown bahasa saat klik di luar
  useEffect(() => {
    const onOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('click', onOutside);
    return () => document.removeEventListener('click', onOutside);
  }, []);

  const navLinks = [
    { to: '/', key: 'nav_home', section: 'hero' },
    { to: '/produk', key: 'nav_products' },
    { to: '/solusi', key: 'nav_solutions' },
    { to: '/#alur-ekspor', key: 'nav_workflow', section: 'alur-ekspor' },
    { to: '/harga', key: 'nav_pricing' },
    { to: '/#tentang', key: 'nav_about', section: 'tentang' },
  ];

  function handleSectionLink(to, section) {
    setMenuOpen(false);
    if (location.pathname === to && section) {
      const el = document.getElementById(section);
      if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
    } else {
      navigate(section ? `${to}#${section}` : to);
    }
  }

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
          <img src="/assets/logo-transparent.webp" alt="NusaBridge Logo" className="brand-logo" />
        </Link>

        <nav className={`nav-menu ${menuOpen ? 'mobile-open' : ''}`} id="navMenu">
          {navLinks.map((l) => {
            const isHash = l.to.startsWith('/#');
            const active = l.section
              ? activeSection === l.section
              : location.pathname === l.to;
            return isHash ? (
              <a
                key={l.key}
                className={`nav-link ${active ? 'active' : ''}`}
                href={l.to}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionLink('/', l.section);
                }}
                data-i18n={l.key}
              >
                <T k={l.key} />
              </a>
            ) : (
              <NavLink
                key={l.key}
                to={l.to}
                className={() => `nav-link ${active ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
                data-i18n={l.key}
              >
                <T k={l.key} />
              </NavLink>
            );
          })}

          <div className="mobile-nav-auth">
            <button className="btn btn-outline btn-block" type="button" onClick={() => { setMenuOpen(false); openAuth('login'); }}>
              <T k="btn_login" />
            </button>
            <button className="btn btn-primary btn-block" type="button" onClick={() => { setMenuOpen(false); openAuth('register'); }}>
              <T k="btn_register" /> <ArrowRightIcon />
            </button>
          </div>
        </nav>

        <div className="nav-actions">
          {/* Dropdown pemilih bahasa (ID / EN) */}
          <div className={`lang-dropdown-wrapper ${langOpen ? 'open' : ''}`} ref={wrapperRef} id="langDropdownWrapper">
            <button
              className="lang-selector-btn"
              type="button"
              aria-label="Pilih Bahasa"
              aria-expanded={langOpen}
              onClick={() => setLangOpen((v) => !v)}
            >
              <GlobeIcon />
              <span>{lang.toUpperCase()}</span>
              <svg className="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div className="lang-dropdown-menu" id="langDropdownMenu">
              {[
                { code: 'id', flag: '🇮🇩', label: 'Indonesia', short: 'ID' },
                { code: 'en', flag: '🇬🇧', label: 'English', short: 'EN' },
              ].map((opt) => (
                <button
                  key={opt.code}
                  className={`lang-option-item ${lang === opt.code ? 'active' : ''}`}
                  onClick={() => {
                    setLang(opt.code);
                    setLangOpen(false);
                  }}
                >
                  <span className="flag-icon">{opt.flag}</span>
                  <span className="lang-name">{opt.label}</span>
                  <span className="lang-code">{opt.short}</span>
                  <span className="lang-check">{lang === opt.code ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </div>

          {session?.loggedIn ? (
            <div className="user-logged-profile" id="userLoggedNav">
              <img src="/assets/avatar.webp" alt="Avatar" className="ulp-avatar" />
              <div className="ulp-info">
                <span className="ulp-name">{session.company || session.name}</span>
                <span className="ulp-badge">● Terverifikasi OSS</span>
              </div>
              <button className="btn-logout" type="button" title="Keluar dari sesi akun" onClick={logout}>
                {t('btn_logout', 'Keluar')}
              </button>
            </div>
          ) : (
            <>
              <button className="btn btn-outline nav-desktop-auth" onClick={() => openAuth('login')}>
                <T k="btn_login" />
              </button>
              <button className="btn btn-primary nav-desktop-auth" onClick={() => openAuth('register')}>
                <T k="btn_register" /> <ArrowRightIcon />
              </button>
              <button
                className={`mobile-toggle ${menuOpen ? 'open' : ''}`}
                aria-label="Toggle menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span />
                <span />
                <span />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
