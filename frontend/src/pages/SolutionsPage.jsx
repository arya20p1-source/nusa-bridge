import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import T from '../components/T.jsx';
import { downloadHtmlFile } from '../utils/downloadHtmlFile.js';
import { formatAiText } from '../utils/aiText.js';
import { generateSmartAgentReply } from '../utils/solusiReply.js';

/**
 * ==========================================================================
 * NUSABRIDGE - Halaman Solusi AI (port solusi.html + solusi.js)
 * Workspace Gemini chat, 4 Pilar Solusi, dan AI Suite interaktif:
 * RFQ Studio, Auto-PDF Generator, KYC Hub, Escrow Vault 4 Fase.
 * ==========================================================================
 */

const SAMPLE_BUYER_TEXTS = {
  kopi: 'Looking for 20 MT Robusta green beans CIF Hamburg port, packaging 60kg gunny bags, delivery schedule November 2026.',
  rempah: 'Need 5 MT Clove Lalpari CIF Los Angeles port, FDA approved required, shipment from Indonesia.',
  kriya: 'RFQ for 2,000 pcs Handwoven Rattan Chairs FOB Tanjung Priok to Tokyo port, ISPM 15 fumigation standard.',
};

const KYC_REGULATION_KNOWLEDGE = {
  usa: {
    standard: 'FDA (Food and Drug Administration) & Bioterrorism Act',
    items: [
      'Registrasi Fasilitas Pangan (FFR) pada US FDA Database: Terverifikasi',
      'Kewajiban Pengisian FDA Prior Notice sebelum Kapal Sandar: Aktif',
      'Standar Kebersihan ASTA & Pengujian Mikotoksin Bebas Kontaminan: Lolos Uji Lab',
      'Kepatuhan US Foreign Supplier Verification Program (FSVP): Siap Terbit',
    ],
  },
  jepang: {
    standard: 'JAS (Japanese Agricultural Standard) & MHLW Food Sanitation',
    items: [
      'Sertifikasi Standar Organik JAS Pertanian Jepang: Terdaftar Terverifikasi',
      'Pemeriksaan Positive List System (Batas Maksimum Residu Pestisida MHLW): 100% Lolos',
      'Certificate of Origin (COO Form IJEPA Indonesia-Japan Economic Partnership): Aktif',
      'Inspeksi Bebas Serangga Hidup Badan Karantina Tumbuhan: Lolos Sertifikasi',
    ],
  },
  jerman: {
    standard: 'EUDR (European Union Deforestation Regulation) & GSP+',
    items: [
      'Geolocation Tagging Koordinat Kebun Bebas Deforestasi Pasca-2020: Terpetakan GIS',
      'Due Diligence Statement (DDS) TRACES NT Komisi Eropa: Siap Diterbitkan',
      'Uji Laboratorium Bebas Logam Berat & Pestisida Terlarang Uni Eropa: Lolos',
      'COO Form A / REX System untuk Pembebasan Bea Masuk (0% Duty): Memenuhi Syarat',
    ],
  },
  uea: {
    standard: 'Sertifikasi Halal BPJPH & Akreditasi ESMA UAE',
    items: [
      'Sertifikat Halal Resmi BPJPH Indonesia (Mutual Recognition Agreement UAE): Aktif',
      'Kepatuhan Standar Kemasan Pangan Higienis Gulf Standards (GSO): Terpenuhi',
      'Dokumen COO Skema Perjanjian Perdagangan IUAE-CEPA (0% Tarif): Terbit Otomatis',
      'Legalitas Asosiasi Eksportir Kemenkumham: Valid & Terdaftar',
    ],
  },
};

const PHASE_NOTIFICATIONS = {
  1: {
    tag: 'Fase 1 (30% DP Cair)',
    title: 'Kontrak Disepakati & Dana Escrow Terkunci',
    amount: 'USD 6,000',
    pct: '30%',
    msg: 'Kabar gembira! Buyer Hanseatic Coffee Importers GmbH telah menyetujui Sales Contract #SC-2026-DE-088 dan mengunci 100% total dana kontrak (USD 20,000) di NusaBridge Escrow Vault. Sesuai Smart Contract Fase 1, dana uang muka 30% sebesar USD 6,000 telah dilepaskan ke rekening modal kerja UMKM Anda.',
    hash: '0x7a89b...3c14f',
  },
  2: {
    tag: 'Fase 2 (30% PEB Cair)',
    title: 'Pemberitahuan Ekspor Barang (PEB) Terbit',
    amount: 'USD 6,000',
    pct: '60%',
    msg: 'Verifikasi Otomatis Kepabeanan Berhasil! Dokumen PEB (Pemberitahuan Ekspor Barang) dan Nota Pelayanan Ekspor (NPE) nomor 088219/KPU.01/2026 telah terkonfirmasi valid oleh sistem Bea Cukai. Sesuai kesepakatan Fase 2, dana sebesar USD 6,000 (akumulasi 60%) telah dicairkan ke rekening Anda.',
    hash: '0x3f12a...9b42e',
  },
  3: {
    tag: 'Fase 3 (20% B/L Cair)',
    title: 'Kapal Berlayar & Bill of Lading On-Board',
    amount: 'USD 4,000',
    pct: '80%',
    msg: 'Telemetri Maritim AIS Terverifikasi! Peti kemas kargo Anda telah dimuat di atas kapal MV Meratus Flores dan Bill of Lading (B/L) resmi Clean On Board nomor MEDN-HAM-9921 telah diterbitkan pihak pelayaran. Sesuai Fase 3, dana tambahan USD 4,000 (total 80%) telah berhasil ditransfer.',
    hash: '0x9c41d...6e77a',
  },
  4: {
    tag: 'Fase 4 (20% Final Tuntas)',
    title: 'Kargo Tiba di Pelabuhan & Buyer Konfirmasi Sesuai',
    amount: 'USD 4,000',
    pct: '100%',
    msg: 'Transaksi Selesai 100%! Kapal kargo telah sandar di Port of Hamburg, Jerman. Pihak buyer telah mengonfirmasi bahwa seluruh 20 MT biji kopi telah diterima dalam kondisi prima sesuai spesifikasi kontrak. Sisa pelunasan 20% sebesar USD 4,000 telah dicairkan. Transaksi dinyatakan tuntas paripurna!',
    hash: '0x2e88a...4b011',
  },
};

const AI_TABS = [
  { id: 'tab-rfq', icon: '📊', label: '1. AI Sales Assistant & RFQ Studio' },
  { id: 'tab-pdf', icon: '📄', label: '2. Auto-PDF Document Generator' },
  { id: 'tab-kyc', icon: '🛡️', label: '3. KYC Hub & Kepatuhan Global' },
  { id: 'tab-escrow', icon: '🔒', label: '4. Escrow Vault & AI Chat (4 Fase)' },
];

function nowTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// =====================================================================
// Gemini-style chat workspace
// =====================================================================
function GeminiWorkspace() {
  const { lang } = useApp();
  const [msgs, setMsgs] = useState([
    {
      sender: 'agent',
      raw: `Halo! Saya **NusaBridge AI**, asisten perdagangan ekspor-impor pintar untuk UMKM Indonesia.

Saya siap membantu Anda dalam:
• Mengecek harga, spesifikasi, dan MOQ dari 50 komoditas ekspor unggulan (Kopi, Rempah, Kriya, Tekstil).
• Menghitung estimasi biaya pengiriman, ocean freight kapal, asuransi, dan penawaran CIF/FOB dengan margin aman.
• Memberikan panduan kepatuhan dan audit perizinan negara tujuan (NIB OSS, Sertifikat Karantina, US FDA, EUDR Eropa, JAS Jepang).
• Menjelaskan skema pembayaran bertahap 4 fase via Escrow Vault agar transaksi Anda aman dari risiko penipuan.

Silakan ketik pertanyaan atau konsultasi ekspor Anda di bawah!`,
      label: 'NusaBridge AI',
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const sendingRef = useRef(false);
  const historyRef = useRef(null);
  const inputRef = useRef(null);

  // Status koneksi Gemini yang sebenarnya (dicek ke Google, bukan asal "ada key")
  const [aiConn, setAiConn] = useState(null);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((d) => { if (alive) setAiConn(d); })
      .catch(() => { if (alive) setAiConn({ connected: false, reason: 'Backend tidak dapat dihubungi. Jalankan node server.js di folder backend.' }); });
    return () => { alive = false; };
  }, []);

  async function refreshAiStatus() {
    try {
      const st = await fetch('/api/ai/status').then((r) => r.json());
      setAiConn(st);
      return st;
    } catch (e) {
      setAiConn({ connected: false, reason: 'Backend tidak dapat dihubungi.' });
      return null;
    }
  }

  async function saveApiKey(e) {
    if (e) e.preventDefault();
    const key = apiKeyInput.trim();
    if (!key) return;
    setKeyStatus('saving');
    try {
      const res = await fetch('/api/ai/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('nb_gemini_api_key', key);
        setKeyStatus('ok');
        setApiKeyInput('');
        setShowKeyPanel(false);
        const st = await refreshAiStatus();
        if (st && st.connected) {
          push('agent', `✅ **Gemini berhasil terhubung!** Model aktif: **${data.model}**. Mulai sekarang setiap pertanyaan dijawab langsung oleh Google Gemini, bukan engine lokal.`, 'NusaBridge AI');
        }
      } else {
        setKeyStatus('err:' + (data.message || 'API key ditolak Google.'));
      }
    } catch (err) {
      setKeyStatus('err:Gagal menghubungi backend: ' + err.message);
    }
  }

  function scrollBottom() {
    requestAnimationFrame(() => {
      if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
    });
  }

  function push(sender, raw, label) {
    setMsgs((prev) => [...prev, { sender, raw, label: label || (sender === 'user' ? 'Anda (Buyer / Eksportir)' : 'NusaBridge AI'), time: nowTime() }]);
    scrollBottom();
  }

  async function processQuery(text) {
    if (!text || !text.trim()) return;
    const promptText = text.trim();
    push('user', promptText);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setTyping(true);
    scrollBottom();

    const storedApiKey = localStorage.getItem('nb_gemini_api_key') || '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText, apiKey: storedApiKey, lang }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          setTyping(false);
          push('agent', data.reply, data.isOfficialGemini ? 'NusaBridge AI (Official Engine)' : 'NusaBridge AI');
          return;
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      // Backend offline / timeout -> fallback ke knowledge engine lokal
    }

    setTimeout(() => {
      setTyping(false);
      push('agent', generateSmartAgentReply(promptText), 'NusaBridge AI');
    }, 350);
  }

  async function handleSend(e) {
    if (e) e.preventDefault();
    if (sendingRef.current) return;
    const val = (input || '').trim();
    if (!val) return;
    sendingRef.current = true;
    try {
      await processQuery(val);
    } finally {
      sendingRef.current = false;
    }
  }

  function onAutoResize() {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }

  return (
    <section className="section-gemini-chat-workspace" id="ai-conversation-room">
      <div className="site-container">
        <div className="gemini-chat-container">
          <main className="gemini-chat-main">
            <div className="gcm-header">
              <div className="gcm-agent-info">
                <div className="gcm-avatar">✓</div>
                <div className="gcm-agent-text">
                  <strong><T k="solusi_chat_title" /></strong>
                  <span><T k="solusi_chat_sub" /></span>
                </div>
              </div>
              <div className="gcm-actions">
                <div className="gcm-direct-badge" title={aiConn?.connected ? aiConn.model : (aiConn?.reason || 'Mengecek koneksi...')}>
                  <span className="direct-dot" style={aiConn && !aiConn.connected ? { background: '#f59e0b' } : undefined} />
                  <span>{aiConn === null ? 'Mengecek...' : aiConn.connected ? 'Gemini Connected' : 'Gemini Off'}</span>
                </div>
                <button
                  className="btn-clear-chat"
                  type="button"
                  title="Atur API Key Gemini"
                  onClick={() => { setShowKeyPanel((v) => !v); setKeyStatus(''); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Atur API Key</span>
                </button>
                <button
                  className="btn-clear-chat"
                  type="button"
                  title="Bersihkan riwayat percakapan"
                  onClick={() => {
                    setMsgs([{
                      sender: 'agent',
                      raw: 'Halo! Saya **NusaBridge AI**, asisten perdagangan ekspor-impor pintar untuk UMKM Indonesia. Silakan ketik pertanyaan atau konsultasi ekspor Anda!',
                      label: 'NusaBridge AI',
                      time: nowTime(),
                    }]);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span><T k="solusi_btn_clear" /></span>
                </button>
              </div>
            </div>

            {showKeyPanel && (
              <form onSubmit={saveApiKey} style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                <div style={{ fontSize: '13px', marginBottom: '8px', color: '#334155' }}>
                  Tempel API key Gemini (<code>AIza...</code> atau auth key baru <code>AQ....</code>, tanpa spasi) dari{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIza..."
                    autoComplete="off"
                    spellCheck={false}
                    style={{ flex: '1 1 260px', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                  <button type="submit" className="btn-clear-chat" disabled={keyStatus === 'saving'} style={{ background: '#0f766e', color: '#fff', border: 'none' }}>
                    <span>{keyStatus === 'saving' ? 'Memverifikasi...' : 'Simpan & Verifikasi'}</span>
                  </button>
                </div>
                {keyStatus.startsWith('err:') && (
                  <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#b91c1c' }}>⚠️ {keyStatus.slice(4)}</div>
                )}
                {keyStatus === 'ok' && (
                  <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#047857' }}>✅ API key tersimpan dan terverifikasi.</div>
                )}
              </form>
            )}

            {aiConn && !aiConn.connected && (
              <div style={{ padding: '10px 16px', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: '12.5px', color: '#92400e' }}>
                ⚠️ Gemini belum aktif — jawaban masih dari engine lokal. Alasan: {aiConn.reason || 'API key belum diisi.'}{' '}
                <button type="button" onClick={() => setShowKeyPanel(true)} style={{ background: 'none', border: 'none', color: '#0369a1', textDecoration: 'underline', cursor: 'pointer', fontSize: '12.5px', padding: 0 }}>
                  Atur API Key
                </button>
              </div>
            )}

            <div className="gcm-history" ref={historyRef}>
              {msgs.map((m, i) => (
                <div className={`chat-bubble-row ${m.sender === 'user' ? 'user-row' : 'agent-row'}`} key={i}>
                  <div className="cbr-avatar">{m.sender === 'user' ? '🧑‍💼' : '🤖'}</div>
                  <div className="cbr-content">
                    <div className="cbr-header">
                      <span>{m.label}</span>
                      <span>{m.time}</span>
                    </div>
                    <div className="cbr-text" dangerouslySetInnerHTML={{ __html: formatAiText(m.raw) }} />
                  </div>
                </div>
              ))}
              {typing && (
                <div className="chat-bubble-row agent-row">
                  <div className="cbr-avatar">🤖</div>
                  <div className="cbr-content" style={{ padding: '10px 14px' }}>
                    <div className="typing-indicator">
                      <span>NusaBridge AI sedang mengetik</span>
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="gcm-footer">
              <form className="chat-input-form" onSubmit={handleSend}>
                <textarea
                  ref={inputRef}
                  className="chat-textarea"
                  rows={1}
                  data-i18n-placeholder="solusi_input_ph"
                  placeholder="Tanyakan apa saja ke NusaBridge AI... (Contoh: Bagaimana cara kerja AI? atau Hitung biaya CIF Hamburg)"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); onAutoResize(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button className="btn-send-message" type="submit" aria-label="Kirim Pesan">
                  <span><T k="solusi_btn_send" /></span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
              <div className="chat-input-disclaimer">
                <span><T k="solusi_disclaimer" /></span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

// =====================================================================
// 4 Pilar statis
// =====================================================================
function PillarsSection() {
  const check = (
    <span className="pfl-check">✓</span>
  );
  return (
    <section className="section-solution-pillars">
      <div className="site-container">

        {/* Pilar 1 */}
        <div className="pillar-row" id="pilar-1">
          <div className="pillar-text">
            <div className="pill-badge pill-blue">PILAR 1</div>
            <h2 className="pillar-title">AI Sales Assistant &amp; RFQ Studio</h2>
            <p className="pillar-desc">
              Mengubah pesan penawaran informal dari buyer luar negeri menjadi format formal Request For Quotation (RFQ) berstandar Incoterms 2020 dalam hitungan detik.
            </p>
            <ul className="pillar-feature-list">
              <li>{check}
                <div>
                  <strong>Kalkulator Incoterms Real-Time</strong>
                  <p>AI menghitung perbedaan struktur biaya FOB, CIF, CFR, dan EXW secara otomatis berdasarkan pelabuhan muat dan tujuan.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Rekomendasi Harga Margin Aman</strong>
                  <p>Mencegah UMKM merugi karena salah estimasi biaya freight laut, fluktuasi kurs mata uang, atau biaya pelabuhan.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Asisten Negosiasi Multi-Bahasa</strong>
                  <p>Membantu UMKM merespons email buyer berbahasa Inggris, Jerman, Jepang, atau Arab dengan tata bahasa bisnis profesional.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="pillar-visual">
            <div className="pillar-mock-card">
              <div className="pmc-header">
                <span className="pmc-tag">RFQ Studio Sandbox</span>
                <span className="pmc-status">⚡ AI Processing</span>
              </div>
              <div className="pmc-body">
                <div className="pmc-input-bubble">
                  <small>Permintaan Buyer Masuk (Hamburg, DE):</small>
                  <p>&quot;Looking for 20 MT Robusta green beans CIF Hamburg port, packaging 60kg gunny bags.&quot;</p>
                </div>
                <div className="pmc-ai-response">
                  <div className="pmc-ai-title">🤖 NusaBridge Engine Output:</div>
                  <div className="pmc-calc-row"><span>Harga Dasar FOB Tanjung Priok:</span> <strong>USD 3.85 / Kg</strong></div>
                  <div className="pmc-calc-row"><span>Ocean Freight &amp; Insurance:</span> <strong>USD 0.42 / Kg</strong></div>
                  <div className="pmc-calc-row highlight"><span>Rekomendasi Penawaran CIF:</span> <strong>USD 4.27 / Kg</strong></div>
                  <div className="pmc-badge-pill">Margin Aman: +18.5% Net Profit</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pilar 2 */}
        <div className="pillar-row reverse" id="pilar-2">
          <div className="pillar-text">
            <div className="pill-badge pill-blue">PILAR 2</div>
            <h2 className="pillar-title">Otomatisasi Dokumen Ekspor Resmi</h2>
            <p className="pillar-desc">
              Mengisi puluhan lembar dokumen ekspor yang rumit kini digantikan dengan satu klik. AI Agent NusaBridge menerbitkan dokumen resmi yang memenuhi persyaratan Bea Cukai dan International Chamber of Commerce (ICC).
            </p>
            <ul className="pillar-feature-list">
              <li>{check}
                <div>
                  <strong>Proforma Invoice &amp; Sales Contract</strong>
                  <p>Terbit instan dengan klausul perlindungan hukum internasional untuk melindungi hak penjual lokal.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Commercial Invoice &amp; Packing List</strong>
                  <p>Kalkulasi berat bersih (net weight), berat kotor (gross weight), dan volume CBM peti kemas tanpa salah hitung.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Draft Pemberitahuan Ekspor Barang (PEB) &amp; SKA</strong>
                  <p>Terintegrasi dengan format data sistem kepabeanan Indonesia untuk mempercepat penerbitan Nota Pelayanan Ekspor (NPE).</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="pillar-visual">
            <div className="pillar-mock-card doc-card">
              <div className="pmc-header">
                <span className="pmc-tag">📄 Generated Document Preview</span>
                <span className="pmc-status">ISO Standard</span>
              </div>
              <div className="doc-preview-inner">
                <div className="doc-header-strip">
                  <strong>COMMERCIAL INVOICE #INV-2026-DE-088</strong>
                  <span className="doc-date">16 Oktober 2026</span>
                </div>
                <div className="doc-line"><span>Exporter:</span> <strong>Koperasi Tani Kopi Gayo Bersama (Takengon, ID)</strong></div>
                <div className="doc-line"><span>Consignee:</span> <strong>Hanseatic Coffee Importers GmbH (Hamburg, DE)</strong></div>
                <div className="doc-line"><span>Port of Loading:</span> <strong>Belawan Port, Medan</strong></div>
                <div className="doc-line"><span>Port of Discharge:</span> <strong>Port of Hamburg, Germany</strong></div>
                <div className="doc-line"><span>Incoterms:</span> <strong>CIF Hamburg (Incoterms 2020)</strong></div>
                <div className="doc-seal-badge">
                  <span className="seal-icon">✓</span> Digested &amp; Verified by NusaBridge AI
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pilar 3 */}
        <div className="pillar-row" id="pilar-3">
          <div className="pillar-text">
            <div className="pill-badge pill-blue">PILAR 3</div>
            <h2 className="pillar-title">KYC Hub &amp; Validasi Kepatuhan Global</h2>
            <p className="pillar-desc">
              Banyak transaksi ekspor gagal karena barang ditahan di pelabuhan tujuan akibat tidak memenuhi standar mutu atau sertifikasi negara setempat. KYC Hub NusaBridge melakukan audit otomatis sebelum barang dikirim.
            </p>
            <ul className="pillar-feature-list">
              <li>{check}
                <div>
                  <strong>Validasi Format NIB &amp; NPWP</strong>
                  <p>Verifikasi status Nomor Induk Berusaha pada sistem OSS dan kelayakan izin kepabeanan.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Deteksi Standar Negara Tujuan</strong>
                  <p>Mengecek otomatis apakah produk memerlukan sertifikat FDA (AS), CE Mark (Eropa), JAS (Jepang), atau Fumigasi ISPM 15.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Verified Seller Shield</strong>
                  <p>Meningkatkan kepercayaan buyer internasional sehingga mereka bersedia membayar uang muka (DP) lebih awal.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="pillar-visual">
            <div className="pillar-mock-card kyc-card">
              <div className="pmc-header">
                <span className="pmc-tag">Verifikasi Legalitas &amp; Sertifikasi</span>
                <span className="pmc-status">🛡️ 100% Score</span>
              </div>
              <div className="kyc-checklist">
                <div className="kyc-item-row pass">
                  <span className="kyc-icon">✓</span>
                  <div className="kyc-meta"><strong>NIB Pelaku Usaha (OSS):</strong> Valid &amp; Aktif Ekspor</div>
                </div>
                <div className="kyc-item-row pass">
                  <span className="kyc-icon">✓</span>
                  <div className="kyc-meta"><strong>NPWP Badan/Perorangan:</strong> Terdaftar Kemenkeu</div>
                </div>
                <div className="kyc-item-row pass">
                  <span className="kyc-icon">✓</span>
                  <div className="kyc-meta"><strong>Hasil Uji Lab Sucofindo/Baristand:</strong> Lolos Uji Logam Berat</div>
                </div>
                <div className="kyc-item-row pass">
                  <span className="kyc-icon">✓</span>
                  <div className="kyc-meta"><strong>Phytosanitary &amp; Karantina:</strong> Bebas Hama Organisme</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pilar 4 */}
        <div className="pillar-row reverse" id="pilar-4">
          <div className="pillar-text">
            <div className="pill-badge pill-blue">PILAR 4</div>
            <h2 className="pillar-title">Escrow Vault: Transaksi Aman Tanpa Risiko</h2>
            <p className="pillar-desc">
              Kekhawatiran terbesar UMKM adalah barang sudah dikirim tetapi pembeli tidak membayar. Escrow Vault NusaBridge mengunci dana pembayaran di muka dan melepaskannya secara transparan berdasarkan milestone pelayaran.
            </p>
            <ul className="pillar-feature-list">
              <li>{check}
                <div>
                  <strong>Milestone 1 (30% DP Masuk):</strong>
                  <p>Pelepasan dana produksi saat Sales Contract ditandatangani kedua belah pihak.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Milestone 2 (30% Cargo Ready):</strong>
                  <p>Pelepasan dana saat barang tiba di pelabuhan muat dan dokumen PEB diterbitkan.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Milestone 3 (20% On-Board Vessel):</strong>
                  <p>Pelepasan dana saat kapal kargo berlayar dan Bill of Lading (B/L) resmi terbit.</p>
                </div>
              </li>
              <li>{check}
                <div>
                  <strong>Milestone 4 (20% Final Settlement):</strong>
                  <p>Pelepasan sisa dana saat kontainer tiba di pelabuhan tujuan dan lolos inspeksi penerimaan.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="pillar-visual">
            <div className="pillar-mock-card escrow-card">
              <div className="pmc-header">
                <span className="pmc-tag">Simulasi Escrow Vault</span>
                <span className="pmc-status">🔒 Terlindungi</span>
              </div>
              <div className="escrow-bars">
                <div className="es-bar-item done">
                  <div className="es-label"><span>Tahap 1: Kontrak Selesai (30%)</span> <strong>USD 6,000 (Cair)</strong></div>
                  <div className="es-track"><div className="es-fill" style={{ width: '100%' }} /></div>
                </div>
                <div className="es-bar-item done">
                  <div className="es-label"><span>Tahap 2: PEB &amp; Stuffing (30%)</span> <strong>USD 6,000 (Cair)</strong></div>
                  <div className="es-track"><div className="es-fill" style={{ width: '100%' }} /></div>
                </div>
                <div className="es-bar-item active">
                  <div className="es-label"><span>Tahap 3: Kapal Berlayar (20%)</span> <strong>USD 4,000 (Dalam Proses)</strong></div>
                  <div className="es-track"><div className="es-fill" style={{ width: '75%' }} /></div>
                </div>
                <div className="es-bar-item pending">
                  <div className="es-label"><span>Tahap 4: Tiba di Tujuan (20%)</span> <strong>USD 4,000 (Terkunci di Vault)</strong></div>
                  <div className="es-track"><div className="es-fill" style={{ width: '0%' }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// =====================================================================
// Tab 1: RFQ Studio
// =====================================================================
function computeRfq(textLower) {
  let commodity = 'Kopi Robusta Lampung Grade 1';
  let hsCode = '0901.11.10';
  let pol = 'Pelabuhan Tanjung Priok, Jakarta';
  let pod = 'Port of Hamburg, Germany';
  let incoterm = 'CIF Hamburg (Incoterms 2020)';
  let qty = '20,000 Kg (20 MT)';
  let fobPrice = 3.85;
  let freightInsurance = 0.42;

  if (textLower.includes('clove') || textLower.includes('cengkeh') || textLower.includes('los angeles')) {
    commodity = 'Cengkeh Lalpari Maluku Super';
    hsCode = '0907.10.00';
    pol = 'Pelabuhan Tanjung Perak, Surabaya';
    pod = 'Port of Los Angeles, USA';
    incoterm = 'CIF Los Angeles (Incoterms 2020)';
    qty = '5,000 Kg (5 MT)';
    fobPrice = 12.5;
    freightInsurance = 1.15;
  } else if (textLower.includes('rattan') || textLower.includes('rotan') || textLower.includes('tokyo')) {
    commodity = 'Kursi Rotan Alami Cirebon';
    hsCode = '9401.52.00';
    pol = 'Pelabuhan Tanjung Priok, Jakarta';
    pod = 'Tokyo Port, Japan';
    incoterm = 'FOB Tanjung Priok (Incoterms 2020)';
    qty = '2,000 Pcs (2 x 40ft High Cube)';
    fobPrice = 78.0;
    freightInsurance = 0.0;
  }

  const marginPct = 18.5;
  const baseProductionCost = (fobPrice * 0.72).toFixed(2);
  const truckingPortCost = (fobPrice * 0.095).toFixed(2);
  const netProfitMargin = (fobPrice * (marginPct / 100)).toFixed(2);
  const finalUnitPrice = (fobPrice + freightInsurance).toFixed(2);
  const totalContractVal = (parseFloat(finalUnitPrice) * (parseInt(qty.replace(/[^0-9]/g, ''), 10) || 20000)).toLocaleString('en-US');

  return { commodity, hsCode, pol, pod, incoterm, qty, baseProductionCost, truckingPortCost, freightInsurance, netProfitMargin, finalUnitPrice, totalContractVal, marginPct };
}

function RfqTab({ goDocGen }) {
  const [rawInput, setRawInput] = useState(SAMPLE_BUYER_TEXTS.kopi);
  const [converting, setConverting] = useState(false);
  const [resultText, setResultText] = useState(SAMPLE_BUYER_TEXTS.kopi);

  const rfq = useMemo(() => computeRfq(resultText.toLowerCase()), [resultText]);

  function handleConvert() {
    setConverting(true);
    setTimeout(() => {
      setResultText(rawInput);
      setConverting(false);
    }, 400);
  }

  return (
    <div className="ai-tab-pane active">
      <div className="sim-wrapper-card">
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-title)' }}>Pesan / Permintaan Informal dari Buyer Luar Negeri:</label>
          <div className="rfq-sample-chips">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contoh Cepat:</span>
            {Object.entries(SAMPLE_BUYER_TEXTS).map(([key, text]) => (
              <button
                key={key}
                type="button"
                className="rfq-sample-btn"
                onClick={() => { setRawInput(text); setResultText(text); }}
              >
                {key === 'kopi' ? 'Kopi Robusta (Hamburg, DE)' : key === 'rempah' ? 'Cengkeh Lalpari (Los Angeles, US)' : 'Kursi Rotan (Tokyo, JP)'}
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="rfq-input-area"
          placeholder="Masukkan pesan chat/email dari buyer luar negeri (cth: Looking for 20 MT Robusta green beans CIF Hamburg port, packaging 60kg gunny bags)..."
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
        />

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button className="btn btn-primary btn-lg" type="button" onClick={handleConvert} disabled={converting}>
            {converting
              ? <span>🧠 NusaBridge AI Memproses Incoterms 2020...</span>
              : <span>✨ Konversi Pesan Buyer Menjadi RFQ Resmi (Incoterms 2020)</span>}
          </button>
        </div>

        <div className="sim-output-panel">
          <div className="sop-header">
            <span className="sop-dot" />
            <strong>Request for Quotation (RFQ) Terbit Otomatis &bull; Incoterms 2020</strong>
          </div>
          <div className="sop-grid">
            <div className="sop-col">
              <h5>1. Ekstraksi Entitas &amp; Parameter RFQ</h5>
              <div className="sop-val-big" style={{ fontSize: '1.15rem', color: '#60a5fa' }}>{rfq.commodity}</div>
              <p className="sop-desc"><strong>Volume / Satuan:</strong> {rfq.qty}</p>
              <p className="sop-desc"><strong>Pelabuhan Muat (POL):</strong> {rfq.pol}</p>
              <p className="sop-desc"><strong>Pelabuhan Bongkar (POD):</strong> {rfq.pod}</p>
              <div className="sop-badge green">✅ Incoterms Terdeteksi: {rfq.incoterm}</div>
            </div>

            <div className="sop-col">
              <h5>2. Rincian Struktur Biaya Ekspor (Per Satuan)</h5>
              <div className="sop-highlight-box">
                <div className="shb-row"><span>Biaya Produksi &amp; Kemasan:</span> <strong>USD {rfq.baseProductionCost}</strong></div>
                <div className="shb-row"><span>Trucking &amp; Port Handling:</span> <strong>USD {rfq.truckingPortCost}</strong></div>
                <div className="shb-row"><span>Ocean Freight &amp; Asuransi:</span> <strong>USD {rfq.freightInsurance.toFixed(2)}</strong></div>
                <div className="shb-row" style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '4px' }}>
                  <span style={{ color: '#34d399' }}>Margin Aman UMKM (+{rfq.marginPct}%):</span>
                  <strong style={{ color: '#34d399' }}>+USD {rfq.netProfitMargin}</strong>
                </div>
              </div>
            </div>

            <div className="sop-col">
              <h5>3. Rekomendasi Kuotasi &amp; Nilai Kontrak</h5>
              <div className="sop-highlight-box" style={{ background: 'rgba(16,185,129,0.12)', borderColor: '#10b981' }}>
                <div className="shb-row"><span>Harga Penawaran Final:</span> <strong style={{ fontSize: '1.25rem', color: '#34d399' }}>USD {rfq.finalUnitPrice}</strong></div>
                <div className="shb-row"><span>Estimasi Nilai Kontrak:</span> <strong style={{ color: '#ffffff' }}>USD {rfq.totalContractVal}</strong></div>
                <div className="shb-row"><span>Rekomendasi HS Code:</span> <code>{rfq.hsCode}</code></div>
              </div>
              <button className="btn btn-primary btn-sm btn-block" type="button" onClick={goDocGen}>
                Terbitkan Proforma Invoice Otomatis →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Tab 2: Auto-PDF Generator
// =====================================================================
function getPiSheetHtml() {
  return `
    <div class="dps-header">
      <div class="dps-brand">
        <strong>NUSABRIDGE EXPORT TRADE FACILITATION ENGINE</strong>
        <p>Integrated Global Trade &amp; Automated Customs Documentation Platform</p>
      </div>
      <div class="dps-meta">
        <h4>PROFORMA INVOICE</h4>
        <div style="font-size:11.5px; color:#64748b;">Invoice No: <strong>#PI-2026-DE-088</strong></div>
        <div style="font-size:11.5px; color:#64748b;">Date: <strong>19 Oktober 2026</strong></div>
      </div>
    </div>

    <div class="dps-parties-grid">
      <div>
        <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">Seller / Exporter:</strong>
        <p style="margin:4px 0 0; font-size:12px; color:#334155;">
          <strong>CV Kopi Nusantara Bersama</strong><br>
          NIB: 0120268840001 &bull; NPWP: 01.234.567.8-012.000<br>
          Takengon, Aceh Tengah, Indonesia<br>
          Escrow Vault ID: <code>NB-ESC-USD-99214</code>
        </p>
      </div>
      <div>
        <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">Consignee / Buyer:</strong>
        <p style="margin:4px 0 0; font-size:12px; color:#334155;">
          <strong>Hanseatic Coffee Importers GmbH</strong><br>
          Am Sandtorkai 48, 20457 Hamburg, Germany<br>
          EORI: DE882194125 &bull; VAT: DE11893240<br>
          Bank: Deutsche Bank AG Hamburg
        </p>
      </div>
    </div>

    <div style="margin-bottom:12px; display:flex; gap:20px; font-size:12px; color:#475569;">
      <span>Port of Loading: <strong>Belawan Port, Medan (IDBLW)</strong></span>
      <span>Port of Discharge: <strong>Port of Hamburg, Germany (DEHAM)</strong></span>
      <span>Terms: <strong>CIF Hamburg (Incoterms 2020)</strong></span>
    </div>

    <table class="dps-table">
      <thead>
        <tr><th>Item &amp; Description</th><th>HS Code</th><th>Qty (Kg)</th><th>Unit Price (USD)</th><th>Total Amount (USD)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Kopi Arabika Gayo Specialty Grade 1</strong><br><small style="color:#64748b;">Moisture &lt;12%, Defect &lt;4%, Screen 16/18, Gunny Bags 60Kg</small></td>
          <td>0901.11.10</td><td>20,000</td><td>$4.27</td><td><strong>$85,400.00</strong></td>
        </tr>
      </tbody>
      <tfoot>
        <tr><th colspan="4" style="text-align:right;">Subtotal FOB Belawan:</th><td>$77,000.00</td></tr>
        <tr><th colspan="4" style="text-align:right;">Ocean Freight &amp; Marine Cargo Insurance (CIF):</th><td>$8,400.00</td></tr>
        <tr><th colspan="4" style="text-align:right; font-size:13px; color:#0f172a;">GRAND TOTAL (CIF HAMBURG):</th><td style="font-size:13px; font-weight:800; color:#059669;">USD $85,400.00</td></tr>
      </tfoot>
    </table>

    <div style="background:#f1f5f9; padding:10px 14px; border-radius:6px; font-size:11.5px; color:#334155; margin-bottom:14px;">
      <strong>Payment Terms via Escrow Vault:</strong> 30% Advance Down Payment upon Confirmation, 30% against PEB Customs Clearance, 20% upon Clean Bill of Lading, 20% Balance upon Port of Hamburg Arrival.
    </div>

    <div class="dps-footer-seal">
      <div>
        <span class="seal-stamp">✅ VERIFIED BY NUSABRIDGE AI TOOL CALLING</span>
        <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Digital Signature Hash: <code>e8b4...92c1</code></div>
      </div>
      <div style="text-align:right; font-size:11px; color:#64748b;">
        Authorized Signatory &amp; Stamp<br>
        <strong style="color:#0f172a;">NusaBridge AI Trade Settlement Network</strong>
      </div>
    </div>
  `;
}

function getScSheetHtml() {
  return `
    <div class="dps-header">
      <div class="dps-brand">
        <strong>INTERNATIONAL CHAMBER OF COMMERCE (ICC) MODEL</strong>
        <p>International Export Sales Contract &bull; Governed by CISG &amp; Incoterms 2020</p>
      </div>
      <div class="dps-meta">
        <h4>EXPORT SALES CONTRACT</h4>
        <div style="font-size:11.5px; color:#64748b;">Contract No: <strong>#SC-2026-US-104</strong></div>
        <div style="font-size:11.5px; color:#64748b;">Jurisdiction: <strong>Singapore International Arbitration (SIAC)</strong></div>
      </div>
    </div>

    <div class="dps-parties-grid">
      <div>
        <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">The Seller:</strong>
        <p style="margin:4px 0 0; font-size:12px; color:#334155;">
          <strong>Koperasi Rempah Organik Maluku</strong><br>
          Ambon, Maluku, Republic of Indonesia<br>
          Exporter ID: <code>EXP-NUSA-2026-081</code>
        </p>
      </div>
      <div>
        <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">The Buyer:</strong>
        <p style="margin:4px 0 0; font-size:12px; color:#334155;">
          <strong>Pacific Spice &amp; Botanical Co.</strong><br>
          Long Beach, California, United States of America<br>
          US FDA Reg: <code>18820499120</code>
        </p>
      </div>
    </div>

    <div style="font-size:12px; color:#334155; margin-bottom:14px; line-height:1.6;">
      <strong>Clause 1 (Commodity &amp; Specs):</strong> 5,000 Kg Clove Lalpari Handpicked Clean, Moisture &lt;11.5%, Volatile Oil &gt;19%, ASTA Cleanliness Standard.<br>
      <strong>Clause 2 (Price &amp; Term):</strong> CIF Los Angeles Port at USD $13.65 / Kg, Total Contract Value USD $68,250.00.<br>
      <strong>Clause 3 (Inspection):</strong> Phytosanitary Certificate issued by Indonesian Agricultural Quarantine Agency &amp; Lab CoA by Sucofindo.<br>
      <strong>Clause 4 (Smart Escrow Settlement):</strong> All payments are secured within NusaBridge Escrow Vault in USD currency with automated milestone release rules.
    </div>

    <div class="dps-footer-seal">
      <div>
        <span class="seal-stamp" style="border-color:#2563eb; color:#2563eb;">✍️ LEGALLY BINDING DIGITAL CONTRACT</span>
        <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Electronic Identification &amp; Trust Services (eIDAS) Compliant</div>
      </div>
      <div style="text-align:right; font-size:11px; color:#64748b;">
        Countersigned Digitally by Both Parties<br>
        <strong style="color:#0f172a;">Valid &amp; Enforceable Globally</strong>
      </div>
    </div>
  `;
}

function PdfTab({ showToast }) {
  const [docType, setDocType] = useState('pi');
  const sheetRef = useRef(null);

  function handlePrint() {
    const docHtml = docType === 'pi' ? getPiSheetHtml() : getScSheetHtml();
    const docTitle = docType === 'pi' ? 'Proforma Invoice - INV-2026-DE-088' : 'Export Sales Contract - SC-2026-US-104';
    const filename = docType === 'pi' ? 'Proforma-Invoice-INV-2026-DE-088.html' : 'Export-Sales-Contract-SC-2026-US-104.html';
    downloadHtmlFile(filename, docTitle, docHtml);
    showToast('📄 Draf dokumen ekspor resmi berhasil diunduh ke perangkat Anda!');
    setTimeout(() => window.print(), 500);
  }

  function handleCopy() {
    const text = sheetRef.current ? sheetRef.current.innerText : '';
    if (text) navigator.clipboard.writeText(text).then(() => window.alert('Teks draf dokumen ekspor resmi berhasil disalin ke clipboard!'));
  }

  return (
    <div className="ai-tab-pane">
      <div className="sim-wrapper-card">
        <div className="doc-pdf-controls">
          <div className="doc-type-selector">
            <button type="button" className={`doc-type-btn${docType === 'pi' ? ' active' : ''}`} onClick={() => setDocType('pi')}>Proforma Invoice (PI)</button>
            <button type="button" className={`doc-type-btn${docType === 'sc' ? ' active' : ''}`} onClick={() => setDocType('sc')}>Export Sales Contract (SC)</button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline btn-sm" type="button" onClick={handleCopy}>📋 Salin Teks</button>
            <button className="btn btn-primary btn-sm" type="button" style={{ background: '#059669', borderColor: '#059669' }} onClick={handlePrint}>
              🖨️ Cetak / Unduh Draf PDF Resmi
            </button>
          </div>
        </div>

        <div
          className="doc-paper-sheet"
          ref={sheetRef}
          dangerouslySetInnerHTML={{ __html: docType === 'pi' ? getPiSheetHtml() : getScSheetHtml() }}
        />
      </div>
    </div>
  );
}

// =====================================================================
// Tab 3: KYC Hub
// =====================================================================
function KycTab() {
  const [nib, setNib] = useState('0120268840001');
  const [npwp, setNpwp] = useState('01.234.567.8-012.000');
  const [country, setCountry] = useState('usa');
  const [auditing, setAuditing] = useState(false);
  const [resultKey, setResultKey] = useState({ country: 'usa', nib: '0120268840001', npwp: '01.234.567.8-012.000', tick: 0 });

  const reg = KYC_REGULATION_KNOWLEDGE[resultKey.country] || KYC_REGULATION_KNOWLEDGE.usa;

  function runAudit() {
    setAuditing(true);
    setTimeout(() => {
      setResultKey({ country, nib, npwp, tick: resultKey.tick + 1 });
      setAuditing(false);
    }, 350);
  }

  return (
    <div className="ai-tab-pane">
      <div className="sim-wrapper-card">
        <div className="kyc-audit-grid">
          <div className="kyc-input-card">
            <h4 style={{ margin: '0 0 14px', fontSize: '15px', color: 'var(--navy-title)' }}>Audit Legalitas Pelaku Usaha (OSS):</h4>
            <div className="calc-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700 }}>Nomor Induk Berusaha (NIB 13 Digit):</label>
              <input type="text" className="custom-input" value={nib} onChange={(e) => setNib(e.target.value)} />
            </div>
            <div className="calc-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700 }}>NPWP Badan Usaha (16 Digit):</label>
              <input type="text" className="custom-input" value={npwp} onChange={(e) => setNpwp(e.target.value)} />
            </div>
            <div className="calc-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700 }}>Target Negara Tujuan Ekspor:</label>
              <select className="custom-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="usa">Amerika Serikat (USA) - Standar FDA &amp; Bioterrorism Act</option>
                <option value="jepang">Jepang - Standar Mutu JAS &amp; MHLW Positive List</option>
                <option value="jerman">Jerman (Uni Eropa) - Regulasi Deforestasi EUDR &amp; CE</option>
                <option value="uea">Uni Emirat Arab (Dubai) - Sertifikasi Halal BPJPH &amp; ESMA</option>
              </select>
            </div>
            <button className="btn btn-primary btn-block" type="button" onClick={runAudit} disabled={auditing}>
              {auditing ? <span>⏳ Mengaudit Database OSS &amp; Bea Cukai...</span> : <span>🔍 Jalankan Audit Kepatuhan Regulasi Global</span>}
            </button>
          </div>

          <div className="kyc-result-card">
            <div className="krc-header">
              <div>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>Hasil Audit Legalitas &amp; Standar Mutu</strong>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Standar Regulasi: <strong>{reg.standard}</strong></div>
              </div>
              <span className="krc-score">100% LOLOS</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div className="krc-item">
                <span className="krc-icon">✓</span>
                <div>
                  <strong>NIB Pelaku Usaha ({resultKey.nib}):</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#334155' }}>Status OSS Aktif &bull; Hak Akses Kepabeanan Ekspor Terbuka &bull; Skala Usaha Terverifikasi</p>
                </div>
              </div>
              <div className="krc-item">
                <span className="krc-icon">✓</span>
                <div>
                  <strong>NPWP Perusahaan ({resultKey.npwp}):</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#334155' }}>Status Pajak Valid DJP Kemenkeu &bull; Bebas Tunggakan Kepabeanan</p>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
              <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>Deteksi Regulasi Negara Tujuan:</strong>
              {reg.items.map((item) => (
                <div className="krc-item" style={{ marginBottom: '6px' }} key={item}>
                  <span className="krc-icon" style={{ color: '#059669' }}>✓</span>
                  <span style={{ fontSize: '11.5px', color: '#334155' }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '10px 14px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#065f46' }}>🏆 Verified Global Exporter Shield Diterbitkan</span>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 800 }}>SIAP EKSPOR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Tab 4: Escrow Vault 4 Fase
// =====================================================================
function EscrowTab() {
  const { lang } = useApp();
  const [phase, setPhase] = useState(1);
  const [vaultStatus, setVaultStatus] = useState('VAULT AKTIF');
  const [chat, setChat] = useState([
    {
      sender: 'agent',
      header: 'Smart Contract Live System',
      html: 'Selamat datang di Simulasi Escrow Vault NusaBridge. Sistem ini mengamankan pembayaran ekspor bernilai tinggi agar UMKM tidak menanggung risiko gagal bayar buyer luar negeri. Klik salah satu tombol 4 Fase di sebelah kiri untuk menguji notifikasi pencairan bertahap.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const boxRef = useRef(null);

  function scrollBottom() {
    requestAnimationFrame(() => {
      if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
    });
  }

  function pushAgent(html, header) {
    setChat((prev) => [...prev, { sender: 'agent', header, html }]);
    scrollBottom();
  }

  function selectPhase(p) {
    setPhase(p);
    const data = PHASE_NOTIFICATIONS[p];
    if (!data) return;
    setVaultStatus(`PROGRES VAULT: ${data.pct}`);
    pushAgent(
      `<div style="font-weight:750; color:#34d399; margin-bottom:4px;">${data.title}</div>
      <p style="margin:0 0 6px;">${data.msg}</p>
      <div style="font-size:11px; color:#94a3b8; border-top:1px solid #334155; padding-top:4px;">
        Pencairan Dana: <strong style="color:#ffffff;">${data.amount}</strong> &bull; Total Progres: <strong style="color:#34d399;">${data.pct}</strong><br>
        Hash Smart Contract: <code>${data.hash}</code>
      </div>`,
      `NOTIFIKASI ESCROW VAULT - ${data.tag}`
    );
  }

  async function handleSend() {
    const text = (chatInput || '').trim();
    if (!text) return;
    setChat((prev) => [...prev, { sender: 'user', html: text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }]);
    setChatInput('');
    scrollBottom();

    const lower = text.toLowerCase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, apiKey: localStorage.getItem('nb_gemini_api_key') || '', lang }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          pushAgent(data.reply.replace(/\n/g, '<br>'), 'NusaBridge AI');
          return;
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      // Backend offline -> rule engine cerdas lokal
    }

    setTimeout(() => {
      let reply;
      if (lower.includes('hamburg') || (lower.includes('robusta') && (lower.includes('cif') || lower.includes('kopi')))) {
        reply = `Halo Hanseatic Coffee Importers! Terima kasih telah menggunakan NusaBridge. Berikut adalah analisis transaksi ekspor Kopi Robusta Lampung Anda:<br><br>
📊 <strong>1. Kalkulasi RFQ Studio (Pilar 1)</strong><br>
Harga Dasar FOB Tanjung Priok: $3.85 / Kg ($77,000 USD)<br>
Ocean Freight &amp; Asuransi Kargo: $0.42 / Kg ($8,400 USD)<br>
Total Penawaran CIF Hamburg: <strong>$85,400 USD</strong> ($4.27 / Kg)<br>
Margin Aman UMKM: <strong>+18.5% Net Profit</strong><br><br>
🛡️ <strong>2. Audit Legalitas &amp; KYC Hub (Pilar 3)</strong><br>
NIB Pelaku Usaha: Valid &amp; Aktif Ekspor<br>
Sertifikasi Saniter: Phytosanitary &amp; Karantina Lolos (Bebas Hama Organisme)<br>
Skor Kepatuhan: <strong>100% Score (Verified Seller Shield)</strong><br><br>
📄 <strong>3. Otomatisasi Dokumen Legal (Pilar 2)</strong><br>
Commercial Invoice #INV-2026-DE-088 dan Sales Contract (CIF Hamburg) telah secara otomatis diterbitkan berformat PDF.<br><br>
🔒 <strong>4. Skema Escrow Vault (Pilar 4)</strong><br>
Pembayaran sebesar $85,400 USD akan dikunci secara aman di Escrow Vault dan dicairkan secara bertahap:<br>
• <strong>Tahap 1 (30% - $25,620)</strong>: DP Cair saat Kontrak Ditandatangani.<br>
• <strong>Tahap 2 (30% - $25,620)</strong>: Cair saat Dokumen PEB &amp; Stuffing Container Selesai.<br>
• <strong>Tahap 3 (20% - $17,080)</strong>: Cair saat Kapal Berlayar &amp; Bill of Lading (B/L) Terbit.<br>
• <strong>Tahap 4 (20% - $17,080)</strong>: Settlement Final saat Kontainer Tiba di Hamburg Port.`;
      } else if (lower.includes('dp') || lower.includes('uang muka') || lower.includes('fase 1')) {
        reply = 'Untuk pencairan 30% Down Payment, buyer wajib menandatangani Sales Contract secara digital dan menyetor 100% dana ke Escrow Vault. Begitu dana terkunci, 30% langsung cair ke rekening UMKM.';
      } else if (lower.includes('peb') || lower.includes('bea cukai')) {
        reply = 'Pencairan Fase 2 (30%) memerlukan nomor pendaftaran PEB yang valid dari sistem CEISA Bea Cukai. AI Agent NusaBridge otomatis memverifikasi status NPE (Nota Pelayanan Ekspor).';
      } else if (lower.includes('kapal') || lower.includes('b/l') || lower.includes('bill of lading')) {
        reply = 'Pencairan Fase 3 (20%) terhubung langsung dengan sensor AIS kapal kargo. Saat kargo dimuat (on-board) dan B/L terbit, sistem langsung membuka kunci dana.';
      } else {
        reply = `Halo! Saya <strong>NusaBridge AI</strong>, asisten B2B perdagangan ekspor-impor pintar untuk UMKM Indonesia.<br><br>
Saya siap mengawal transaksi ekspor Anda dengan <strong>4 Pilar NusaBridge</strong>:<br>
1. <strong>RFQ Studio &amp; Incoterms 2020</strong>: Menghitung estimasi FOB, Ocean Freight, Asuransi maritim, hingga harga CIF dengan margin aman UMKM.<br>
2. <strong>Otomatisasi Dokumen</strong>: Menerbitkan draf berkas resmi Proforma Invoice, Commercial Invoice, dan Export Sales Contract berformat PDF instan.<br>
3. <strong>KYC Hub &amp; Kepatuhan Global</strong>: Memverifikasi NIB, NPWP, Phytosanitary, izin US FDA, sertifikasi JAS Jepang, atau regulasi EUDR Eropa dengan skor 100%.<br>
4. <strong>Escrow Vault Multivalas</strong>: Melindungi dana transaksi dengan pelepasan bertahap 4 fase (30% DP → 30% PEB → 20% Bill of Lading → 20% Pelunasan Akhir).`;
      }
      pushAgent(reply, 'NusaBridge AI');
    }, 350);
  }

  return (
    <div className="ai-tab-pane">
      <div className="sim-wrapper-card">
        <div className="escrow-chat-layout">
          <div className="escrow-triggers-col">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '14.5px', color: 'var(--navy-title)' }}>Simulasi 4 Fase Smart Escrow:</h4>
              <span className="seal-stamp">{vaultStatus}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Klik tombol fase di bawah untuk melihat notifikasi resmi AI Agent dan progres pencairan dana bertahap:
            </p>

            {[
              { n: 1, tag: 'Fase 1 (30% DP Cair)', title: 'Kontrak Disepakati & Escrow Terkunci', sub: 'Pencairan USD 6,000 untuk modal kerja produksi UMKM' },
              { n: 2, tag: 'Fase 2 (30% PEB Cair)', title: 'Pemberitahuan Ekspor Barang (PEB) Terbit', sub: 'Pencairan USD 6,000 saat kargo masuk pelabuhan muat' },
              { n: 3, tag: 'Fase 3 (20% B/L Cair)', title: 'Kapal Berlayar & Bill of Lading On-Board', sub: 'Pencairan USD 4,000 saat kargo resmi dalam pelayaran laut' },
              { n: 4, tag: 'Fase 4 (20% Tiba Final)', title: 'Kargo Tiba di Tujuan & Buyer Konfirmasi', sub: 'Pencairan USD 4,000 sisa pelunasan 100% tuntas' },
            ].map((p) => (
              <button
                key={p.n}
                type="button"
                className={`escrow-btn-phase${phase === p.n ? ' active' : ''}`}
                onClick={() => selectPhase(p.n)}
              >
                <span className="ebp-tag">{p.tag}</span>
                <span className="ebp-title">{p.title}</span>
                <span className="ebp-sub">{p.sub}</span>
              </button>
            ))}
          </div>

          <div className="escrow-chat-box">
            <div className="ecb-header">
              <div>
                <strong style={{ fontSize: '13px' }}>🤖 NusaBridge Escrow AI Agent</strong>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Smart Contract Vault Multivalas (USD/IDR)</div>
              </div>
              <span className="ecb-status">⚡ Live WebSocket Connected</span>
            </div>

            <div className="ecb-messages" ref={boxRef}>
              {chat.map((m, i) => (
                m.sender === 'user' ? (
                  <div key={i} className="ecb-msg" style={{ background: '#2563eb', color: '#ffffff', alignSelf: 'flex-end', borderRadius: '12px', maxWidth: '85%', padding: '9px 13px', fontSize: '12.5px' }} dangerouslySetInnerHTML={{ __html: m.html }} />
                ) : (
                  <div key={i} className="ecb-msg agent">
                    <strong>🤖 {m.header || 'NusaBridge Escrow AI'} &bull; {nowTime()}</strong>
                    {m.html ? <span dangerouslySetInnerHTML={{ __html: m.html }} /> : null}
                  </div>
                )
              ))}
            </div>

            <div className="ecb-footer">
              <input
                type="text"
                className="ecb-input"
                placeholder="Tanyakan status pelepasan dana atau klausul escrow..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              />
              <button className="ecb-send-btn" type="button" onClick={handleSend}>Kirim</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Main page
// =====================================================================
export default function SolutionsPage() {
  const { openAuth } = useApp();
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('tab-rfq');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function goDocGen() {
    setActiveTab('tab-pdf');
  }

  return (
    <>
      {/* ==================== BANNER SOLUSI AI ==================== */}
      <section className="page-hero-banner solusi-hero">
        <div className="site-container">
          <div className="pill-badge pill-blue"><T k="solusi_hero_pill" /></div>
          <h1 className="page-hero-title"><T k="solusi_hero_title" tag="span" /></h1>
          <p className="page-hero-subtitle"><T k="solusi_hero_sub" /></p>
        </div>
      </section>

      {/* ==================== GEMINI CHAT WORKSPACE ==================== */}
      <GeminiWorkspace />

      {/* ==================== 4 PILAR UTAMA ==================== */}
      <PillarsSection />

      {/* ==================== AI SUITE INTERAKTIF ==================== */}
      <section className="section-ai-simulator" id="ai-interactive-suite">
        <div className="site-container">
          <div className="section-header text-center">
            <div className="pill-badge pill-blue">NUSABRIDGE AI SUITE (GTNIC 2026)</div>
            <h2 className="section-title">Studio Operasional Ekspor Berbasis NusaBridge AI</h2>
            <p className="section-subtitle">Uji coba interaktif 4 kemampuan inti AI: Konversi RFQ Incoterms 2020, penerbitan draf berkas PDF resmi, audit legalitas KYC Hub, dan notifikasi 4 fase Escrow Vault.</p>
          </div>

          <div className="ai-tabs-nav">
            {AI_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`ai-tab-btn${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="atb-icon">{t.icon}</span>
                <span className="atb-text">{t.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'tab-rfq' && <RfqTab goDocGen={goDocGen} />}
          {activeTab === 'tab-pdf' && <PdfTab showToast={showToast} />}
          {activeTab === 'tab-kyc' && <KycTab />}
          {activeTab === 'tab-escrow' && <EscrowTab />}
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="section-seller-cta">
        <div className="site-container">
          <div className="seller-cta-box">
            <div className="seller-cta-content">
              <div className="pill-badge pill-translucent-blue">INTEGRASI MUDAH</div>
              <h2 className="seller-cta-title">Siap Membawa Produk Lokal Menuju Pasar Dunia?</h2>
              <p className="seller-cta-sub">
                Bergabunglah bersama ratusan pelaku UMKM yang telah mengotomatisasi dokumen dan menemukan buyer internasional terverifikasi melalui NusaBridge.
              </p>
              <div className="seller-cta-buttons">
                <button className="btn btn-primary btn-lg" type="button" onClick={() => openAuth('register')}>
                  Daftar Akun Sekarang
                </button>
                <Link to="/harga" className="btn btn-glass btn-lg">Lihat Paket &amp; Harga</Link>
              </div>
            </div>
            <div className="seller-cta-visual">
              <div className="badge-card-floating">
                <span className="bcf-icon">✨</span>
                <div className="bcf-text">
                  <strong>98% Waktu Terpangkas</strong>
                  <small>Dari 2 Minggu Jadi 5 Menit</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
