import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

/**
 * Modal demo interaktif — versi turunan dari index.html lama (ID & EN).
 */
export default function DemoModal() {
  const { modal, closeModal, lang } = useApp();
  const [direction, setDirection] = useState('export');
  if (modal?.type !== 'demo') return null;
  const isEn = lang === 'en';
  const isImport = direction === 'import';

  return (
    <div
      className="modal-overlay active show"
      id="demoModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal-card modal-large">
        <button className="modal-close-btn" onClick={closeModal}>&times;</button>
        <div className="modal-header">
          <div className="pill-badge pill-blue">LIVE DEMO</div>
          <h3 className="modal-title">{isEn ? 'NusaBridge AI Platform Simulation' : 'Simulasi Platform NusaBridge AI'}</h3>
          <p className="modal-subtitle">
            {isImport
              ? (isEn
                ? 'Explore an importer workflow: screen requirements, documents, and landed-cost inputs.'
                : 'Jelajahi alur importir: periksa persyaratan, dokumen, dan komponen biaya impor.')
              : (isEn
                ? 'Watch RFQ automation, Incoterms calculation, and Sales Contract generation happen in seconds.'
                : 'Tonton alur otomatisasi RFQ, kalkulasi Incoterms, dan pembuatan Sales Contract dalam hitungan detik.')}
          </p>
        </div>
        <div className="modal-tabs" role="group" aria-label={isEn ? 'Trade direction' : 'Arah perdagangan'}>
          <button className={`modal-tab ${!isImport ? 'active' : ''}`} type="button" aria-pressed={!isImport} onClick={() => setDirection('export')}>
            {isEn ? 'Export demo' : 'Demo ekspor'}
          </button>
          <button className={`modal-tab ${isImport ? 'active' : ''}`} type="button" aria-pressed={isImport} onClick={() => setDirection('import')}>
            {isEn ? 'Import demo' : 'Demo impor'}
          </button>
        </div>
        <div className="demo-preview-frame">
          <div className="demo-interactive-screen">
            <div className="demo-header-strip">
              <span className="demo-dot red" />
              <span className="demo-dot yellow" />
              <span className="demo-dot green" />
              <span className="demo-title-text">NusaBridge AI Engine — Live Processing</span>
            </div>
            <div className="demo-body-content">
              <div className="demo-step-badge">Status: AI Agent Aktif 🟢</div>
              <h4>{isImport
                ? (isEn ? 'Importer Requirement & Document Review' : 'Pemeriksaan Kebutuhan dan Dokumen Impor')
                : (isEn ? 'Auto Buyer Request Analysis' : 'Analisis Permintaan Buyer Otomatis')}</h4>
              <p>
                {isImport
                  ? (isEn
                    ? 'An Indonesian importer wants to source 500 kg of green coffee beans from Brazil, delivered to Tanjung Perak. The HS code, permits, and taxes still need official verification.'
                    : 'Importir Indonesia ingin mendatangkan 500 kg green coffee beans dari Brasil ke Tanjung Perak. HS code, perizinan, dan pajak tetap perlu diverifikasi resmi.')
                  : (isEn
                    ? 'A buyer from Hamburg, Germany asks for a 1,000 kg quote of Gayo Arabica coffee grade 1, CIF Hamburg.'
                    : 'Buyer dari Hamburg, Jerman meminta kuotasi 1.000 kg Biji Kopi Arabika Gayo grade 1 CIF Hamburg.')}
              </p>
              <div className="demo-terminal-box">
                {isImport ? <>
                  <code>&gt; Catat negara asal, pelabuhan tujuan, jumlah, dan Incoterm...</code><br />
                  <code>&gt; Siapkan checklist invoice, packing list, B/L atau AWB, dan PIB...</code><br />
                  <code>&gt; Tarif, larangan/pembatasan, dan izin: verifikasi melalui INSW/Bea Cukai.</code>
                </> : <>
                  <code>&gt; AI mengkalkulasi biaya FOB Belawan + Freight Sea Cargo...</code><br />
                  <code>&gt; Rekomendasi harga aman: USD 9.20 / Kg</code><br />
                  <code>&gt; Proforma Invoice #INV-2026-DE-049 berhasil di-generate secara otomatis!</code>
                </>}
              </div>
              <p className="chat-input-disclaimer">
                {isEn
                  ? 'Demo only. NusaBridge does not verify permits or calculate official import duties and taxes.'
                  : 'Simulasi edukasi. NusaBridge tidak memverifikasi izin atau menghitung bea dan pajak impor resmi.'}
              </p>
              <a
                href="/solusi"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                {isEn ? 'Try Sandbox Now' : 'Uji Coba Sandbox Sekarang'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
