import { useApp } from '../context/AppContext.jsx';
import { Link } from 'react-router-dom';
import T from './T.jsx';

/*
 * Footer yang bersifat global — dipakai di semua halaman React.
 * Konten mengikuti markup footer lama agar desain tetap konsisten.
 */
export default function Footer() {
  const { openInfo } = useApp();

  const infoLinks = [
    { key: 'res_help', title: 'Pusat Bantuan' },
    { key: 'res_docs', title: 'Dokumentasi' },
    { key: 'res_blog', title: 'Blog' },
    { key: 'res_privacy', title: 'Kebijakan Privasi' },
    { key: 'res_terms', title: 'Syarat & Ketentuan' },
  ];

  const navLinks = [
    { key: 'nav_home', to: '/' },
    { key: 'nav_products', to: '/produk' },
    { key: 'nav_solutions', to: '/solusi' },
    { key: 'nav_workflow', to: '/#alur-ekspor' },
    { key: 'nav_pricing', to: '/harga' },
    { key: 'nav_about', to: '/#tentang' },
  ];

  function openInfoFor(title) {
    openInfo(
      title,
      `Bagian "${title}" merupakan modul dokumentasi dan referensi resmi prototype NusaBridge untuk perlombaan GTNIC 2026.`
    );
  }

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-top-grid">
          {/* Kolom Brand */}
          <div className="footer-col-brand">
            <Link to="/" className="footer-logo-link">
              <img src="/assets/logo-transparent.webp" alt="NusaBridge" className="footer-logo-img" />
            </Link>
            <p className="footer-brand-desc">
              <T k="footer_brand_desc" />
            </p>
          </div>

          {/* Navigasi */}
          <div className="footer-col-links">
            <h4 className="footer-col-title"><T k="footer_title_nav" /></h4>
            <ul className="footer-links-list">
              {navLinks.map((l) => (
                <li key={l.key}>
                  {l.to.includes('#') ? (
                    <a
                      href={l.to}
                      onClick={(e) => {
                        e.preventDefault();
                        const [path, hash] = l.to.split('#');
                        const el = document.getElementById(hash);
                        if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
                      }}
                      data-i18n={l.key}
                    >
                      <T k={l.key} />
                    </a>
                  ) : (
                    <Link to={l.to} data-i18n={l.key}>
                      <T k={l.key} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Sumber Daya */}
          <div className="footer-col-links">
            <h4 className="footer-col-title"><T k="footer_title_resources" /></h4>
            <ul className="footer-links-list">
              {infoLinks.map((l) => (
                <li key={l.key}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openInfoFor(l.title);
                    }}
                    data-i18n={l.key}
                  >
                    <T k={l.key} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sosial */}
          <div className="footer-col-social">
            <h4 className="footer-col-title"><T k="footer_title_social" /></h4>
            <div className="footer-social-icons">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon-box" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon-box" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="social-icon-box" aria-label="Discord">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="copyright-text">© 2026 NusaBridge. Tim Arjika Labs - SMK Antartika 1 Sidoarjo.</p>
          <p className="prototype-note">Platform ini adalah prototype untuk keperluan kompetisi GTNIC 2026.</p>
        </div>
      </div>
    </footer>
  );
}
