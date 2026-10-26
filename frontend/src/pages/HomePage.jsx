import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import T from '../components/T.jsx';
import RadarWidget from '../components/RadarWidget.jsx';
import { downloadHtmlFile } from '../utils/downloadHtmlFile.js';
import { getInitials } from '../utils/logo.js';
import { PRODUCTS_DATA } from '../data/products.js';

/**
 * ==========================================================================
 * NUSABRIDGE HOMEPAGE (Beranda)
 * Ported index.html + app.js: hero, stats, solusi, produk carousel,
 * alur ekspor, dashboard mockup sandbox (docs, KYC, RFQ, dll),
 * mengapa nusabridge, dan CTA banner.
 * ==========================================================================
 */

// ------------------------------------------------------------------
// Kategori filter carousel produk beranda
// ------------------------------------------------------------------
const HOME_CATS = [
  { key: 'all', labelKey: 'cat_all' },
  { key: 'kopi', labelKey: 'cat_coffee' },
  { key: 'rempah', labelKey: 'cat_spices' },
  { key: 'kriya', labelKey: 'cat_craft' },
  { key: 'tekstil', labelKey: 'cat_textile' },
];

const HOME_PRODUCTS = ['kopi', 'rempah', 'kriya', 'tekstil']
  .map((category) => PRODUCTS_DATA.find((product) => product.category === category))
  .filter(Boolean)
  .map((product) => ({
    id: product.id,
    name: product.name,
    price: `USD ${Number(product.price).toFixed(2)} / ${product.unit}`,
    loc: product.origin,
    cat: product.category,
    img: product.image,
  }));

const WORKFLOW_STEPS = [
  { n: 1, icon: '/assets/icons/icon-5.webp', k: 'step_1' },
  { n: 2, icon: '/assets/icons/icon-2.webp', k: 'step_2' },
  { n: 3, icon: '/assets/icons/icon-7.webp', k: 'step_3' },
  { n: 4, icon: '/assets/icons/icon-8.webp', k: 'step_4' },
  { n: 5, icon: '/assets/icons/icon-9.webp', k: 'step_5' },
  { n: 6, icon: '/assets/icons/icon-4.webp', k: 'step_6' },
];

const SOLUTION_CARDS = [
  { pillar: 1, icon: '/assets/icons/icon-1.webp', tK: 'sol_1_title', dK: 'sol_1_desc' },
  { pillar: 2, icon: '/assets/icons/icon-6.webp', tK: 'sol_2_title', dK: 'sol_2_desc' },
  { pillar: 3, icon: '/assets/icons/icon-3.webp', tK: 'sol_3_title', dK: 'sol_3_desc' },
  { pillar: 4, icon: '/assets/icons/icon-4.webp', tK: 'sol_4_title', dK: 'sol_4_desc' },
];

const WHY_ITEMS = [
  { icon: '/assets/icons/icon-10.webp', tK: 'why_1_title', dK: 'why_1_desc' },
  { icon: '/assets/icons/icon-11.webp', tK: 'why_2_title', dK: 'why_2_desc' },
  { icon: '/assets/icons/icon-12.webp', tK: 'why_3_title', dK: 'why_3_desc' },
  { icon: '/assets/icons/icon-13.webp', tK: 'why_4_title', dK: 'why_4_desc' },
];

const MOCK_NAV = [
  { key: 'overview', k: 'mock_nav_home', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></> },
  { key: 'products', k: 'mock_nav_prod', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
  { key: 'rfq', k: 'mock_nav_rfq', icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /> },
  { key: 'docs', k: 'mock_nav_docs', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></> },
  { key: 'logistics', k: 'mock_nav_log', icon: <><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></> },
  { key: 'kyc', k: 'mock_nav_kyc', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
  { key: 'settings', k: 'mock_nav_settings', icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
];

const TX_ROWS = [
  { txKey: 'gayo', img: '/assets/tx-thumb-1.webp', name: 'Kopi Arabika Gayo', val: 'USD 12,000', badge: 'Negosiasi' },
  { txKey: 'rempah', img: '/assets/tx-thumb-2.webp', name: 'Rempah Nusantara', val: 'USD 8,700', badge: 'Proses Dokumen' },
  { txKey: 'tenun', img: '/assets/tx-thumb-3.webp', name: 'Tenun Ikat', val: 'USD 24,000', badge: 'Dalam Pengiriman' },
];

const DOC_COMMODITIES = [
  { v: 'Kopi Arabika Gayo Specialty Grade 1', l: 'Kopi Arabika Gayo Grade 1' },
  { v: 'Cengkeh Lal Maluku Super (Cloves)', l: 'Cengkeh Lal Maluku Super' },
  { v: 'Set Kursi & Meja Rotan Cirebon', l: 'Set Kursi Rotan Cirebon' },
  { v: 'Briket Arang Tempurung Kelapa', l: 'Briket Arang Kelapa Shisha' },
  { v: 'Vanilla Bean Planifolia Gourmet', l: 'Vanilla Planifolia Gourmet' },
];

const DOC_TERMS = [
  { v: 'CIF Hamburg, Germany', l: 'CIF Port of Hamburg, DE' },
  { v: 'FOB Pelabuhan Belawan, ID', l: 'FOB Pelabuhan Belawan, ID' },
  { v: 'CIF Port of Los Angeles, US', l: 'CIF Los Angeles Port, US' },
  { v: 'FOB Tanjung Priok Jakarta, ID', l: 'FOB Tanjung Priok, ID' },
];

const DOC_TITLES = {
  invoice: 'PROFORMA INVOICE',
  contract: 'INTERNATIONAL SALES CONTRACT',
  peb: 'PEMBERITAHUAN EKSPOR BARANG (PEB)',
  coo: 'CERTIFICATE OF ORIGIN (FORM A)',
};

// ---------------- Sub: Produk unggulan beranda ----------------
function ProductCardItem({ p, onClick }) {
  return (
    <div className="product-card" data-category={p.cat} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="product-thumb-wrap">
        <img src={p.img} alt={p.name} className="product-img" />
        <div className="product-category-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          </svg>
        </div>
      </div>
      <div className="product-body">
        <h4 className="product-name">{p.name}</h4>
        <p className="product-price">{p.price}</p>
        <p className="product-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {p.loc}
        </p>
        <div className="product-verified-badge">
          <span className="v-check">✓</span> Verified Seller
        </div>
      </div>
    </div>
  );
}

// ---------------- Sub: Dashboard mockup views ----------------
function OverviewView({ openTxModal }) {
  return (
    <div className="mockup-sandbox-view">
      <div className="mockup-welcome">
        <h3 className="welcome-heading"><T k="mock_welcome_title" /></h3>
        <p className="welcome-sub"><T k="mock_welcome_sub" /></p>
      </div>

      <div className="mockup-stats-row">
        <div className="mstat-card">
          <div className="mstat-icon blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="mstat-texts">
            <span className="mstat-val">12</span>
            <span className="mstat-lbl"><T k="mstat_rfq" /></span>
          </div>
        </div>
        <div className="mstat-card">
          <div className="mstat-icon blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            </svg>
          </div>
          <div className="mstat-texts">
            <span className="mstat-val">7</span>
            <span className="mstat-lbl"><T k="mstat_docs" /></span>
          </div>
        </div>
        <div className="mstat-card">
          <div className="mstat-icon blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="mstat-texts">
            <span className="mstat-val">3</span>
            <span className="mstat-lbl"><T k="mstat_tx" /></span>
          </div>
        </div>
        <div className="mstat-card">
          <div className="mstat-icon blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="mstat-texts">
            <span className="mstat-val">98%</span>
            <span className="mstat-lbl"><T k="mstat_eff" /></span>
          </div>
        </div>
      </div>

      <div className="mockup-widgets-row">
        {/* Peta rute logistik global */}
        <RadarWidget />

        {/* Transaksi terbaru */}
        <div className="mwidget-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 className="widget-title" style={{ marginBottom: 0 }}><T k="mwidget_tx" /></h4>
            <small
              style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => openTxModal('gayo')}
            >
              Lihat Detail →
            </small>
          </div>
          <div className="tx-list">
            {TX_ROWS.map((r) => (
              <div
                key={r.txKey}
                className="tx-row interactive-tx"
                style={{ cursor: 'pointer' }}
                title="Klik untuk lihat detail transaksi"
                onClick={() => openTxModal(r.txKey)}
              >
                <img src={r.img} alt={r.name} className="tx-thumb" />
                <div className="tx-details">
                  <span className="tx-name">{r.name}</span>
                  <span className="tx-val">{r.val}</span>
                </div>
                <span className="tx-badge badge-blue">{r.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocsView({ showToast }) {
  const [docType, setDocType] = useState('invoice');
  const [comm, setComm] = useState('Kopi Arabika Gayo Specialty Grade 1');
  const [terms, setTerms] = useState('CIF Hamburg, Germany');
  const [docNo, setDocNo] = useState('No: NB-INV-2026-X-049 • Tanggal: 19 Oktober 2026');

  function updatePreview(type, c, t) {
    setDocNo(
      `No: NB-${type.toUpperCase()}-2026-X-${Math.floor(100 + Math.random() * 900)} • Tanggal: 19 Oktober 2026`
    );
    void c; void t;
  }

  function handlePrint() {
    const titleText = DOC_TITLES[docType] || 'PROFORMA INVOICE';
    const body = `
      <div class="header">
        <div>
          <div class="title">${titleText}</div>
          <div style="font-size:12px; color:#64748b; margin-top:4px;">${docNo}</div>
        </div>
        <div class="seal">✓ ICC INCOTERMS 2020 STANDARD</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; font-size:12px; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">
        <div>
          <strong style="color:#0f172a; text-transform:uppercase;">Eksportir Terdaftar (Seller):</strong>
          <p style="margin:4px 0 0; color:#334155;">
            <strong>CV Kopi Nusantara Bersama</strong><br>
            NIB: 1294801928415 &bull; NPWP: 01.234.567.8-012.000<br>
            Status: Verified Global Exporter Shield
          </p>
        </div>
        <div>
          <strong style="color:#0f172a; text-transform:uppercase;">Penerima / Buyer:</strong>
          <p style="margin:4px 0 0; color:#334155;">
            <strong>Nordic Coffee Importers GmbH</strong><br>
            Am Sandtorkai 48, Hamburg, Germany<br>
            Delivery Terms: <strong>${terms}</strong>
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Deskripsi Komoditas</th>
            <th>Kuantitas</th>
            <th>Ketentuan Pengiriman</th>
            <th>Total Nilai Ekspor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${comm}</strong><br><small style="color:#64748b;">Standar Mutu Ekspor, Bebas Hama, Uji Laboratorium Terlampir</small></td>
            <td>1 Kontainer (FCL 20ft)</td>
            <td><strong>${terms}</strong></td>
            <td><strong style="color:#059669;">USD $85,400.00</strong></td>
          </tr>
        </tbody>
      </table>

      <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:10px 14px; border-radius:6px; font-size:11.5px; color:#065f46; margin-top:14px;">
        <strong>Jaminan Transaksi Escrow Vault:</strong> 100% dana telah terkunci di rekening Escrow multi-valas. Pelepasan dana otomatis dalam 4 tahap: 30% Uang Muka, 30% Terbit PEB Bea Cukai, 20% Bill of Lading terbit, 20% Tiba di Pelabuhan Tujuan.
      </div>

      <div class="footer">
        <div>
          <span>Diterbitkan secara digital oleh platform NusaBridge AI</span><br>
          <span>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</span>
        </div>
        <div style="text-align:right;">
          <span>Standar International Chamber of Commerce (ICC)</span><br>
          <strong>NusaBridge Trade Facilitation</strong>
        </div>
      </div>
    `;
    downloadHtmlFile(
      `Dokumen-Ekspor-${docType.toUpperCase()}-${comm.replace(/[^a-zA-Z0-9]/g, '-')}.html`,
      `${titleText} - ${comm}`,
      body
    );
    showToast('📄 Dokumen ekspor resmi berhasil diunduh ke perangkat Anda!');
    setTimeout(() => window.print(), 500);
  }

  return (
    <div className="mockup-sandbox-view">
      <div className="sandbox-header">
        <div className="sandbox-title-wrap">
          <h4 className="sandbox-title">AI Trade Document Generator</h4>
          <span className="sandbox-badge">ICC Incoterms 2020 Standard</span>
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={handlePrint}>
          <span>🖨️ Cetak / Unduh Dokumen (PDF)</span>
        </button>
      </div>

      <div className="doc-sandbox-controls">
        <div className="doc-ctrl-item">
          <label>Jenis Dokumen:</label>
          <select
            value={docType}
            onChange={(e) => { setDocType(e.target.value); updatePreview(e.target.value, comm, terms); }}
          >
            <option value="invoice">Proforma Invoice (PI)</option>
            <option value="contract">Sales Contract (SC)</option>
            <option value="peb">Pemberitahuan Ekspor Barang (PEB)</option>
            <option value="coo">Certificate of Origin (COO Form A)</option>
          </select>
        </div>
        <div className="doc-ctrl-item">
          <label>Komoditas Ekspor:</label>
          <select
            value={comm}
            onChange={(e) => { setComm(e.target.value); updatePreview(docType, e.target.value, terms); }}
          >
            {DOC_COMMODITIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
        </div>
        <div className="doc-ctrl-item">
          <label>Incoterms 2020:</label>
          <select
            value={terms}
            onChange={(e) => { setTerms(e.target.value); updatePreview(docType, comm, e.target.value); }}
          >
            {DOC_TERMS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
      </div>

      {/* Live Rendered Document Paper */}
      <div className="doc-paper-preview">
        <div className="dpp-header">
          <div>
            <div className="dpp-title">{DOC_TITLES[docType]}</div>
            <div className="dpp-docno">{docNo}</div>
          </div>
          <div className="digital-seal-box">
            <span>🛡️</span>
            <span>VERIFIED BY NUSABRIDGE AI</span>
          </div>
        </div>

        <div className="dpp-grid">
          <div className="dpp-box">
            <h6>Eksportir (Seller / Shipper):</h6>
            <p><strong>CV Kopi Nusantara Mandiri</strong><br />
              NIB: 1294801928415 • NPWP: 01.234.567.8-012.000<br />
              Medan / Takengon, Indonesia</p>
          </div>
          <div className="dpp-box">
            <h6>Pembeli (Consignee / Buyer):</h6>
            <p><strong>Nordic Coffee Importers GmbH ({terms})</strong><br />
              Grosse Elbstrasse 145, 22767 Hamburg, Germany<br />
              VAT ID: DE 294 810 293</p>
          </div>
        </div>

        <table className="dpp-table">
          <thead>
            <tr>
              <th>Deskripsi Komoditas &amp; Kode HS</th>
              <th>Kuantitas</th>
              <th>Harga Satuan</th>
              <th>Total Nilai (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{comm}</strong><br /><small style={{ color: '#64748b' }}>HS Code: 0901.11.10 • Double Picked Organic</small></td>
              <td>18.000 Kg (1 FCL)</td>
              <td>USD 9.20 / Kg</td>
              <td><strong>USD 165.600</strong></td>
            </tr>
          </tbody>
        </table>

        <div className="dpp-footer">
          <div>
            <small style={{ color: '#64748b' }}>Syarat Pembayaran &amp; Perlindungan:</small><br />
            <strong style={{ color: 'var(--primary)', fontSize: '11px' }}>
              100% Guaranteed Escrow Vault (30% DP / 30% BL / 20% Suez / 20% Final)
            </strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: '20px', color: '#1b68f8', fontWeight: 700 }}>NusaBridge AI Agent</span><br />
            <small style={{ fontSize: '10px', color: '#64748b' }}>Electronic Trade Verification Authority</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function KycView({ showToast }) {
  const [nib, setNib] = useState('1294801928415');
  const [npwp, setNpwp] = useState('01.234.567.8-012.000');
  const [company, setCompany] = useState('CV Kopi Nusantara Mandiri');
  const [res, setRes] = useState({ status: 'valid', title: 'VERIFIED GLOBAL EXPORTER (VGE-2026)', msg: 'Badan usaha telah terdaftar resmi pada Sistem OSS Berbasis Risiko. Memiliki izin sah untuk melakukan kegiatan kepabeanan ekspor-impor internasional.' });

  function verify(inputNib, inputCompany) {
    const rawNib = String(inputNib != null ? inputNib : nib).replace(/\D/g, '');
    const comp = inputCompany != null ? inputCompany : company;

    if (rawNib.length !== 13) {
      // eslint-disable-next-line no-alert
      window.alert('⚠️ Format NIB salah! NIB OSS Indonesia harus memiliki tepat 13 digit angka.');
      return;
    }

    setRes({ status: 'loading', title: 'Memverifikasi ke Server OSS Berbasis Risiko...', msg: 'Melakukan cross-check hak kepabeanan dan legalitas nomor induk berusaha.' });

    setTimeout(() => {
      const isValid = !rawNib.startsWith('999');
      if (isValid) {
        setRes({
          status: 'valid',
          title: '🛡️ VERIFIED GLOBAL EXPORTER (VGE-2026)',
          msg: `Badan usaha "${comp}" terdaftar resmi pada Sistem OSS Berbasis Risiko (NIB: ${rawNib}). Memiliki hak kepabeanan ekspor sah.`,
        });
        showToast('✓ NIB Terverifikasi 100%! Lencana eksportir resmi aktif.');
      } else {
        setRes({
          status: 'invalid',
          title: '✕ NIB TIDAK DITEMUKAN DI OSS',
          msg: `Nomor Induk Berusaha ${rawNib} tidak ditemukan pada basis data OSS RBA. Harap lengkapi registrasi di oss.go.id.`,
        });
        showToast('⚠️ NIB tidak terdaftar pada sandbox OSS.');
      }
    }, 450);
  }

  return (
    <div className="mockup-sandbox-view">
      <div className="sandbox-header">
        <div className="sandbox-title-wrap">
          <h4 className="sandbox-title">AI KYC &amp; Legality Verification Hub</h4>
          <span className="sandbox-badge green">OSS RBA Sandbox Active</span>
        </div>
      </div>

      <div className="kyc-sandbox-card">
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
          Validasi format Nomor Induk Berusaha (NIB 13 Digit) dan NPWP pelaku usaha untuk menerbitkan lencana <strong>Verified Global Exporter Shield</strong> agar diakui oleh buyer luar negeri.
        </p>

        <div className="kyc-sample-btns">
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Pilih Contoh Uji Coba:</span>
          <button className="btn-sample-nib" type="button"
            onClick={() => { setNib('1294801928415'); setCompany('CV Kopi Nusantara Mandiri'); verify('1294801928415', 'CV Kopi Nusantara Mandiri'); }}>
            ✓ NIB Terdaftar (1294801928415 - CV Kopi Nusantara)
          </button>
          <button className="btn-sample-nib" type="button"
            onClick={() => { setNib('9999000011112'); setCompany('Usaha Tanpa NIB Terdaftar'); verify('9999000011112', 'Usaha Tanpa NIB Terdaftar'); }}>
            ✕ NIB Tidak Valid (9999000011112)
          </button>
        </div>

        <div className="kyc-form-row">
          <div className="kyc-input-item">
            <label>Nomor Induk Berusaha (NIB 13 Digit):</label>
            <input type="text" value={nib} maxLength={13} placeholder="13 digit angka OSS"
              onChange={(e) => setNib(e.target.value)} />
          </div>
          <div className="kyc-input-item">
            <label>NPWP Perusahaan / Koperasi:</label>
            <input type="text" value={npwp} placeholder="15/16 digit NPWP"
              onChange={(e) => setNpwp(e.target.value)} />
          </div>
        </div>

        <div className="kyc-input-item">
          <label>Nama Badan Usaha / UMKM:</label>
          <input type="text" value={company} placeholder="Nama usaha"
            onChange={(e) => setCompany(e.target.value)} />
        </div>

        <div>
          <button className="btn btn-primary btn-block" type="button" onClick={() => verify()}>
            <span>🛡️ Verifikasi Legalitas Usaha Sekarang</span>
          </button>
        </div>

        <div
          className="kyc-result-box"
          style={
            res.status === 'valid'
              ? { background: '#f0fdf4', borderColor: '#86efac' }
              : res.status === 'invalid'
                ? { background: '#fef2f2', borderColor: '#fca5a5' }
                : undefined
          }
        >
          <div className="krb-icon">🛡️</div>
          <div className="krb-content" style={{ flex: 1 }}>
            <h5 style={res.status === 'invalid' ? { color: '#991b1b' } : undefined}>{res.title}</h5>
            <p>{res.msg}</p>
            {res.status === 'valid' ? (
              <div className="krb-details" style={{ display: 'grid' }}>
                <div><strong>Status OSS:</strong> <span style={{ color: '#059669' }}>AKTIF &amp; VALID</span></div>
                <div><strong>NIB:</strong> {nib}</div>
                <div><strong>Klasifikasi:</strong> KBLI 46311 (Kopi &amp; Rempah)</div>
                <div><strong>Hak Akses:</strong> Angka Pengenal Ekspor (API)</div>
              </div>
            ) : (
              <div className="krb-details" style={{ display: 'none' }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RfqView({ showToast, goDocs }) {
  function handleNego() {
    const counterPrice = window.prompt('Masukkan harga penawaran tandingan (Counter Offer USD / Kg):', '9.45');
    if (counterPrice) {
      showToast(`🤝 Mengirim tawaran balik (Counter Offer) USD ${counterPrice}/Kg ke buyer Hamburg via AI Agent...`);
    }
  }
  function handleAccept() {
    showToast('✓ Penawaran buyer disetujui! Mengarahkan ke pembuatan dokumen ekspor...');
    goDocs();
  }
  return (
    <div className="mockup-sandbox-view">
      <div className="sandbox-header">
        <div className="sandbox-title-wrap">
          <h4 className="sandbox-title">AI RFQ Negotiation Studio</h4>
          <span className="sandbox-badge">Live Buyer Inquiry</span>
        </div>
        <Link to="/solusi" className="btn btn-primary btn-sm">Buka Studio Lengkap &rarr;</Link>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1b68f8', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>INCOMING BUYER INQUIRY #RFQ-2026-DE-049</span>
            <h5 style={{ fontSize: '14px', margin: '4px 0', color: 'var(--navy-title)' }}>Nordic Coffee Importers GmbH (Hamburg, Germany)</h5>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Permintaan: <strong>18.000 Kg (1 FCL) Kopi Arabika Gayo</strong> • Target: <strong>CIF Hamburg</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Target Harga Buyer:</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>USD 9.20 / Kg</div>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #e2e8f0' }}>
          <div><strong>Rekomendasi NusaBridge AI:</strong> Harga penawaran buyer USD 9.20 sangat layak dieksekusi!</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '4px' }}>
            <div><span>Biaya HPP Lokal:</span> <strong>USD 5.80 / Kg</strong></div>
            <div><span>Freight Belawan-Hamburg:</span> <strong>USD 0.85 / Kg</strong></div>
            <div><span>Fee Escrow NusaBridge (1.2%):</span> <strong>USD 0.11 / Kg</strong></div>
            <div><span>Net Profit UMKM:</span> <strong style={{ color: '#059669' }}>USD 2.44 / Kg (26.5%)</strong></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" type="button" onClick={handleNego}>Tawar Harga (Counter Offer)</button>
          <button className="btn btn-primary btn-sm" type="button" onClick={handleAccept}>✓ Setujui &amp; Terbitkan Proforma Invoice</button>
        </div>
      </div>
    </div>
  );
}

const SANDBOX_PRODUCTS = [
  { emoji: '☕', name: 'Kopi Robusta Lampung Super Grade', cat: 'Kopi', price: '$4.50 / Kg', moq: '5.000 Kg', legal: '✓ Karantina Bebas Hama', quick: 'Kopi Robusta Lampung' },
  { emoji: '☕', name: 'Kopi Arabika Gayo Specialty Grade 1', cat: 'Kopi', price: '$9.20 / Kg', moq: '3.000 Kg', legal: '✓ EUDR Compliance', quick: 'Kopi Arabika Gayo' },
  { emoji: '🌿', name: 'Cengkeh Lalpari Maluku Ekspor', cat: 'Rempah', price: '$12.50 / Kg', moq: '2.000 Kg', legal: '✓ FDA Registered', quick: 'Cengkeh Lalpari' },
  { emoji: '🪑', name: 'Kursi Anyaman Rotan Alami Cirebon', cat: 'Kriya', price: '$78.00 / Pcs', moq: '200 Pcs', legal: '✓ V-Legal & ISPM 15', quick: 'Kursi Rotan' },
  { emoji: '🎨', name: 'Kain Batik Tulis Sutra Solo', cat: 'Tekstil', price: '$45.00 / Pcs', moq: '100 Pcs', legal: '✓ COO Form A Ready', quick: 'Batik Tulis' },
];

function ProductsView({ goRfq, showToast }) {
  return (
    <div className="mockup-sandbox-view">
      <div className="sandbox-header">
        <div className="sandbox-title-wrap">
          <h4 className="sandbox-title">Katalog &amp; Manajemen Komoditas Ekspor</h4>
          <span className="sandbox-badge">50+ Komoditas UMKM Siap Ekspor</span>
        </div>
        <Link to="/produk" className="btn btn-primary btn-sm">Lihat Semua 120 Produk &rarr;</Link>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Daftar Produk Aktif Pelaku Usaha (Verified Seller):</span>
          <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>● Siap Terbitkan RFQ</span>
        </div>

        <div className="mockup-products-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 6px' }}>Komoditas</th>
                <th style={{ padding: '8px 6px' }}>Kategori</th>
                <th style={{ padding: '8px 6px' }}>Harga Acuan</th>
                <th style={{ padding: '8px 6px' }}>MOQ</th>
                <th style={{ padding: '8px 6px' }}>Status Legalitas</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--navy-title)' }}>
              {SANDBOX_PRODUCTS.map((p) => (
                <tr key={p.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 6px', fontWeight: 700 }}>{p.emoji} {p.name}</td>
                  <td style={{ padding: '10px 6px' }}>
                    <span className="badge-blue" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>{p.cat}</span>
                  </td>
                  <td style={{ padding: '10px 6px', fontWeight: 700 }}>{p.price}</td>
                  <td style={{ padding: '10px 6px' }}>{p.moq}</td>
                  <td style={{ padding: '10px 6px' }}><span style={{ color: '#059669', fontWeight: 700 }}>{p.legal}</span></td>
                  <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      type="button"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => { goRfq(p.quick, showToast); }}
                    >
                      Kalkulasi RFQ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const LOGISTICS_SHIPS = [
  {
    name: '🚢 KM Baruna Nusantara', badge: '🟢 On Schedule', badgeStyle: { background: '#ecfdf5', color: '#059669' },
    detail: <>Rute: <strong>Tanjung Priok (ID) ➔ Hamburg (DE)</strong><br />Muatan: 20 MT Kopi Robusta Lampung (1x20ft FCL)<br />Koordinat: 04°12'N 100°45'E (Selat Malaka)<br />Kecepatan: <strong>19.4 knots</strong> • ETA: <strong>4 Hari Lagi</strong></>,
    pct: 68, color: '#10b981', border: '1.5px solid #10b981',
  },
  {
    name: '🚢 MV Samudera Raya', badge: '🔵 Rute Pasifik', badgeStyle: { background: '#eff6ff', color: '#1b68f8' },
    detail: <>Rute: <strong>Tanjung Perak (ID) ➔ Los Angeles (US)</strong><br />Muatan: 5 MT Cengkeh Lalpari Maluku (200 Karung)<br />Koordinat: 14°22'N 142°10'E (Samudra Pasifik Barat)<br />Kecepatan: <strong>21.2 knots</strong> • ETA: <strong>9 Hari Lagi</strong></>,
    pct: 42, color: '#3b82f6', border: '1px solid var(--border-light)',
  },
  {
    name: '🚢 KM Celebes Express', badge: '🟡 Mendekati Tokyo', badgeStyle: { background: '#fef3c7', color: '#d97706' },
    detail: <>Rute: <strong>Belawan (ID) ➔ Port of Tokyo (JP)</strong><br />Muatan: 2.000 Pcs Kursi Rotan Cirebon (2x40ft HC)<br />Koordinat: 28°50'N 132°30'E (Laut Filipina Utara)<br />Kecepatan: <strong>17.8 knots</strong> • ETA: <strong>2 Hari Lagi</strong></>,
    pct: 84, color: '#f59e0b', border: '1px solid var(--border-light)',
  },
];

function LogisticsView({ showToast }) {
  const [loading, setLoading] = useState(false);
  function refresh() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('🟢 Telemetri AIS 3 Kapal Kargo Berhasil Diperbarui!');
    }, 700);
  }
  return (
    <div className="mockup-sandbox-view">
      <div className="sandbox-header">
        <div className="sandbox-title-wrap">
          <h4 className="sandbox-title">Pelacakan Logistik Maritim &amp; Kontainer Ekspor</h4>
          <span className="sandbox-badge" style={{ background: '#ecfdf5', color: '#059669' }}>3 Kapal Kargo Aktif Pelayaran</span>
        </div>
        <button className="btn btn-outline btn-sm" type="button" disabled={loading} onClick={refresh}>
          {loading ? 'Memperbarui AIS...' : '🔄 Refresh Telemetri AIS'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
        {LOGISTICS_SHIPS.map((s) => (
          <div key={s.name} style={{ background: '#ffffff', border: s.border, borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px', color: 'var(--navy-title)' }}>{s.name}</strong>
              <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', ...s.badgeStyle }}>{s.badge}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.detail}</div>
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                <span>Progres Pelayaran:</span>
                <strong>{s.pct}% Selesai</strong>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ showToast }) {
  const [companyName, setCompanyName] = useState('CV Kopi Nusantara Bersama');
  const [currency, setCurrency] = useState('USD');
  function save() {
    showToast(`✓ Pengaturan profil ${companyName || 'Perusahaan'} & rekening Escrow DHE berhasil disimpan!`);
  }
  const labelStyle = { fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' };
  const inputStyle = { width: '100%', padding: '8px 10px', fontSize: '12.5px', border: '1px solid var(--border-light)', borderRadius: '6px', fontWeight: 600, marginTop: '4px' };
  return (
    <div className="mockup-sandbox-view">
      <div className="sandbox-header">
        <div className="sandbox-title-wrap">
          <h4 className="sandbox-title"><T k="settings_title" /></h4>
          <span className="sandbox-badge">Multi-Currency Vault &bull; OSS Integrated</span>
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={save}><T k="settings_save" /></button>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Nama Badan Usaha / UMKM:</label>
            <input type="text" value={companyName} className="input-readonly" style={inputStyle} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Nomor Induk Berusaha (NIB 13 Digit):</label>
            <input type="text" value="1294801928415 (Verified OSS RBA)" readOnly className="input-readonly" style={{ ...inputStyle, background: '#f8fafc' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Rekening Penerima USD (Devisa Hasil Ekspor):</label>
            <input type="text" value="Bank Mandiri (DHE) - 137-00-1928410-1" className="input-readonly" style={inputStyle} readOnly />
          </div>
          <div>
            <label style={labelStyle}>SWIFT Code Bank Internasional:</label>
            <input type="text" value="BMRIIDJA (Bank Mandiri Head Office)" className="input-readonly" style={inputStyle} readOnly />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Mata Uang Pencairan Pokok:</label>
            <select value={currency} style={{ ...inputStyle, background: '#ffffff' }} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD (US Dollar - Rekening DHE)</option>
              <option value="IDR">IDR (Rupiah - Konversi Kurs Tengah BI Jisdor)</option>
              <option value="EUR">EUR (Euro - Pasar Uni Eropa)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notifikasi Telemetri Kapal &amp; Escrow:</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#334155' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><input type="checkbox" defaultChecked /> WhatsApp Hotline</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><input type="checkbox" defaultChecked /> Email Salinan PEB</label>
            </div>
          </div>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 700 }}>
            ✓ Status Escrow Vault: <strong>Terkoneksi &amp; Dilindungi ICC Smart Milestone Rules</strong>
          </div>
          <span style={{ fontSize: '11px', background: '#ffffff', color: '#059669', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>Verified Seller Shield Aktif</span>
        </div>
      </div>
    </div>
  );
}

// ---------------- Sub: Dashboard mockup (wrap semua sandbox views) ----------------
function DashboardShowcase() {
  const { showToast, openModal, lang, session } = useApp();
  const [activeView, setActiveView] = useState('overview');
  const location = useLocation();

  const viewLabels = {
    overview: lang === 'en' ? '🏠 Export Home Dashboard Active' : '🏠 Dashboard Beranda Ekspor Aktif',
    products: lang === 'en' ? '📦 Export Commodity Catalog Active' : '📦 Manajemen Katalog Produk Ekspor Aktif',
    rfq: lang === 'en' ? '⚡ AI RFQ Studio & Pricing Active' : '⚡ AI RFQ Studio & Negosiasi Harga Aktif',
    docs: lang === 'en' ? '📄 AI Trade Document Generator Active' : '📄 AI Export Document Generator Sandbox Aktif',
    logistics: lang === 'en' ? '🚢 AIS Maritime Radar Tracking Active' : '🚢 Pelacakan Radar Maritim & Logistik Aktif',
    kyc: lang === 'en' ? '🛡️ KYC Hub: OSS Verification Active' : '🛡️ KYC Hub: Validasi NIB & NPWP OSS Aktif',
    settings: lang === 'en' ? '⚙️ Profile & Escrow Account Settings' : '⚙️ Pengaturan Profil Usaha & Rekening Escrow',
  };

  const switchTo = useCallback((key) => {
    setActiveView(key || 'overview');
  }, []);

  // Global hash routing (dari menu/link yang membawa #kyc, #docs, #rfq, dll)
  useEffect(() => {
    const rawHash = (location.hash || '').replace('#', '').toLowerCase();
    if (!rawHash) return;

    if (rawHash === 'login' || rawHash === 'masuk') {
      openModal({ type: 'auth', mode: 'login' });
      return;
    }
    if (rawHash === 'daftar' || rawHash === 'register') {
      openModal({ type: 'auth', mode: 'register' });
      return;
    }

    const viewAliases = {
      kyc: 'kyc', 'kyc-hub': 'kyc', logistik: 'logistics', logistics: 'logistics',
      dokumen: 'docs', docs: 'docs', rfq: 'rfq', 'rfq-studio': 'rfq',
      produk: 'products', products: 'products', pengaturan: 'settings', settings: 'settings',
      beranda: 'overview', overview: 'overview',
    };

    const targetKey = viewAliases[rawHash];
    if (targetKey) {
      switchTo(targetKey);
      requestAnimationFrame(() => {
        const showcaseEl = document.querySelector('.section-dashboard-showcase');
        if (showcaseEl) showcaseEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.hash, openModal, switchTo]);

  const openTxModal = useCallback((txKey) => openModal({ type: 'tx', txKey }), [openModal]);
  const goRfq = useCallback((prodName, toastFn) => {
    switchTo('rfq');
    toastFn(`⚡ Memuat simulasi RFQ untuk: ${prodName}`);
  }, [switchTo]);
  const goDocs = useCallback(() => switchTo('docs'), [switchTo]);

  const userName = session?.name || 'UMKM Indonesia';
  const userCompany = session?.company || 'UMKM Mandiri';

  return (
    <section className="section-dashboard-showcase">
      <div className="site-container dashboard-showcase-container">
        <div className="dashboard-grid">

          {/* Left Panel: NusaBridge Dashboard App UI */}
          <div className="mockup-app-window">
            <aside className="mockup-sidebar">
              <div className="mockup-brand">
                <img src="/assets/logo-transparent.webp" alt="NusaBridge" className="mockup-logo-img" />
              </div>
              <nav className="mockup-nav">
                {MOCK_NAV.map((item) => (
                  <a
                    key={item.key}
                    href="#alur-ekspor"
                    onClick={(e) => { e.preventDefault(); switchTo(item.key); showToast(viewLabels[item.key] || 'Sandbox Aktif'); }}
                    className={`mockup-nav-item${activeView === item.key ? ' active' : ''}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
                    <span><T k={item.k} /></span>
                  </a>
                ))}
              </nav>
            </aside>

            {/* Main App Content */}
            <div className="mockup-content">
              <div className="mockup-topbar">
                <div className="mockup-search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input type="text" placeholder="Cari produk, buyer, atau dokumen..." readOnly />
                </div>

                <div className="mockup-user-bar">
                  <button
                    className="mockup-icon-btn"
                    type="button"
                    aria-label="Notifikasi"
                    onClick={() => showToast('🔔 2 Pesan Baru: Buyer Hamburg menyetujui RFQ; Kapal KM Baruna memasuki rute Selat Malaka.')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </button>
                  <div
                    className="mockup-user-profile"
                    onClick={() => showToast(`👤 Akun ${userCompany} • Status: Verified Seller (NIB: 1294801928415)`)}
                  >
                    {session?.logo ? (
                      <img src={session.logo} alt={`Logo ${userCompany}`} className="user-avatar-img" />
                    ) : (
                      <span className="user-avatar-img user-avatar-initials" aria-hidden="true">
                        {getInitials(userCompany)}
                      </span>
                    )}
                    <div className="user-meta">
                      <span className="user-name">{userName}</span>
                      <span className="user-role">{userCompany} <span className="arrow-sub">→</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {activeView === 'overview' && <OverviewView openTxModal={openTxModal} />}
              {activeView === 'products' && <ProductsView goRfq={goRfq} showToast={showToast} />}
              {activeView === 'rfq' && <RfqView showToast={showToast} goDocs={goDocs} />}
              {activeView === 'docs' && <DocsView showToast={showToast} />}
              {activeView === 'logistics' && <LogisticsView showToast={showToast} />}
              {activeView === 'kyc' && <KycView showToast={showToast} />}
              {activeView === 'settings' && <SettingsView showToast={showToast} />}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ---------------- Main Page ----------------
export default function HomePage() {
  const { openAuth, openModal, openInfo } = useApp();
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState('all');
  const carouselRef = useRef(null);

  function scrollCarousel(dir) {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 240, behavior: 'smooth' });
    }
  }

  function openProductFromCatalog(name) {
    navigate(`/produk?search=${encodeURIComponent(name)}`);
  }

  return (
    <>
      {/* ==================== HERO ==================== */}
      <section className="hero-section" id="hero">
        <div className="hero-bg-glow" />
        <div className="site-container hero-grid">
          <div className="hero-content">
            <div className="pill-badge pill-blue"><T k="hero_pill" /></div>

            <h1 className="hero-title"><T k="hero_title" tag="span" /></h1>

            <p className="hero-description"><T k="hero_desc" /></p>

            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" type="button" onClick={() => openAuth('register')}>
                <span><T k="hero_btn_export" /></span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button className="btn btn-secondary btn-lg" type="button" onClick={() => openModal({ type: 'demo' })}>
                <span className="play-icon-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </span>
                <span><T k="hero_btn_demo" /></span>
              </button>
            </div>

            <div className="hero-trust-list">
              {['trust_1', 'trust_2', 'trust_3'].map((k) => (
                <div className="trust-item" key={k}>
                  <span className="trust-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span><T k={k} /></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Hero Visual */}
        <div className="hero-visual-container">
          <div className="hero-image-wrapper">
            <img src="/assets/visual-1.webp" alt="Ekspor UMKM Indonesia dengan NusaBridge AI" className="hero-main-visual" />

            <div className="floating-verified-card">
              <div className="verified-card-header">
                <div className="verified-title-wrap">
                  <span className="verified-title">Verified Seller</span>
                </div>
                <div className="verified-shield-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <ul className="verified-checklist">
                {['verif_1', 'verif_2', 'verif_3'].map((k) => (
                  <li key={k}>
                    <span className="check-dot">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span><T k={k} /></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS METRICS STRIP ==================== */}
      <section className="stats-section">
        <div className="site-container">
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon-wrap">
                <svg className="stat-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b68f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className="stat-info">
                <h3 className="stat-number">500+</h3>
                <p className="stat-label"><T k="stat_1_label" /></p>
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-item">
              <div className="stat-icon-wrap">
                <svg className="stat-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b68f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="stat-info">
                <h3 className="stat-number">20+</h3>
                <p className="stat-label"><T k="stat_2_label" /></p>
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-item">
              <div className="stat-icon-wrap">
                <svg className="stat-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b68f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <div className="stat-info">
                <h3 className="stat-number">98%</h3>
                <p className="stat-label"><T k="stat_3_label" /></p>
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-item">
              <div className="stat-icon-wrap">
                <svg className="stat-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b68f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <div className="stat-info">
                <h3 className="stat-number">24/7</h3>
                <p className="stat-label"><T k="stat_4_label" /></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SOLUSI NUSABRIDGE ==================== */}
      <section className="section-solutions" id="solusi">
        <div className="site-container">
          <div className="section-header text-center">
            <div className="pill-badge pill-blue"><T k="solutions_pill" /></div>
            <h2 className="section-title"><T k="solutions_title" tag="span" /></h2>
            <p className="section-subtitle"><T k="solutions_sub" /></p>
          </div>

          <div className="solutions-grid">
            {SOLUTION_CARDS.map((c) => (
              <Link key={c.pillar} to={`/solusi#pilar-${c.pillar}`} className="solution-card">
                <div className="solution-icon-wrap">
                  <img src={c.icon} alt="" className="solution-icon-img" />
                </div>
                <h3 className="solution-card-title"><T k={c.tK} tag="span" /></h3>
                <p className="solution-card-desc"><T k={c.dK} /></p>
                <span className="solution-card-link">Pelajari Selengkapnya &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRODUK UNGGULAN ==================== */}
      <section className="section-products" id="produk">
        <div className="site-container">
          <div className="products-header">
            <div className="products-header-left">
              <div className="pill-badge pill-blue"><T k="products_pill" /></div>
              <h2 className="section-title"><T k="products_title" tag="span" /></h2>
            </div>
            <Link to="/produk" className="link-view-all">
              <span><T k="products_view_all" /></span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Category Filter Tabs */}
          <div className="category-tabs" id="categoryTabs">
            {HOME_CATS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`cat-pill${activeCat === c.key ? ' active' : ''}`}
                data-category={c.key}
                onClick={() => setActiveCat(c.key)}
              >
                <T k={c.labelKey} />
              </button>
            ))}
          </div>

          {/* Products Carousel */}
          <div className="products-slider-wrapper">
            <button className="slider-arrow slider-arrow-left" type="button" aria-label="Produk Sebelumnya" onClick={() => scrollCarousel(-1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="products-carousel" id="productsCarousel" ref={carouselRef}>
              {HOME_PRODUCTS.map((p) => (
                <div key={p.id} style={{ display: activeCat === 'all' || p.cat === activeCat ? 'flex' : 'none' }}>
                  <ProductCardItem p={p} onClick={() => openProductFromCatalog(p.name)} />
                </div>
              ))}
            </div>

            <button className="slider-arrow slider-arrow-right" type="button" aria-label="Produk Selanjutnya" onClick={() => scrollCarousel(1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ==================== ALUR EKSPOR ==================== */}
      <section className="section-workflow" id="alur-ekspor">
        <div className="workflow-wave-top">
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
            <path d="M0,0 L1440,0 L1440,24 C1360,34 1280,58 1160,60 C960,64 820,14 620,18 C380,22 220,64 0,44 Z" fill="#ffffff" />
          </svg>
        </div>

        <div className="workflow-backdrop">
          <img src="/assets/Global Shipping at Sunset.webp" alt="Global Shipping at Sunset" className="workflow-bg-img" />
        </div>

        <div className="site-container workflow-content">
          <div className="workflow-header">
            <div className="pill-badge pill-translucent"><T k="workflow_pill" /></div>
            <h2 className="workflow-title"><T k="workflow_title" /></h2>
            <p className="workflow-subtitle"><T k="workflow_sub" /></p>
          </div>

          <div className="workflow-steps-timeline">
            <div className="timeline-line" />
            {WORKFLOW_STEPS.map((s) => (
              <div className="workflow-step-item" key={s.n}>
                <div className="step-circle-wrap">
                  <div className="step-circle">
                    <img src={s.icon} alt="" className="step-icon" />
                  </div>
                  <span className="step-number-badge">{s.n}</span>
                </div>
                <p className="step-title"><T k={s.k} tag="span" /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DASHBOARD & AI AGENT SHOWCASE ==================== */}
      <DashboardShowcase />

      {/* ==================== MENGAPA NUSABRIDGE ==================== */}
      <section className="section-why-us" id="tentang">
        <div className="site-container">
          <div className="section-header text-center">
            <div className="pill-badge pill-blue"><T k="why_pill" /></div>
            <h2 className="section-title"><T k="why_title" /></h2>
          </div>

          <div className="why-us-strip">
            {WHY_ITEMS.map((w) => (
              <div className="why-item" key={w.tK}>
                <div className="why-icon-wrap">
                  <img src={w.icon} alt="" className="why-icon-img" />
                </div>
                <h3 className="why-item-title"><T k={w.tK} /></h3>
                <p className="why-item-desc"><T k={w.dK} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA BANNER ==================== */}
      <section className="section-cta-banner">
        <div className="cta-banner-wave">
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
            <path d="M0,0 L1440,0 L1440,24 C1360,34 1280,58 1160,60 C960,64 820,14 620,18 C380,22 220,64 0,44 Z" fill="#ffffff" />
          </svg>
        </div>

        <div className="cta-banner-bg">
          <img src="/assets/Global Shipping at Sunset.webp" alt="Global Shipping at Sunset" className="cta-bg-image" />
        </div>

        <div className="site-container cta-banner-container">
          <div className="cta-banner-inner">
            <div className="cta-text-col">
              <div className="pill-badge pill-translucent-blue"><T k="cta_pill" /></div>
              <h2 className="cta-heading"><T k="cta_heading" tag="span" /></h2>
              <p className="cta-subtext"><T k="cta_subtext" /></p>
              <div className="cta-btn-group">
                <button className="btn btn-primary btn-lg" type="button" onClick={() => openAuth('register')}>
                  <span><T k="cta_btn_register" /></span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <button
                  className="btn btn-glass btn-lg"
                  type="button"
                  onClick={() =>
                    openInfo(
                      'Hubungi Tim NusaBridge',
                      'Hubungi kami melalui:<br><strong>Email:</strong> support@nusabridge.id<br><strong>WhatsApp Hotline:</strong> <a href="https://wa.me/6285735800491" target="_blank" style="color:#1b68f8; font-weight:700;">+62 857-3580-0491</a><br><strong>Lokasi:</strong> SMK Antartika 1 Sidoarjo / Tim Arjika Labs'
                    )
                  }
                >
                  <T k="cta_btn_contact" />
                </button>
              </div>
            </div>

            <div className="cta-slogan-col">
              <div className="handwritten-slogan">
                <span><T k="cta_slogan_1" /></span><br />
                <span><T k="cta_slogan_2" /></span>
                <svg className="handwritten-arrow" width="70" height="40" viewBox="0 0 100 60" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <path d="M10,20 Q40,55 85,25" />
                  <polyline points="75,22 85,25 80,35" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
