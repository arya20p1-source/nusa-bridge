import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import T from '../components/T.jsx';
import TransportPanel from '../components/TransportPanel.jsx';
import { authFetch } from '../utils/api.js';
import { PRODUCTS_DATA } from '../data/products.js';
import {
  localizeProduct,
  localizeProductName,
  localizeProductDesc,
  localizeOrigin,
} from '../data/productTranslations.js';

/**
 * ==========================================================================
 * NUSABRIDGE - Halaman Katalog Produk Ekspor (port produk.html + produk.js)
 * Search, sort, filter kategori, paginasi 12/halaman, modal spesifikasi lab,
 * dan modal RFQ AI.
 * ==========================================================================
 */

const ITEMS_PER_PAGE = 12;

const CAT_CHIPS = [
  { key: 'all', label: 'Semua Komoditas', labelEn: 'All Commodities' },
  { key: 'kopi', label: '☕ Kopi Ekspor Unggulan', labelEn: '☕ Premium Export Coffee' },
  { key: 'rempah', label: '🌿 Rempah & Hasil Alam', labelEn: '🌿 Spices & Natural Products' },
  { key: 'kriya', label: '🪑 Kriya & Kerajinan', labelEn: '🪑 Crafts & Handicrafts' },
  { key: 'tekstil', label: '🧵 Tekstil & Wastra Nusantara', labelEn: '🧵 Textiles & Wastra' },
];

const CATEGORY_LABELS = {
  kopi: 'Kopi Ekspor Unggulan',
  rempah: 'Rempah & Hasil Alam',
  kriya: 'Kriya & Kerajinan',
  tekstil: 'Tekstil & Wastra Nusantara',
};

const CATEGORY_LABELS_EN = {
  kopi: 'Premium Export Coffee',
  rempah: 'Spices & Natural Products',
  kriya: 'Crafts & Handicrafts',
  tekstil: 'Textiles & Wastra',
};

function formatUSD(num) {
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function getCategoryLabel(cat, isEn = false) {
  const map = isEn ? CATEGORY_LABELS_EN : CATEGORY_LABELS;
  return map[cat] || (isEn ? 'Featured Commodity' : 'Komoditas Unggulan');
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `rfq-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
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
function SpecModal({ prod, onClose, onLanjutRfq, isEn = false }) {
  if (!prod) return null;
  const L = (id, en) => (isEn ? en : id);
  const view = localizeProduct(prod, isEn ? 'en' : 'id');
  return (
    <div
      className="modal-overlay show active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card modal-large">
        <button className="modal-close-btn" type="button" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <div className="pill-badge pill-blue">{L('SPESIFIKASI MUTU & EKSPOR', 'QUALITY & EXPORT SPECIFICATIONS')}</div>
          <h3 className="modal-title">{view.name}</h3>
          <p className="modal-subtitle">{L('Spesifikasi teknis, sertifikat uji lab, dan parameter ekspor internasional.', 'Technical specifications, lab test certificates, and international export parameters.')}</p>
        </div>
        <div className="modal-body-spec">
          <div className="spec-grid-layout">
            <div className="spec-col-left">
              <h4>{L('Parameter Laboratorium & Pengapalan', 'Laboratory & Shipping Parameters')}</h4>
              <table className="spec-table">
                <tbody>
                  <tr><th>{L('Asal Daerah / Kebun:', 'Origin / Estate:')}</th><td><strong>{view.origin}</strong></td></tr>
                  <tr><th>{L('Kode HS Resmi:', 'Official HS Code:')}</th><td><strong>{prod.hsCode}</strong></td></tr>
                  <tr><th>{L('Pelabuhan Muat:', 'Port of Loading:')}</th><td><strong>{view.shipping || L('Tanjung Priok / Tanjung Perak', 'Tanjung Priok / Tanjung Perak')}</strong></td></tr>
                  <tr><th>{L('Estimasi Harga:', 'Estimated Price:')}</th><td><strong>USD {formatUSD(prod.price)} / {prod.unit}</strong></td></tr>
                  <tr><th>{L('Minimal Order (MOQ):', 'Minimum Order (MOQ):')}</th><td><strong>{prod.moq.toLocaleString(isEn ? 'en-US' : 'id-ID')} {prod.unit}</strong></td></tr>
                  {view.specs && view.specs.length > 0 ? (
                    view.specs.map((s) => (
                      <tr key={s.k}><th>{s.k}</th><td><strong>{s.v}</strong></td></tr>
                    ))
                  ) : (
                    <tr><th>{L('Standar Mutu', 'Quality Standard')}</th><td><strong>{L('Standar SNI & Ekspor Internasional', 'SNI & International Export Standards')}</strong></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="spec-col-right">
              <h4>{L('Sertifikasi & Legalitas Ekspor', 'Certifications & Export Legality')}</h4>
              <div className="spec-cert-list">
                {prod.certs && prod.certs.length > 0 ? (
                  prod.certs.map((c) => (
                    <div className="spec-cert-item" key={c}><span className="sci-check">✓</span> {c}</div>
                  ))
                ) : (
                  <div className="spec-cert-item"><span className="sci-check">✓</span> {L('Legalitas NIB & NPWP OSS Terverifikasi', 'Verified NIB & NPWP OSS Legality')}</div>
                )}
              </div>
              <div className="spec-ai-note">
                <div className="san-icon">🤖</div>
                <div className="san-text">
                  <strong>{L('Rekomendasi NusaBridge AI Agent:', 'NusaBridge AI Agent Recommendation:')}</strong><br />
                  {L(
                    'Komoditas ini memiliki kelayakan ekspor tinggi. Draf dokumen Proforma Invoice, Certificate of Origin (COO), dan deklarasi Incoterms 2020 dapat di-generate otomatis oleh AI dalam hitungan detik.',
                    'This commodity has strong export eligibility. Draft Proforma Invoice, Certificate of Origin (COO), and Incoterms 2020 declarations can be generated automatically by AI in seconds.'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <TransportPanel product={view} />
        <div className="modal-footer-spec">
          <button className="btn btn-outline" type="button" onClick={onClose}>{L('Tutup', 'Close')}</button>
          <button className="btn btn-primary" type="button" onClick={onLanjutRfq}>{L('Ajukan Permintaan Harga (RFQ)', 'Submit a Request for Quotation (RFQ)')}</button>
        </div>
      </div>
    </div>
  );
}

// Modal RFQ AI
function RfqModal({ product, onClose, session, isEn = false }) {
  const L = (id, en) => (isEn ? en : id);
  const [qty, setQty] = useState('');
  const [terms, setTerms] = useState('FOB');
  const [port, setPort] = useState('');
  const [contact, setContact] = useState(session?.email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const idempotencyKeyRef = useRef(createIdempotencyKey());
  const productName = product?.name || (isEn ? 'Export Commodity' : 'Komoditas Ekspor');

  function resetIdempotencyKey() {
    idempotencyKeyRef.current = createIdempotencyKey();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = JSON.stringify({
      productId: product?.id,
      productName,
      quantity: Number(qty),
      unit: product?.unit || 'unit',
      targetPriceUSD: Number(product?.price),
      targetIncoterms: terms,
      buyerCountry: port.trim(),
      buyerEmail: contact.trim(),
    });

    try {
      let res;
      let data = {};

      // Satu kali retry bila request pertama masih diproses oleh server.
      // Idempotency-Key yang sama memastikan retry tidak membuat pesanan ganda.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        res = await authFetch('/api/rfq', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKeyRef.current },
          body,
        });
        data = await res.json().catch(() => ({}));

        if (res.status === 409 && data.code === 'REQUEST_IN_PROGRESS' && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        break;
      }

      if (!res.ok || !data.success || !data.rfq?.id) {
        if (data.code === 'IDEMPOTENCY_CONFLICT') {
          // Formulir berubah setelah percobaan sebelumnya: gunakan key baru
          // supaya percobaan berikutnya adalah operasi yang berbeda.
          resetIdempotencyKey();
        }
        throw new Error(data.message || (isEn ? 'Failed to save RFQ. Please try again.' : 'RFQ gagal disimpan. Coba lagi.'));
      }

      setAccessToken(data.accessToken || '');
      setReceipt(data.rfq);
    } catch (submitError) {
      setError(submitError.message || (isEn ? 'Unable to reach the server. RFQ was not recorded.' : 'Tidak dapat menghubungi server. RFQ belum tercatat.'));
    } finally {
      setSaving(false);
    }
  }

  async function refreshReceipt() {
    if (!receipt?.id) return;
    setError('');
    try {
      const headers = accessToken ? { 'X-RFQ-Access-Token': accessToken } : {};
      const res = await authFetch(`/api/rfq/${encodeURIComponent(receipt.id)}`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success || !data.rfq) {
        throw new Error(data.message || (isEn ? 'RFQ status could not be loaded.' : 'Status RFQ tidak dapat dimuat.'));
      }
      setReceipt(data.rfq);
    } catch (statusError) {
      setError(statusError.message || (isEn ? 'RFQ status could not be loaded.' : 'Status RFQ tidak dapat dimuat.'));
    }
  }

  return (
    <div
      className="modal-overlay show active"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="modal-card">
        <button className="modal-close-btn" type="button" onClick={onClose} disabled={saving}>&times;</button>
        {receipt ? (
          <>
            <div className="modal-header">
              <div className="pill-badge pill-blue">{L('BUKTI PENGAJUAN RFQ', 'RFQ SUBMISSION RECEIPT')}</div>
              <h3 className="modal-title">{L('Permintaan berhasil dicatat', 'Request successfully recorded')}</h3>
              <p className="modal-subtitle">{L('Ini bukti pengajuan permintaan penawaran, bukan bukti pembayaran.', 'This is a quotation request receipt, not proof of payment.')}</p>
            </div>
            <div className="rfq-receipt">
              <div className="rfq-receipt-number">
                <span>{L('Nomor RFQ', 'RFQ Number')}</span>
                <strong>{receipt.id}</strong>
              </div>
              <dl className="rfq-receipt-details">
                <div><dt>{L('Produk', 'Product')}</dt><dd>{receipt.productName}</dd></div>
                <div><dt>{L('Jumlah', 'Quantity')}</dt><dd>{Number(receipt.quantity).toLocaleString(isEn ? 'en-US' : 'id-ID')} {receipt.unit}</dd></div>
                <div><dt>Incoterms</dt><dd>{receipt.targetIncoterms}</dd></div>
                <div><dt>{L('Pelabuhan tujuan', 'Destination port')}</dt><dd>{receipt.buyerCountry}</dd></div>
                {Number.isFinite(Number(receipt.targetPriceUSD)) && (
                  <div><dt>{L('Harga acuan / unit', 'Reference price / unit')}</dt><dd>USD {Number(receipt.targetPriceUSD).toLocaleString('en-US')}</dd></div>
                )}
                {Number.isFinite(Number(receipt.totalValueUSD)) && (
                  <div><dt>{L('Estimasi nilai acuan', 'Estimated reference value')}</dt><dd>USD {Number(receipt.totalValueUSD).toLocaleString('en-US')}</dd></div>
                )}
                <div><dt>{L('Status', 'Status')}</dt><dd>{receipt.status === 'submitted' ? L('Diajukan — menunggu peninjauan', 'Submitted — awaiting review') : receipt.status}</dd></div>
              </dl>
              <ol className="rfq-process">
                {(receipt.process || []).map((step) => (
                  <li className={`rfq-process-step is-${step.status}`} key={step.key}>
                    <span className="rfq-process-dot">{step.status === 'done' ? '✓' : ''}</span>
                    <span>{step.label}</span>
                  </li>
                ))}
              </ol>
              <p className="rfq-process-note">
                {receipt.process?.length
                  ? L('Status berikutnya akan berubah setelah tim meninjau permintaan. Simpan nomor RFQ ini untuk pengecekan.', 'The next status will change after the team reviews your request. Keep this RFQ number for tracking.')
                  : L('Proses RFQ tersimpan. Perbarui status dengan tombol di bawah.', 'The RFQ process is saved. Refresh the status with the button below.')}
              </p>
            </div>
            {error && <p className="rfq-form-error" role="alert">{error}</p>}
            <div className="modal-footer-spec">
              <button className="btn btn-outline" type="button" onClick={refreshReceipt}>{L('Perbarui Status', 'Refresh Status')}</button>
              <button className="btn btn-primary" type="button" onClick={onClose}>{L('Selesai', 'Done')}</button>
            </div>
          </>
        ) : (
          <>
        <div className="modal-header">
          <div className="pill-badge pill-blue">AI RFQ STUDIO</div>
          <h3 className="modal-title">{L('Pengajuan Kuotasi Pembelian', 'Purchase Quotation Request')}</h3>
          <p className="modal-subtitle">{L('Kirim detail permintaan. Setelah tersimpan, Anda mendapat nomor RFQ dan status proses.', 'Send your request details. Once saved, you receive an RFQ number and process status.')}</p>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{L('Produk Terpilih', 'Selected Product')}</label>
            <input type="text" value={productName || ''} readOnly className="input-readonly" />
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>{L('Jumlah Pesanan (Kg/Unit)', 'Order Quantity (Kg/Unit)')}</label>
              <input
                type="number"
                placeholder={L('contoh: 2000', 'e.g. 2000')}
                min={1}
                step="any"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{L('Pilihan Incoterms', 'Incoterms Option')}</label>
              <select className="custom-select" value={terms} onChange={(e) => setTerms(e.target.value)}>
                <option value="FOB">FOB (Free On Board)</option>
                <option value="CIF">CIF (Cost, Insurance &amp; Freight)</option>
                <option value="CNF">C&amp;F (Cost and Freight)</option>
                <option value="EXW">EXW (Ex Works)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>{L('Pelabuhan Tujuan (Port of Discharge)', 'Destination Port (Port of Discharge)')}</label>
            <input
              type="text"
              placeholder={L('contoh: Port of Rotterdam, Hamburg, Los Angeles, Tokyo', 'e.g. Port of Rotterdam, Hamburg, Los Angeles, Tokyo')}
              required
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{L('Email Buyer / Kontak Pemohon', 'Buyer Email / Requester Contact')}</label>
            <input
              type="email"
              placeholder={L('nama@perusahaan.com', 'name@company.com')}
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          {error && <p className="rfq-form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? L('Menyimpan RFQ...', 'Saving RFQ...') : L('Kirim RFQ', 'Send RFQ')}
          </button>
        </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { openAuth, session, t, lang } = useApp();
  const isEn = lang === 'en';
  const role = session?.role === 'buyer' || session?.role === 'importer'
    ? 'buyer'
    : session?.role === 'seller'
      ? 'seller'
      : 'guest';
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
        localizeProductName(p, 'en').toLowerCase().includes(q) ||
        (p.desc || '').toLowerCase().includes(q) ||
        localizeProductDesc(p, 'en').toLowerCase().includes(q) ||
        (p.origin || '').toLowerCase().includes(q) ||
        localizeOrigin(p.origin, 'en').toLowerCase().includes(q) ||
        (p.hsCode || '').toLowerCase().includes(q);
      return matchCat && matchQuery;
    });

    if (sortBy === 'price-low') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'moq-low') list = [...list].sort((a, b) => a.moq - b.moq);
    return list.map((p) => localizeProduct(p, lang));
  }, [query, sortBy, category, lang]);

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

      {/* ==================== ROLE-AWARE GUIDANCE ==================== */}
      <section className="product-role-banner">
        <div className="site-container">
          <div className={`product-role-card role-${role}`}>
            <div className="prc-copy">
              <span className="pill-badge pill-blue">
                {role === 'buyer'
                  ? t('produk_role_buyer_pill', isEn ? 'BUYER WORKSPACE' : 'RUANG IMPORTIR')
                  : role === 'seller'
                    ? t('produk_role_seller_pill', isEn ? 'SELLER WORKSPACE' : 'RUANG EKSPORTIR')
                    : t('produk_role_guest_pill', isEn ? 'CHOOSE YOUR ROLE' : 'PILIH PERAN ANDA')}
              </span>
              <h2 className="prc-title">
                {role === 'buyer'
                  ? t('produk_role_buyer_title', isEn ? 'You are browsing as a global importer' : 'Anda menjelajah sebagai importir global')
                  : role === 'seller'
                    ? t('produk_role_seller_title', isEn ? 'You are browsing as an Indonesian exporter' : 'Anda menjelajah sebagai eksportir Indonesia')
                    : t('produk_role_guest_title', isEn ? 'Start with the role that fits your business' : 'Mulai sesuai peran usaha Anda')}
              </h2>
              <p className="prc-desc">
                {role === 'buyer'
                  ? t(
                      'produk_role_buyer_desc',
                      isEn
                        ? 'Compare product specifications, then submit an RFQ. Your account email is pre-filled in the RFQ form so the request is easier to follow up.'
                        : 'Bandingkan spesifikasi produk, lalu ajukan RFQ. Email akun Anda sudah terisi otomatis di formulir RFQ agar permintaan mudah ditindaklanjuti.'
                    )
                  : role === 'seller'
                    ? t(
                        'produk_role_seller_desc',
                        isEn
                          ? 'Use the catalog to review sample products, reference prices, and specifications. RFQ, document drafts, KYC, and Escrow are available as simulations on the AI Solutions page.'
                          : 'Gunakan katalog untuk melihat contoh produk, harga acuan, dan spesifikasi. Alur RFQ, draf dokumen, KYC, dan Escrow tersedia sebagai simulasi di halaman Solusi AI.'
                      )
                    : t(
                        'produk_role_guest_desc',
                        isEn
                          ? 'Exporters can prepare a business profile and learn the RFQ flow. Global importers can compare specifications and submit an RFQ. The catalog is a showcase, not an automatic product-upload flow.'
                          : 'Eksportir dapat menyiapkan profil usaha dan mempelajari alur RFQ. Importir global dapat membandingkan spesifikasi dan mengajukan RFQ. Katalog ini adalah showcase, bukan alur unggah produk otomatis.'
                      )}
              </p>
            </div>

            <div className="prc-actions">
              {role === 'guest' ? (
                <>
                  <button className="btn btn-primary" type="button" onClick={() => openAuth('register', { role: 'seller' })}>
                    {t('produk_role_cta_seller', isEn ? 'Register as Exporter' : 'Daftar sebagai Eksportir')}
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => openAuth('register', { role: 'buyer' })}>
                    {t('produk_role_cta_buyer', isEn ? 'Register as Importer' : 'Daftar sebagai Importir')}
                  </button>
                </>
              ) : (
                <Link to="/solusi" className="btn btn-outline">
                  {role === 'buyer'
                    ? t('produk_role_cta_rfq', isEn ? 'Learn how RFQ works' : 'Pelajari alur RFQ')
                    : t('produk_role_cta_tools', isEn ? 'Open the AI Solutions page' : 'Buka halaman Solusi AI')}
                </Link>
              )}
            </div>
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
                  placeholder={isEn ? 'Search product name, origin, or HS Code (e.g. Gayo Coffee, Cloves, Rattan)...' : 'Cari nama produk, daerah asal, atau HS Code (cth: Kopi Gayo, Cengkeh, Rotan)...'}
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
                    {isEn ? c.labelEn : c.label} ({c.key === 'all' ? PRODUCTS_DATA.length : count})
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
              {isEn ? 'Showing' : 'Menampilkan'} <strong>{filtered.length}</strong> {isEn ? 'export-ready products' : 'produk siap ekspor'}
            </p>
            <span className="escrow-safe-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {isEn ? 'Protected by NusaBridge Escrow Vault' : 'Dilindungi Sistem NusaBridge Escrow Vault'}
            </span>
          </div>

          <div className="products-grid-catalog" id="productsCatalogGrid">
            {filtered.length === 0 ? (
              <div className="empty-catalog-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                <h4 style={{ fontSize: '1.3rem', color: 'var(--navy-title)', marginBottom: '8px' }}>{isEn ? 'No Commodity Found' : 'Komoditas Tidak Ditemukan'}</h4>
                <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 16px' }}>
                  {isEn
                    ? 'Try another keyword (such as "Coffee", "Nutmeg", "Rattan", "Silk", "Briquette") or select the "All Commodities" category.'
                    : 'Coba gunakan kata kunci lain (seperti "Kopi", "Pala", "Rotan", "Sutra", "Briket") atau pilih kategori "Semua Komoditas".'}
                </p>
                <button className="btn btn-outline btn-sm" type="button" onClick={resetSearch}>{isEn ? 'Reset Search' : 'Reset Pencarian'}</button>
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
                      <span className="card-category-pill">{getCategoryLabel(prod.category, isEn)}</span>
                      <span className="card-verified-tag">✓ {isEn ? 'Verified OSS NIB' : 'Terverifikasi OSS NIB'}</span>
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
                          <span className="cp-label">{isEn ? 'Estimated Price (FOB/CIF):' : 'Estimasi Harga (FOB/CIF):'}</span>
                          <div className="cp-val">USD {formatUSD(prod.price)} <span className="cp-unit">/ {prod.unit}</span></div>
                        </div>
                        <div className="card-moq-box">
                          <span className="cp-label">{isEn ? 'Min. Order (MOQ):' : 'Min. Order (MOQ):'}</span>
                          <div className="cm-val">{prod.moq.toLocaleString(isEn ? 'en-US' : 'id-ID')} {prod.unit}</div>
                        </div>
                      </div>

                      <div className="card-badges-row">
                        {(prod.certs || []).slice(0, 2).map((c) => <span className="spec-tag" key={c}>{c}</span>)}
                        <span className="spec-tag">HS {(prod.hsCode || '').split(' ')[0]}</span>
                      </div>

                      <div className="card-actions-grid">
                        <button className="btn btn-outline btn-sm btn-open-spec" type="button" onClick={() => setSpecProd(prod)}>
                          {isEn ? 'View Lab Specifications' : 'Lihat Spesifikasi Lab'}
                        </button>
                        <button className="btn btn-primary btn-sm btn-rfq-prod" type="button" onClick={() => setRfqProd(prod)}>
                          {isEn ? 'Submit RFQ' : 'Ajukan RFQ'}
                        </button>
                      </div>
                      <Link to={`/transportasi?product=${encodeURIComponent(prod.id)}`} className="card-shipping-link">
                        🚚 {isEn ? 'Check shipping options & estimates' : 'Cek opsi & estimasi pengiriman'} →
                      </Link>
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

              <span className="page-info-text">({isEn ? `Page ${safePage} of ${totalPages}` : `Hal ${safePage} dari ${totalPages}`})</span>
            </div>
          )}
        </div>
      </section>

      {/* ==================== CALL TO ACTION UNTUK SELLER ==================== */}
      <section className="section-seller-cta">
        <div className="site-container">
          <div className="seller-cta-box">
            <div className="seller-cta-content">
              <div className="pill-badge pill-translucent-blue">{isEn ? 'FOR SME BUSINESSES' : 'UNTUK PELAKU USAHA UMKM'}</div>
              <h2 className="seller-cta-title">{isEn ? 'Ready to Set Up Your Exporter Profile?' : 'Siap Menyiapkan Profil Eksportir Anda?'}</h2>
              <p className="seller-cta-sub">
                {isEn
                  ? 'Create an exporter account to learn the RFQ flow, prepare legality data, and try document drafts and the Escrow simulation. This catalog is a showcase; new products are added together with the NusaBridge team.'
                  : 'Buat akun eksportir untuk mempelajari alur RFQ, menyiapkan data legalitas, serta mencoba draf dokumen dan simulasi Escrow. Katalog ini adalah showcase; penambahan produk baru dilakukan bersama tim NusaBridge.'}
              </p>
              <div className="seller-cta-buttons">
                <button className="btn btn-primary btn-lg" type="button" onClick={() => openAuth('register', { role: 'seller' })}>
                  {isEn ? 'Register as Exporter' : 'Daftar sebagai Eksportir'}
                </button>
                <Link to="/solusi" className="btn btn-glass btn-lg">{isEn ? 'Learn the AI Export & Import Flow' : 'Pelajari Alur Ekspor & Impor AI'}</Link>
              </div>
            </div>
            <div className="seller-cta-visual">
              <div className="badge-card-floating">
                <span className="bcf-icon">🛡️</span>
                <div className="bcf-text">
                  <strong>{isEn ? '100% Transaction Protection' : '100% Proteksi Transaksi'}</strong>
                  <small>{isEn ? '4-Phase Escrow Vault, Funds Secured' : 'Escrow Vault 4 Tahap Dana Aman'}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <SpecModal
        prod={specProd}
        isEn={isEn}
        onClose={() => setSpecProd(null)}
        onLanjutRfq={() => {
          if (specProd) {
            setRfqProd(specProd);
            setSpecProd(null);
          }
        }}
      />
      {rfqProd && <RfqModal product={rfqProd} onClose={() => setRfqProd(null)} session={session} isEn={isEn} />}
    </>
  );
}
