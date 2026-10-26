import { useApp } from '../context/AppContext.jsx';
import downloadHtmlFile from '../utils/downloadHtmlFile.js';

export const TX_DATA = {
  gayo: {
    title: 'Kontrak Ekspor #TRX-2026-GY-01',
    product: 'Kopi Arabika Gayo Specialty Grade 1',
    buyer: 'Hanseatic Coffee Importers GmbH (Hamburg, Jerman 🇩🇪)',
    value: 'USD 12,000 (FOB Belawan Port)',
    volume: '1,400 Kg (GrainPro Hermetic Bags)',
    status: 'Tahap Negosiasi Sales Contract Akhir',
    step: 1,
    escrowPaid: 'USD 3,600 (30% DP siap ditransfer buyer ke Escrow Vault)',
    docs: ['Draft Sales Contract #SC-088', 'Proforma Invoice #INV-049', 'Sertifikat Uji Organik ICO'],
  },
  rempah: {
    title: 'Kontrak Ekspor #TRX-2026-RP-04',
    product: 'Cengkeh Lal Maluku Kering Pilihan (Cloves)',
    buyer: 'Spice Orient FZE (Dubai, Uni Emirat Arab 🇦🇪)',
    value: 'USD 8,750 (CIF Jebel Ali Port)',
    volume: '1,400 Kg (Double PP Bags)',
    status: 'Proses Dokumen Kepabeanan & PEB',
    step: 2,
    escrowPaid: 'USD 5,250 (Tahap 1 & 2 Tercairkan ke Rekening UMKM)',
    docs: ['Commercial Invoice Resmi', 'Packing List 56 Colly', 'Draft PEB Beacukai', 'Phytosanitary Cert'],
  },
  tenun: {
    title: 'Kontrak Ekspor #TRX-2026-TN-09',
    product: 'Kain Tenun Ikat Pewarna Alami Sumba',
    buyer: 'Artisan Heritage Gallery (Amsterdam, Belanda 🇳🇱)',
    value: 'USD 24,000 (Air Freight Door to Port)',
    volume: '960 Lembar Tenun Pewarna Herbal',
    status: 'Dalam Pengiriman Kapal & Pelacakan Laut',
    step: 3,
    escrowPaid: 'USD 19,200 (80% Dana Berhasil Masuk Rekening UMKM)',
    docs: ['Bill of Lading #BL-99214', 'COO Form A/D', 'Maritime Insurance Policy', 'Customs Clearance NPE'],
  },
};

/**
 * Modal detail transaksi Escrow Vault — versi React dari logic radar.js
 */
export default function TxModal() {
  const { modal, closeModal, showToast } = useApp();
  if (modal?.type !== 'tx') return null;
  const t = TX_DATA[modal.txKey] || TX_DATA.gayo;

  function handleDownload() {
    const contractHtml = `
      <div class="header">
        <div>
          <div class="title">INTERNATIONAL EXPORT SALES CONTRACT</div>
          <div style="font-size:12px; color:#64748b; margin-top:4px;">No: ${t.title} &bull; Ref: NB-CONTRACT-2026</div>
        </div>
        <div class="seal">✓ NUSABRIDGE ESCROW PROTECTED</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; font-size:12px; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">
        <div>
          <strong style="color:#0f172a; text-transform:uppercase;">Eksportir Terverifikasi:</strong>
          <p style="margin:4px 0 0; color:#334155;">
            <strong>CV Kopi & Rempah Nusantara Mandiri</strong><br>
            NIB: 1294801928415 &bull; NPWP: 01.234.567.8-012.000<br>
            Indonesia &bull; Verified Global Exporter Shield
          </p>
        </div>
        <div>
          <strong style="color:#0f172a; text-transform:uppercase;">Global Buyer:</strong>
          <p style="margin:4px 0 0; color:#334155;">
            <strong>${t.buyer}</strong><br>
            Status Pembayaran: <strong style="color:#059669;">100% Escrow Deposited</strong><br>
            Tahap Pencairan: ${t.escrowPaid}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Deskripsi Komoditas</th>
            <th>Volume / Kuantitas</th>
            <th>Status Ekspor</th>
            <th>Nilai Kontrak</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${t.product}</strong><br><small style="color:#64748b;">Standar Mutu Ekspor &amp; Uji Mutu Sucofindo Lolos</small></td>
            <td>${t.volume}</td>
            <td><span style="color:#059669; font-weight:700;">${t.status}</span></td>
            <td><strong style="color:#1e3a8a;">${t.value}</strong></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:14px;">
        <h5 style="font-size:13px; color:#0f172a; margin-bottom:8px; font-weight:700;">Dokumen Kepatuhan &amp; Legalitas yang Disertakan:</h5>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px;">
          ${t.docs.map((d) => `<div style="padding:6px 10px; background:#f1f5f9; border-radius:4px;">✓ <strong>${d}</strong> (Tervalidasi)</div>`).join('')}
        </div>
      </div>

      <div style="margin-top:18px; font-size:11.5px; color:#475569; background:#ecfdf5; border:1px solid #a7f3d0; padding:10px 14px; border-radius:6px;">
        <strong>Klausul Escrow Vault 4 Tahap:</strong> Seluruh pembayaran telah dijamin oleh NusaBridge Escrow Vault berstandar smart contract ICC Incoterms 2020. Dana dicairkan bertahap sesuai telemetri kapal kargo (30% DP &bull; 30% PEB Bea Cukai &bull; 20% Bill of Lading &bull; 20% Sandar di Pelabuhan Tujuan).
      </div>

      <div class="footer">
        <div>
          <span>Digital Signatures Verified by NusaBridge AI</span><br>
          <span>Timestamp: ${new Date().toLocaleString('id-ID')}</span>
        </div>
        <div style="text-align:right;">
          <span>Authorized by International Chamber of Commerce (ICC) Model</span><br>
          <strong>NusaBridge Global Trade Settlement</strong>
        </div>
      </div>
    `;

    downloadHtmlFile(
      `Kontrak-Ekspor-${t.product.replace(/[^a-zA-Z0-9]/g, '-')}.html`,
      `Kontrak Ekspor - ${t.product}`,
      contractHtml
    );
    showToast('📄 Dokumen ekspor resmi berhasil diunduh ke perangkat Anda!');
  }

  return (
    <div
      className="modal-overlay active show"
      id="txDetailModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal-card">
        <button className="modal-close-btn" onClick={closeModal}>&times;</button>

        <div className="modal-header">
          <div className="pill-badge pill-blue">ESCROW VAULT TRANSACTION</div>
          <h3 className="modal-title">{t.title}</h3>
          <p className="modal-subtitle">{t.product} • Nilai: {t.value}</p>
        </div>

        <div className="modal-body-tx" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border-light)' }}>
            <div><strong>Global Buyer:</strong> {t.buyer}</div>
            <div><strong>Volume Muatan:</strong> {t.volume}</div>
            <div><strong>Status Transaksi:</strong> <span style={{ color: '#10b981', fontWeight: 800 }}>{t.status}</span></div>
            <div><strong>Pencairan Dana Escrow:</strong> <strong style={{ color: 'var(--primary)' }}>{t.escrowPaid}</strong></div>
          </div>

          <div style={{ marginTop: 10 }}>
            <h5 style={{ fontSize: 13, color: 'var(--navy-title)', marginBottom: 8, fontWeight: 700 }}>Dokumen Terintegrasi AI Agent:</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
              {t.docs.map((d) => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 6 }}>
                  <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                  <span>{d}</span>
                  <span style={{ fontSize: 10.5, background: '#eff6ff', color: '#1b68f8', fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginLeft: 'auto' }}>Terverifikasi</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-block" type="button" onClick={handleDownload}>
              📄 Unduh Berkas Kontrak &amp; Dokumen Ekspor (PDF)
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: 18 }}>
          <button className="btn btn-primary" onClick={closeModal}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
