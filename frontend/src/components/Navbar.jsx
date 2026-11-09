import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { getInitials, readLogoFile } from '../utils/logo.js';
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
  const { lang, setLang, t, session, logout, openAuth, updateSessionLogo, showToast } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const wrapperRef = useRef(null);
  const navGroupRef = useRef(null);
  const logoInputRef = useRef(null);

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

  // Tutup dropdown bahasa & dropdown layanan saat klik di luar
  useEffect(() => {
    const onOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setLangOpen(false);
      }
      if (navGroupRef.current && !navGroupRef.current.contains(e.target)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('click', onOutside);
    return () => document.removeEventListener('click', onOutside);
  }, []);

  // Kunci scroll & tutup menu lewat Escape saat menu mobile terbuka.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  // Menu utama dibuat ringkas: Beranda, Produk, Domestik, Layanan (dropdown),
  // dan Kontak. Menu sekunder dikelompokkan agar navbar tidak penuh.
  const navLinks = [
    { key: 'nav_home', path: '/', hash: '', section: 'hero' },
    { key: 'nav_products', path: '/produk', hash: '', section: '' },
    { key: 'nav_domestic', path: '/domestik', hash: '', section: '' },
    {
      key: 'nav_services',
      children: [
        { key: 'nav_rfq_studio', path: '/solusi', hash: 'rfq-studio', section: '' },
        { key: 'nav_documents', path: '/solusi', hash: 'dokumen', section: '' },
        { key: 'nav_export_flow', path: '/', hash: 'alur-ekspor', section: 'alur-ekspor' },
        { key: 'nav_import_flow', path: '/', hash: 'alur-impor', section: '' },
      ],
    },
    { key: 'nav_contact', path: '/', hash: 'kontak', section: 'kontak' },
  ];

  function isLinkActive(link) {
    if (link.section) {
      return location.pathname === '/' && activeSection === link.section;
    }
    if (link.hash) {
      return location.pathname === link.path && location.hash === `#${link.hash}`;
    }
    return location.pathname === link.path && !location.hash;
  }

  function scrollToHash(hash) {
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleNavLink(e, link) {
    e.preventDefault();
    setMenuOpen(false);
    const { path, hash } = link;

    if (location.pathname === path) {
      if (hash) {
        if (location.hash !== `#${hash}`) {
          navigate(`${path}#${hash}`, { replace: true });
        }
        // Beri kesempatan React merender tab/section tujuan sebelum scroll.
        requestAnimationFrame(() => scrollToHash(hash));
      } else {
        if (location.hash) navigate(path, { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    navigate(hash ? `${path}#${hash}` : path);
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const dataUrl = await readLogoFile(file);
      updateSessionLogo(dataUrl);
      showToast('✅ Logo profil berhasil diperbarui.');
    } catch (err) {
      showToast(`❌ ${err.message || 'Gagal memuat logo.'}`);
    }
  }

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
          <img src="/assets/logo-transparent.webp" alt="NusaBridge Logo" className="brand-logo" />
        </Link>

        <nav className={`nav-menu ${menuOpen ? 'mobile-open' : ''}`} id="navMenu" aria-label="Navigasi utama">
          {navLinks.map((l) => {
            if (l.children) {
              const groupActive = l.children.some(isLinkActive);
              return (
                <div
                  className={`nav-group ${servicesOpen ? 'open' : ''}`}
                  key={l.key}
                  ref={navGroupRef}
                >
                  <button
                    type="button"
                    className={`nav-link nav-group-btn ${groupActive ? 'active' : ''}`}
                    aria-expanded={servicesOpen}
                    aria-haspopup="true"
                    onClick={() => setServicesOpen((v) => !v)}
                  >
                    <T k={l.key} />
                    <svg
                      className="nav-chevron"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <div className="nav-dropdown">
                    {l.children.map((child) => {
                      const childActive = isLinkActive(child);
                      const childHref = child.hash ? `${child.path}#${child.hash}` : child.path;
                      return (
                        <a
                          key={child.key}
                          className={`nav-dropdown-link ${childActive ? 'active' : ''}`}
                          href={childHref}
                          onClick={(e) => {
                            setServicesOpen(false);
                            handleNavLink(e, child);
                          }}
                          data-i18n={child.key}
                          aria-current={childActive ? 'page' : undefined}
                        >
                          <T k={child.key} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const active = isLinkActive(l);
            const href = l.hash ? `${l.path}#${l.hash}` : l.path;
            return (
              <a
                key={l.key}
                className={`nav-link ${active ? 'active' : ''}`}
                href={href}
                onClick={(e) => handleNavLink(e, l)}
                data-i18n={l.key}
                aria-current={active ? 'page' : undefined}
              >
                <T k={l.key} />
              </a>
            );
          })}

          {session?.loggedIn && (
            <div className="mobile-nav-user">
              <div className="mnu-profile">
                {session.logo ? (
                  <img src={session.logo} alt={`Logo ${session.company || session.name}`} className="mnu-avatar" />
                ) : (
                  <span className="mnu-avatar mnu-initials">{getInitials(session.company || session.name)}</span>
                )}
                <div>
                  <strong>{session.company || session.name}</strong>
                  <span>
                    {session.role === 'buyer' || session.role === 'importer'
                      ? (lang === 'en' ? 'Global Buyer' : 'Importir Global')
                      : (lang === 'en' ? 'Indonesian Exporter' : 'Eksportir Indonesia')}
                  </span>
                </div>
              </div>
              <button className="btn btn-outline btn-block" type="button" onClick={() => { setMenuOpen(false); logout(); }}>
                {t('btn_logout', lang === 'en' ? 'Sign out' : 'Keluar')}
              </button>
            </div>
          )}

          {!session?.loggedIn && (
            <div className="mobile-nav-auth">
              <button className="btn btn-outline btn-block" type="button" onClick={() => { setMenuOpen(false); openAuth('login'); }}>
                <T k="btn_login" />
              </button>
              <button className="btn btn-primary btn-block" type="button" onClick={() => { setMenuOpen(false); openAuth('register'); }}>
                <T k="btn_register" /> <ArrowRightIcon />
              </button>
            </div>
          )}
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
              <button
                type="button"
                className="ulp-avatar-btn"
                title={lang === 'en' ? 'Click to change logo' : 'Klik untuk ganti logo'}
                onClick={() => logoInputRef.current?.click()}
              >
                {session.logo ? (
                  <img src={session.logo} alt={`Logo ${session.company || session.name}`} className="ulp-avatar" />
                ) : (
                  <span className="ulp-avatar ulp-avatar-initials" aria-hidden="true">
                    {getInitials(session.company || session.name)}
                  </span>
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="logo-file-input"
                onChange={handleLogoChange}
              />
              <div className="ulp-info">
                <span className="ulp-name">{session.company || session.name}</span>
                <span className="ulp-badge">
                  {session.role === 'buyer' || session.role === 'importer'
                    ? t('nav_badge_buyer', lang === 'en' ? '● Global Buyer' : '● Importir Global')
                    : t('nav_badge_seller', lang === 'en' ? '● Indonesian Exporter' : '● Eksportir Indonesia')}
                </span>
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
            </>
          )}

          <button
            className={`mobile-toggle ${menuOpen ? 'open' : ''}`}
            type="button"
            aria-label={menuOpen
              ? (lang === 'en' ? 'Close navigation menu' : 'Tutup menu navigasi')
              : (lang === 'en' ? 'Open navigation menu' : 'Buka menu navigasi')}
            aria-expanded={menuOpen}
            aria-controls="navMenu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
