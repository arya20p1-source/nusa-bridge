import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import T from '../components/T.jsx';
import { apiUrl } from '../utils/api.js';
import { PRODUCTS_DATA } from '../data/products.js';

/**
 * ==========================================================================
 * NUSABRIDGE - Halaman Katalog Produk Ekspor (port produk.html + produk.js)
 * Search, sort, filter kategori, paginasi 12/halaman, modal spesifikasi lab,
 * dan modal RFQ AI.
 * ==========================================================================
 */

const ITEMS_PER_PAGE = 12;

const CAT_CHIPS = [
  { key: 'all', label: 'Semua Komoditas' },
  { key: 'kopi', label: '☕ Kopi Ekspor Unggulan' },
  { key: 'rempah', label: '🌿 Rempah & Hasil Alam' },
  { key: 'kriya', label: '🪑 Kriya & Kerajinan' },
  { key: 'tekstil', label: '🧵 Tekstil & Wastra Nusantara' },
];

const CATEGORY_LABELS = {
  kopi: 'Kopi Ekspor Unggulan',
  rempah: 'Rempah & Hasil Alam',
  kriya: 'Kriya & Kerajinan',
  tekstil: 'Tekstil & Wastra Nusantara',
};

function formatUSD(num) {
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function getCategoryLabel(cat) {
  return CATEGORY_LABELS[cat] || 'Komoditas Unggulan';
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// Modal Spesifikasi Mutu Lab
function SpecModal({ prod, onClose, onLanjutRfq }) {
  if (!prod) return null;
  return (
    <div
      className="modal-overlay show active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card modal-large">
        <button className="modal-close-btn" type="button" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <div className="pill-badge pill-blue">SPESIFIKASI MUTU &amp; EKSPOR</div>
          <h3 className="modal-title">{prod.name}</h3>
          <p className="modal-subtitle">Spesifikasi teknis, sertifikat uji lab, dan parameter ekspor internasional.</p>
        </div>
        <div className="modal-body-spec">
          <div className="spec-grid-layout">
            <div className="spec-col-left">
              <h4>Parameter Laboratorium &amp; Pengapalan</h4>
              <table className="spec-table">
                <tbody>
                  <tr><th>Asal Daerah / Kebun:</th><td><strong>{prod.origin}</strong></td></tr>
                  <tr><th>Kode HS Resmi:</th><td><strong>{prod.hsCode}</strong></td></tr>
                  <tr><th>Pelabuhan Muat:</th><td><strong>{prod.shipping || 'Tanjung Priok / Tanjung Perak'}</strong></td></tr>
                  <tr><th>Estimasi Harga:</th><td><strong>USD {formatUSD(prod.price)} / {prod.unit}</strong></td></tr>
                  <tr><th>Minimal Order (MOQ):</th><td><strong>{prod.moq.toLocaleString('id-ID')} {prod.unit}</strong></td></tr>
                  {prod.specs && prod.specs.length > 0 ? (
                    prod.specs.map((s) => (
                      <tr key={s.k}><th>{s.k}</th><td><strong>{s.v}</strong></td></tr>
                    ))
                  ) : (
                    <tr><th>Standar Mutu</th><td><strong>Standar SNI &amp; Ekspor Internasional</strong></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="spec-col-right">
              <h4>Sertifikasi &amp; Legalitas Ekspor</h4>
              <div className="spec-cert-list">
                {prod.certs && prod.certs.length > 0 ? (
                  prod.certs.map((c) => (
                    <div className="spec-cert-item" key={c}><span className="sci-check">✓</span> {c}</div>
                  ))
                ) : (
                  <div className="spec-cert-item"><span className="sci-check">✓</span> Legalitas NIB &amp; NPWP OSS Terverifikasi</div>
                )}
              </div>
              <div className="spec-ai-note">
                <div className="san-icon">🤖</div>
                <div className="san-text">
                  <strong>Rekomendasi NusaBridge AI Agent:</strong><br />
                  Komoditas ini memiliki kelayakan ekspor tinggi. Draf dokumen Proforma Invoice, Certificate of Origin (COO), dan deklarasi Incoterms 2020 dapat di-generate otomatis oleh AI dalam hitungan detik.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer-spec">
          <button className="btn btn-outline" type="button" onClick={onClose}>Tutup</button>
          <button className="btn btn-primary" type="button" onClick={onLanjutRfq}>Ajukan Permintaan Harga (RFQ)</button>
        </div>
      </div>
    </div>
  );
}

// Modal RFQ AI
function RfqModal({ productName, onClose }) {
  const [qty, setQty] = useState('');
  const [terms, setTerms] = useState('FOB');
  const [port, setPort] = useState('');
  const [contact, setContact] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const portVal = port || 'Port of Hamburg';
    const termsVal = terms || 'CIF Hamburg';
    // Kirim ke backend (best-effort, tetap sukses saat server offline)
    fetch(apiUrl('/api/rfq'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: productName || 'Komoditas Ekspor',
        quantity: qty || '1000',
        targetIncoterms: termsVal,
        buyerCountry: portVal,
      }),
    }).catch(() => {});

    onClose();
    // eslint-disable-next-line no-alert
    window.alert(`🎉 Permintaan RFQ untuk "${productName || 'Komoditas Ekspor'}" (${qty || '1000'} Unit - ${termsVal}) berhasil diajukan!\n\nAI Agent NusaBridge sedang menganalisis penawaran dan menghubungkan ke mitra logistik.`);
  }

  return (
    <div
      className="modal-overlay show active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card">
        <button className="modal-close-btn" type="button" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <div className="pill-badge pill-blue">AI RFQ STUDIO</div>
          <h3 className="modal-title">Pengajuan Kuotasi Pembelian</h3>
          <p className="modal-subtitle">AI Agent akan menganalisis Incoterms dan mengkalkulasi estimasi freight secara otomatis.</p>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Produk Terpilih</label>
            <input type="text" value={productName || ''} readOnly className="input-readonly" />
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Jumlah Pesanan (Kg/Unit)</label>
              <input
                type="number"
                placeholder="contoh: 2000"
                min={10}
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Pilihan Incoterms</label>
              <select className="custom-select" value={terms} onChange={(e) => setTerms(e.target.value)}>
                <option value="FOB">FOB (Free On Board)</option>
                <option value="CIF">CIF (Cost, Insurance &amp; Freight)</option>
                <option value="CNF">C&amp;F (Cost and Freight)</option>
                <option value="EXW">EXW (Ex Works)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Pelabuhan Tujuan (Port of Discharge)</label>
            <input
              type="text"
              placeholder="contoh: Port of Rotterdam, Hamburg, Los Angeles, Tokyo"
              required
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email Perusahaan / Kontak Buyer</label>
            <input
              type="email"
              placeholder="buyer@company.com / +62..."
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Kirim RFQ ke AI Agent</button>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { openAuth } = useApp();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('featured');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [specProd, setSpecProd] = useState(null);
  const [rfqProd, setRfqProd] = useState(null);

  // Scroll ke atas saat pindah halaman
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = PRODUCTS_DATA.filter((p) => {
      const matchCat = category === 'all' || p.category === category;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.desc || '').toLowerCase().includes(q) ||
        (p.origin || '').toLowerCase().includes(q) ||
        (p.hsCode || '').toLowerCase().includes(q);
      return matchCat && matchQuery;
    });

    if (sortBy === 'price-low') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'moq-low') list = [...list].sort((a, b) => a.moq - b.moq);
    return list;
  }, [query, sortBy, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function applyFilter(kind, value) {
    setPage(1);
    if (kind === 'query') setQuery(value);
    else if (kind === 'sort') setSortBy(value);
    else setCategory(value);
  }

  function gotoPage(p) {
    setPage(p);
    document.querySelector('.section-product-controls')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetSearch() {
    applyFilter('query', '');
    setCategory('all');
  }

  // Nomor halaman compact: 1 ... currentPage±2 ... totalPages
  const pageNums = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= safePage - 2 && i <= safePage + 2)) {
      pageNums.push(i);
    } else if (i === safePage - 3 || i === safePage + 3) {
      pageNums.push('...');
    }
  }

  const pageBtnStyles = 'page-btn';

  return (
    <>
      {/* ==================== BANNER HALAMAN PRODUK ==================== */}
      <section className="page-hero-banner">
        <div className="site-container">
          <div className="pill-badge pill-blue"><T k="produk_hero_pill" /></div>
          <h1 className="page-hero-title"><T k="produk_hero_title" tag="span" /></h1>
          <p className="page-hero-subtitle"><T k="produk_hero_sub" /></p>

          <div className="product-banner-stats">
            <div className="pb-stat"><T k="produk_stat_1" /></div>
            <div className="pb-divider" />
            <div className="pb-stat"><T k="produk_stat_2" /></div>
            <div className="pb-divider" />
            <div className="pb-stat"><T k="produk_stat_3" /></div>
            <div className="pb-divider" />
            <div className="pb-stat"><T k="produk_stat_4" /></div>
          </div>
        </div>
      </section>

      {/* ==================== SEARCH & FILTER CONTROLS ==================== */}
      <section className="section-product-controls">
        <div className="site-container">
          <div className="controls-wrapper-card">
            <div className="search-bar-row">
              <div className="search-input-field">
                <svg className="search-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={query}
                  data-i18n-placeholder="produk_search_ph"
                  placeholder="Cari nama produk, daerah asal, atau HS Code (cth: Kopi Gayo, Cengkeh, Rotan)..."
                  onChange={(e) => applyFilter('query', e.target.value)}
                />
              </div>
              <div className="sort-select-field">
                <label htmlFor="sortSelect"><T k="sort_label" /></label>
                <select
                  id="sortSelect"
                  className="custom-select"
                  value={sortBy}
                  onChange={(e) => applyFilter('sort', e.target.value)}
                >
                  <option value="featured"><T k="sort_featured" /></option>
                  <option value="price-low"><T k="sort_price_low" /></option>
                  <option value="price-high"><T k="sort_price_high" /></option>
                  <option value="moq-low"><T k="sort_moq_low" /></option>
                </select>
              </div>
            </div>

            <div className="category-filter-chips" id="productCategoryFilters">
              {CAT_CHIPS.map((c) => {
                const count = c.key === 'all'
                  ? PRODUCTS_DATA.length
                  : PRODUCTS_DATA.filter((p) => p.category === c.key).length;
                return (
                  <button
                    key={c.key}
                    type="button"
                    className={`filter-chip${category === c.key ? ' active' : ''}`}
                    onClick={() => applyFilter('cat', c.key)}
                  >
                    {c.label} ({c.key === 'all' ? PRODUCTS_DATA.length : count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PRODUCT GRID ==================== */}
      <section className="section-product-list">
        <div className="site-container">
          <div className="catalog-result-header">
            <p className="result-count-text">
              Menampilkan <strong>{filtered.length}</strong> produk siap ekspor
            </p>
            <span className="escrow-safe-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Dilindungi Sistem NusaBridge Escrow Vault
            </span>
          </div>

          <div className="products-grid-catalog" id="productsCatalogGrid">
            {filtered.length === 0 ? (
              <div className="empty-catalog-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                <h4 style={{ fontSize: '1.3rem', color: 'var(--navy-title)', marginBottom: '8px' }}>Komoditas Tidak Ditemukan</h4>
                <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 16px' }}>
                  Coba gunakan kata kunci lain (seperti "Kopi", "Pala", "Rotan", "Sutra", "Briket") atau pilih kategori "Semua Komoditas".
                </p>
                <button className="btn btn-outline btn-sm" type="button" onClick={resetSearch}>Reset Pencarian</button>
              </div>
            ) : (
              paginated.map((prod) => {
                const fallbackImg = `/assets/products/${prod.category}-1.webp`;
                return (
                  <div key={prod.id} className="catalog-card" data-category={prod.category} data-id={prod.id}>
                    <div className="catalog-card-image">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackImg;
                        }}
                      />
                      <span className="card-category-pill">{getCategoryLabel(prod.category)}</span>
                      <span className="card-verified-tag">✓ Verified OSS NIB</span>
                    </div>
                    <div className="catalog-card-content">
                      <div className="card-location">
                        <LocationIcon />
                        {prod.origin}
                      </div>
                      <h3 className="card-item-title">{prod.name}</h3>
                      <p className="card-item-desc">{prod.desc}</p>

                      <div className="card-meta-row">
                        <div className="card-price-box">
                          <span className="cp-label">Estimasi Harga (FOB/CIF):</span>
                          <div className="cp-val">USD {formatUSD(prod.price)} <span className="cp-unit">/ {prod.unit}</span></div>
                        </div>
                        <div className="card-moq-box">
                          <span className="cp-label">Min. Order (MOQ):</span>
                          <div className="cm-val">{prod.moq.toLocaleString('id-ID')} {prod.unit}</div>
                        </div>
                      </div>

                      <div className="card-badges-row">
                        {(prod.certs || []).slice(0, 2).map((c) => <span className="spec-tag" key={c}>{c}</span>)}
                        <span className="spec-tag">HS {(prod.hsCode || '').split(' ')[0]}</span>
                      </div>

                      <div className="card-actions-grid">
                        <button className="btn btn-outline btn-sm btn-open-spec" type="button" onClick={() => setSpecProd(prod)}>
                          Lihat Spesifikasi Lab
                        </button>
                        <button className="btn btn-primary btn-sm btn-rfq-prod" type="button" onClick={() => setRfqProd(prod.name)}>
                          Ajukan RFQ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filtered.length > 0 && totalPages > 1 && (
            <div className="pagination-container" id="catalogPagination">
              <button
                type="button"
                className={pageBtnStyles}
                disabled={safePage === 1}
                onClick={() => gotoPage(safePage - 1)}
              >
                &laquo; Prev
              </button>

              {pageNums.map((n, i) =>
                n === '...' ? (
                  <span className="page-info-text" key={`dots-${i}`}>...</span>
                ) : (
                  <button
                    type="button"
                    key={n}
                    className={`${pageBtnStyles}${n === safePage ? ' active' : ''}`}
                    onClick={() => gotoPage(n)}
                  >
                    {n}
                  </button>
                )
              )}

              <button
                type="button"
                className={pageBtnStyles}
                disabled={safePage === totalPages}
                onClick={() => gotoPage(safePage + 1)}
              >
                Next &raquo;
              </button>

              <span className="page-info-text">(Hal {safePage} dari {totalPages})</span>
            </div>
          )}
        </div>
      </section>

      {/* ==================== CALL TO ACTION UNTUK SELLER ==================== */}
      <section className="section-seller-cta">
        <div className="site-container">
          <div className="seller-cta-box">
            <div className="seller-cta-content">
              <div className="pill-badge pill-translucent-blue">UNTUK PELAKU USAHA UMKM</div>
              <h2 className="seller-cta-title">Punya Produk Berkualitas dan Siap Go Global?</h2>
              <p className="seller-cta-sub">
                Daftarkan produk Anda sekarang ke katalog NusaBridge. AI Agent kami akan membantu validasi legalitas, kalkulasi Incoterms, serta menghubungkan Anda dengan jaringan buyer terpercaya dari Eropa, Timur Tengah, dan Amerika.
              </p>
              <div className="seller-cta-buttons">
                <button className="btn btn-primary btn-lg" type="button" onClick={() => openAuth('register')}>
                  Daftarkan Produk Saya
                </button>
                <Link to="/solusi" className="btn btn-glass btn-lg">Pelajari Alur Ekspor AI</Link>
              </div>
            </div>
            <div className="seller-cta-visual">
              <div className="badge-card-floating">
                <span className="bcf-icon">🛡️</span>
                <div className="bcf-text">
                  <strong>100% Proteksi Transaksi</strong>
                  <small>Escrow Vault 4 Tahap Dana Aman</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <SpecModal
        prod={specProd}
        onClose={() => setSpecProd(null)}
        onLanjutRfq={() => {
          if (specProd) {
            setRfqProd(specProd.name);
            setSpecProd(null);
          }
        }}
      />
      {rfqProd && <RfqModal productName={rfqProd} onClose={() => setRfqProd(null)} />}
    </>
  );
}
