import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import T from '../components/T.jsx';
import { downloadHtmlFile } from '../utils/downloadHtmlFile.js';
import { formatAiText } from '../utils/aiText.js';
import { sendAiChat, getLocalAiReply } from '../utils/chat.js';

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
  briket: 'Inquiry for 1 FCL 20ft (20 MT) Premium Coconut Charcoal Briquettes for hookah CIF Jebel Ali Port Dubai, 10kg master carton, drop test certified.',
  kriya: 'RFQ for 2,000 pcs Handwoven Rattan Chairs FOB Tanjung Priok to Tokyo port, ISPM 15 fumigation standard.',
};

const BUYER_COMMODITY_PRESETS = [
  {
    id: 'kopi-gayo',
    name: 'Kopi Arabika Gayo Specialty Grade 1',
    hsCode: '0901.11.10',
    pol: 'Pelabuhan Belawan, Medan (IDBLW)',
    defaultQty: '20,000 Kg (20 MT / 1 FCL 20ft)',
    packaging: '60 Kg GrainPro Gunny Bags',
    qualitySpec: 'Moisture <12%, Defect <4%, Screen 16/18, Cupping Score >84',
    estFob: 4.25,
  },
  {
    id: 'kopi-robusta',
    name: 'Kopi Robusta Lampung Super Grade 1',
    hsCode: '0901.11.20',
    pol: 'Pelabuhan Panjang / Tanjung Priok',
    defaultQty: '20,000 Kg (20 MT / 1 FCL 20ft)',
    packaging: '60 Kg Jute Gunny Bags',
    qualitySpec: 'Moisture <13%, Defect <8%, Screen 16/18 Clean Sorted',
    estFob: 3.85,
  },
  {
    id: 'cengkeh',
    name: 'Cengkeh Lalpari Maluku Super Clean',
    hsCode: '0907.10.00',
    pol: 'Pelabuhan Tanjung Perak, Surabaya',
    defaultQty: '5,000 Kg (5 MT)',
    packaging: '25 Kg Polypropylene (PP) Double Laminated Bags',
    qualitySpec: 'Handpicked Clean, Moisture <11.5%, Volatile Oil >19%, ASTA Cleanliness Standard',
    estFob: 12.50,
  },
  {
    id: 'briket',
    name: 'Arang Briket Batok Kelapa Premium (Shisha/BBQ)',
    hsCode: '4402.90.10',
    pol: 'Pelabuhan Tanjung Priok, Jakarta',
    defaultQty: '20,000 Kg (20 MT / 1 FCL 20ft)',
    packaging: '1 Kg Inner Box with Brand, 10 Kg Master Corrugated Carton',
    qualitySpec: '100% Coconut Shell, Fixed Carbon >80%, Ash <2.5%, White Ash, Heat >7,200 Kcal',
    estFob: 1.35,
  },
  {
    id: 'nilam',
    name: 'Minyak Atsiri Nilam Murni (Patchouli Oil)',
    hsCode: '3301.29.10',
    pol: 'Pelabuhan Belawan, Medan',
    defaultQty: '2,000 Kg (2 MT)',
    packaging: '200 Kg Epoxy Coated Steel Drums',
    qualitySpec: 'Patchouli Alcohol (PA) >32%, Acid Value <5, 100% Pure Steam Distilled',
    estFob: 55.00,
  },
  {
    id: 'rotan',
    name: 'Kursi Rotan Alami Cirebon (Handwoven Rattan)',
    hsCode: '9401.52.00',
    pol: 'Pelabuhan Tanjung Priok, Jakarta',
    defaultQty: '2,000 Pcs (2 x 40ft High Cube Container)',
    packaging: 'Corrugated Paper Wrapping & Fumigated Wooden Crates',
    qualitySpec: 'Grade A Natural Manau Rattan, Kiln Dried Moisture <12%, ISPM 15 Fumigated',
    estFob: 78.00,
  },
];

const DESTINATION_PORTS = [
  { id: 'hamburg', name: 'Port of Hamburg, Germany (DEHAM)', country: 'Germany', oceanFreightPerUnit: 0.42 },
  { id: 'la', name: 'Port of Los Angeles, USA (USLAX)', country: 'United States', oceanFreightPerUnit: 0.65 },
  { id: 'tokyo', name: 'Tokyo Port, Japan (JPTYO)', country: 'Japan', oceanFreightPerUnit: 0.35 },
  { id: 'dubai', name: 'Port of Jebel Ali, Dubai, UAE (AEJEA)', country: 'United Arab Emirates', oceanFreightPerUnit: 0.28 },
  { id: 'rotterdam', name: 'Port of Rotterdam, Netherlands (NLRTM)', country: 'Netherlands', oceanFreightPerUnit: 0.40 },
  { id: 'singapore', name: 'Port of Singapore (SGSIN)', country: 'Singapore', oceanFreightPerUnit: 0.15 },
];

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

const ROLE_SUGGESTIONS = {
  seller: {
    id: [
      'Apa saja fitur ekspor untuk UMKM di NusaBridge?',
      'Dokumen apa yang dibutuhkan untuk ekspor (Auto-PDF)?',
      'Bagaimana cara validasi NIB di KYC Hub?',
      'Bagaimana alur pencairan dana di Escrow Vault?',
      'Apa perbedaan Incoterms FOB dan CIF?',
      'Apakah saya bisa chat bebas seputar ekspor?',
    ],
    en: [
      'What export features does NusaBridge provide for SMEs?',
      'What documents are generated by Auto-PDF for export?',
      'How do I validate an NIB in KYC Hub?',
      'How does milestone payout work in Escrow Vault?',
      'What is the difference between FOB and CIF?',
      'Can I freely consult on export regulations here?',
    ],
  },
  buyer: {
    id: [
      'Apa saja fitur impor untuk buyer global di NusaBridge?',
      'Bagaimana cara mengajukan RFQ di katalog produk?',
      'Bagaimana proteksi dana saya di Escrow Vault?',
      'Komoditas unggulan apa saja yang tersedia di katalog?',
      'Bagaimana cara verifikasi standar kepatuhan produk?',
      'Apakah saya bisa chat bebas seputar komoditas?',
    ],
    en: [
      'What import features does NusaBridge provide for global buyers?',
      'How do I submit an RFQ from the product catalog?',
      'How are my funds protected in Escrow Vault?',
      'What featured commodities are listed in the catalog?',
      'How do I verify destination compliance standards?',
      'Can I freely consult on commodity sourcing here?',
    ],
  },
  guest: {
    id: [
      'Apakah saya bisa chat bebas di NusaBridge AI untuk ekspor & impor?',
      'Apa perbedaan peran Eksportir (Seller) dan Importir (Buyer)?',
      'Fitur ekspor dan impor apa saja yang ada di website ini?',
      'Bagaimana alur kerja ekspor dan impor di NusaBridge?',
      'Siapa pengembang platform NusaBridge?',
      'Kopi dan rempah apa saja yang tersedia di katalog?',
    ],
    en: [
      'Can I freely chat and consult with NusaBridge AI about export & import?',
      'What is the difference between Exporter and Importer roles?',
      'What export and import features are on this website?',
      'How do export and import workflows operate on NusaBridge?',
      'Who developed the NusaBridge platform?',
      'What coffee and spices are available in the catalog?',
    ],
  },
};

function getSuggestions(role = 'guest', lang = 'id') {
  const normRole = role === 'buyer' || role === 'importer' ? 'buyer' : role === 'seller' ? 'seller' : 'guest';
  const normLang = lang === 'en' ? 'en' : 'id';
  return ROLE_SUGGESTIONS[normRole]?.[normLang] || ROLE_SUGGESTIONS.guest[normLang];
}

const CHAT_SUGGESTIONS = ROLE_SUGGESTIONS.guest;

function createWelcomeMessage(lang, role = 'guest') {
  const isEn = lang === 'en';
  let raw;

  if (role === 'seller') {
    raw = isEn
      ? 'Hi! I am **NusaBridge AI**. You are signed in as an **Indonesian exporter**, so I will focus on business profile, product information, the RFQ flow, document drafts, KYC data, and the Escrow simulation.'
      : 'Halo! Saya **NusaBridge AI**. Anda masuk sebagai **eksportir Indonesia**, jadi saya akan memfokuskan jawaban pada profil usaha, informasi produk, alur RFQ, draf dokumen, data KYC, dan simulasi Escrow.';
  } else if (role === 'buyer') {
    raw = isEn
      ? 'Hi! I am **NusaBridge AI**. You are signed in as a **global importer**, so I will focus on the catalog, product specifications, RFQ submission, Incoterms, documents, and the Escrow simulation.'
      : 'Halo! Saya **NusaBridge AI**. Anda masuk sebagai **importir global**, jadi saya akan memfokuskan jawaban pada katalog, spesifikasi produk, pengajuan RFQ, Incoterms, dokumen, dan simulasi Escrow.';
  } else {
    raw = isEn
      ? 'Hi! I can help explain NusaBridge website features and export workflows. Choose a question below or type your own.'
      : 'Halo! Saya bisa menjelaskan fitur website NusaBridge dan alur ekspor. Pilih pertanyaan di bawah atau ketik pertanyaan Anda sendiri.';
  }

  return {
    sender: 'agent',
    raw,
    label: 'NusaBridge AI',
    time: nowTime(),
    welcome: true,
  };
}

// =====================================================================
// NusaBridge chat workspace
// =====================================================================
function GeminiWorkspace() {
  const { lang, session, t } = useApp();
  const role = session?.role === 'buyer' || session?.role === 'importer'
    ? 'buyer'
    : session?.role === 'seller'
      ? 'seller'
      : 'guest';
  const [msgs, setMsgs] = useState(() => [createWelcomeMessage(lang, role)]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const sendingRef = useRef(false);
  const historyRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdRef = useRef(0);

  function scrollBottom() {
    requestAnimationFrame(() => {
      if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
    });
  }

  function push(sender, raw, label) {
    const id = ++msgIdRef.current;
    const userLabel = session?.role === 'buyer' || session?.role === 'importer'
      ? (lang === 'en' ? 'You (Buyer)' : 'Anda (Buyer)')
      : session?.role === 'seller'
        ? (lang === 'en' ? 'You (Seller)' : 'Anda (Seller)')
        : (lang === 'en' ? 'You (Guest)' : 'Anda (Tamu)');
    setMsgs((prev) => [...prev, {
      id,
      sender,
      raw,
      label: label || (sender === 'user' ? userLabel : 'NusaBridge AI'),
      time: nowTime(),
    }]);
    scrollBottom();
    return id;
  }

  async function processQuery(text) {
    if (!text || !text.trim()) return;
    const promptText = text.trim();

    // Riwayat diambil sebelum pertanyaan baru ditambahkan agar tidak duplikat.
    const history = msgs
      .filter((item) => !item.welcome && ['user', 'agent'].includes(item.sender))
      .slice(-8)
      .map((item) => ({
        role: item.sender === 'agent' ? 'assistant' : 'user',
        content: item.raw,
      }));

    push('user', promptText);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setTyping(true);
    scrollBottom();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const data = await sendAiChat({
        message: promptText,
        lang,
        role: session?.role,
        page: 'solutions',
        history,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setTyping(false);
      push('agent', data.reply, 'NusaBridge AI');
    } catch (e) {
      clearTimeout(timeoutId);
      setTyping(false);
      push(
        'agent',
        getLocalAiReply({ message: promptText, lang, role: session?.role, page: 'solutions' }),
        'NusaBridge AI'
      );
    }
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

  async function handleSuggestedQuestion(question) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      await processQuery(question);
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
                <button
                  className="btn-clear-chat"
                  type="button"
                  title="Bersihkan riwayat percakapan"
                  onClick={() => {
                    setMsgs([createWelcomeMessage(lang, role)]);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>{t('solusi_btn_clear', 'Bersihkan Chat')}</span>
                </button>
              </div>
            </div>

            <div className="gcm-history" ref={historyRef}>
              {msgs.map((m, i) => (
                <div className={`chat-bubble-row ${m.sender === 'user' ? 'user-row' : 'agent-row'}`} key={m.id ?? i}>
                  <div className="cbr-avatar">{m.sender === 'user' ? '🧑‍💼' : '🤖'}</div>
                  <div className="cbr-content">
                    <div className="cbr-header">
                      <span>{m.label}</span>
                      <span>{m.time}</span>
                    </div>
                    {m.sender === 'agent' && !m.welcome && (
                      <div className="cbr-ai-label">
                        <span className="cbr-ai-spark">✦</span>
                        {lang === 'en' ? 'AI Summary' : 'Ringkasan AI'}
                      </div>
                    )}
                    <div className="cbr-text" dangerouslySetInnerHTML={{ __html: formatAiText(m.raw) }} />
                    {m.welcome && msgs.length === 1 && (
                      <div className="chat-suggestions">
                        <div className="chat-suggestions-label">
                          {lang === 'en'
                            ? 'Quick questions — click to see the answer:'
                            : 'Pertanyaan cepat — klik untuk melihat jawabannya:'}
                        </div>
                        {getSuggestions(role, lang).map((question) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => handleSuggestedQuestion(question)}
                            disabled={typing}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
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
              <div className="chat-footer-hint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>
                  {lang === 'en'
                    ? 'Ask about NusaBridge website features, export products, or workflows.'
                    : 'Tanyakan fitur website NusaBridge, produk ekspor, atau alurnya.'}
                </span>
              </div>
              <form className="chat-input-form" onSubmit={handleSend}>
                <textarea
                  ref={inputRef}
                  className="chat-textarea"
                  rows={1}
                  data-i18n-placeholder="solusi_input_ph"
                  placeholder={t('solusi_input_ph', 'Tanyakan fitur website NusaBridge atau alur ekspor-impor...')}
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
// Peran & Kegunaan
// =====================================================================
function RolesSection() {
  const { lang, session, openAuth, t } = useApp();
  const isEn = lang === 'en';
  const activeRole = session?.role === 'buyer' || session?.role === 'importer'
    ? 'buyer'
    : session?.role === 'seller'
      ? 'seller'
      : 'guest';

  const cards = [
    {
      role: 'seller',
      icon: '🌱',
      title: t('role_seller_title', isEn ? 'Indonesian Exporter (Seller)' : 'Eksportir Indonesia (Seller)'),
      desc: t(
        'role_seller_desc',
        isEn
          ? 'For Indonesian SMEs that want to prepare export information and learn the workflow before dealing with overseas buyers.'
          : 'Untuk UMKM Indonesia yang ingin menyiapkan informasi ekspor dan memahami alurnya sebelum berhadapan dengan buyer luar negeri.'
      ),
      features: isEn
        ? [
            'Legal & Regulatory Readiness Check: Simulate NIB/NPWP checks and review destination checklists (FDA, EUDR, JAS, Halal) in KYC Hub.',
            'HPP & Margin Simulation: Estimate FOB/CIF costs and quotation margins in RFQ Studio.',
            'Export Document Drafts: Draft a Proforma Invoice or Sales Contract in Auto-PDF, then review it before use.',
            'Milestone Payout Simulation: Learn the 30% contract, 30% PEB, 20% B/L, and 20% arrival stages in Escrow Vault (not a real transaction).',
          ]
        : [
            'Cek Kesiapan Legalitas: Simulasikan pemeriksaan NIB/NPWP dan tinjau checklist negara tujuan (FDA, EUDR, JAS, Halal) di KYC Hub.',
            'Simulasi HPP & Margin: Perkirakan biaya FOB/CIF dan margin penawaran di RFQ Studio.',
            'Draf Dokumen Ekspor & Impor: Buat draf Proforma Invoice atau Sales Contract di Auto-PDF, lalu tinjau sebelum digunakan.',
            'Simulasi Pencairan Bertahap: Pelajari tahapan 30% kontrak, 30% PEB, 20% B/L, dan 20% tiba di Escrow Vault (bukan transaksi nyata).',
          ],
      cta: t('role_seller_cta', isEn ? 'Register as Exporter' : 'Daftar sebagai Eksportir'),
    },
    {
      role: 'buyer',
      icon: '🌍',
      title: t('role_buyer_title', isEn ? 'Global Importer (Buyer)' : 'Importir Global (Buyer)'),
      desc: t(
        'role_buyer_desc',
        isEn
          ? 'For overseas buyers who want to compare Indonesian products and send a structured quotation request.'
          : 'Untuk buyer luar negeri yang ingin membandingkan produk Indonesia dan mengirim permintaan penawaran yang terstruktur.'
      ),
      features: isEn
        ? [
            'Indonesian Commodity Exploration: Compare coffee, spices, essential oils, briquettes, and rattan products with HS codes, specs, MOQ, and USD reference prices.',
            'Structured RFQ Drafting: Build a quotation request with Incoterms (FOB/CIF/CNF/EXW), quantity, and a destination port.',
            'Destination Compliance Checklist: Review FDA, EUDR, JAS, and Halal checklists in KYC Hub; results are simulations, not official verification.',
            'Escrow Simulation: Learn the four payout stages in Escrow Vault; the website does not process or hold real funds.',
          ]
        : [
            'Eksplorasi Komoditas Nusantara: Bandingkan kopi, rempah, minyak atsiri, briket, dan rotan dengan HS Code, spesifikasi, MOQ, dan harga acuan USD.',
            'Penyusunan RFQ Terstruktur: Susun permintaan penawaran dengan Incoterms (FOB/CIF/CNF/EXW), jumlah, dan pelabuhan tujuan.',
            'Checklist Kepatuhan Tujuan: Tinjau checklist FDA, EUDR, JAS, dan Halal di KYC Hub; hasilnya simulasi, bukan verifikasi resmi.',
            'Simulasi Escrow: Pelajari empat tahap pencairan di Escrow Vault; website tidak memproses atau menyimpan dana sungguhan.',
          ],
      cta: t('role_buyer_cta', isEn ? 'Register as Importer' : 'Daftar sebagai Importir'),
    },
  ];

  return (
    <section className="section-role-usage" id="peran-kegunaan">
      <div className="site-container">
        <div className="section-header text-center">
          <div className="pill-badge pill-blue">{t('role_section_pill', isEn ? 'ROLES & USAGE' : 'PERAN & KEGUNAAN')}</div>
          <h2 className="section-title">
            {t('role_section_title', isEn ? 'Choose the role that matches your needs' : 'Pilih peran yang sesuai kebutuhan Anda')}
          </h2>
          <p className="section-subtitle">
            {t(
              'role_section_sub',
              isEn
                ? 'A NusaBridge account has one role. The role shapes the guidance, language, and form defaults you see.'
                : 'Akun NusaBridge memiliki satu peran. Peran menentukan panduan, bahasa, dan isi awal formulir yang Anda lihat.'
            )}
          </p>
        </div>

        <div className="role-usage-grid">
          {cards.map((card) => {
            const active = activeRole === card.role;
            return (
              <article className={`role-usage-card${active ? ' is-active' : ''}`} key={card.role}>
                <div className="ruc-head">
                  <span className="ruc-icon" aria-hidden="true">{card.icon}</span>
                  <div>
                    <h3 className="ruc-title">{card.title}</h3>
                    {active && (
                      <span className="ruc-active">✓ {isEn ? 'Active role' : 'Peran aktif'}</span>
                    )}
                  </div>
                </div>
                <p className="ruc-desc">{card.desc}</p>
                <ul className="ruc-list">
                  {card.features.map((feature) => (
                    <li key={feature}><span className="ruc-check">✓</span>{feature}</li>
                  ))}
                </ul>
                {session?.loggedIn ? (
                  card.role === 'seller' ? (
                    <a href="#ai-interactive-suite" className="btn btn-primary btn-block">
                      {isEn ? 'Try RFQ & Document Suite' : 'Coba Studio RFQ & Dokumen'}
                    </a>
                  ) : (
                    <Link to="/produk" className="btn btn-outline btn-block">
                      {isEn ? 'Explore Verified Catalog' : 'Eksplorasi Katalog Komoditas Impor'}
                    </Link>
                  )
                ) : (
                  <button
                    className={`btn ${card.role === 'seller' ? 'btn-primary' : 'btn-outline'} btn-block`}
                    type="button"
                    onClick={() => openAuth('register', { role: card.role })}
                  >
                    {card.cta}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <p className="role-usage-note">
          {t(
            'role_usage_note',
            isEn
              ? 'The role currently affects guidance and form defaults. A seller dashboard, automatic product upload, and real-time negotiation are not available in this version.'
              : 'Saat ini peran memengaruhi panduan dan isi awal formulir. Dashboard seller, unggah produk otomatis, dan negosiasi real-time belum tersedia di versi ini.'
          )}
        </p>
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
            <h2 className="pillar-title">Otomatisasi Dokumen Ekspor & Impor Resmi</h2>
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
// Tab 1: RFQ Studio (Mode Eksportir & Mode Importir)
// =====================================================================
function computeRfq(textLower) {
  let commodity = 'Kopi Robusta Lampung Grade 1';
  let hsCode = '0901.11.20';
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
  } else if (textLower.includes('briket') || textLower.includes('charcoal') || textLower.includes('dubai') || textLower.includes('jebel ali')) {
    commodity = 'Arang Briket Batok Kelapa Premium';
    hsCode = '4402.90.10';
    pol = 'Pelabuhan Tanjung Priok, Jakarta';
    pod = 'Port of Jebel Ali, Dubai, UAE';
    incoterm = 'CIF Dubai (Incoterms 2020)';
    qty = '20,000 Kg (20 MT)';
    fobPrice = 1.35;
    freightInsurance = 0.28;
  } else if (textLower.includes('nilam') || textLower.includes('patchouli') || textLower.includes('rotterdam')) {
    commodity = 'Minyak Atsiri Nilam Murni (Patchouli Oil)';
    hsCode = '3301.29.10';
    pol = 'Pelabuhan Belawan, Medan';
    pod = 'Port of Rotterdam, Netherlands';
    incoterm = 'CIF Rotterdam (Incoterms 2020)';
    qty = '2,000 Kg (2 MT)';
    fobPrice = 55.0;
    freightInsurance = 2.40;
  } else if (textLower.includes('rattan') || textLower.includes('rotan') || textLower.includes('tokyo') || textLower.includes('kursi')) {
    commodity = 'Kursi Rotan Alami Cirebon';
    hsCode = '9401.52.00';
    pol = 'Pelabuhan Tanjung Priok, Jakarta';
    pod = 'Tokyo Port, Japan';
    incoterm = 'FOB Tanjung Priok (Incoterms 2020)';
    qty = '2,000 Pcs (2 x 40ft High Cube)';
    fobPrice = 78.0;
    freightInsurance = 0.0;
  } else if (textLower.includes('arabika') || textLower.includes('gayo')) {
    commodity = 'Kopi Arabika Gayo Specialty Grade 1';
    hsCode = '0901.11.10';
    pol = 'Pelabuhan Belawan, Medan';
    pod = 'Port of Hamburg, Germany';
    incoterm = 'CIF Hamburg (Incoterms 2020)';
    qty = '20,000 Kg (20 MT)';
    fobPrice = 4.25;
    freightInsurance = 0.45;
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
  const { session, lang, showToast } = useApp();
  const isEn = lang === 'en';

  // Toggle Mode Peran di RFQ Studio
  const [rfqMode, setRfqMode] = useState(
    session?.role === 'buyer' || session?.role === 'importer' ? 'buyer' : 'seller'
  );

  // State Mode Eksportir (Seller)
  const [rawInput, setRawInput] = useState(SAMPLE_BUYER_TEXTS.kopi);
  const [converting, setConverting] = useState(false);
  const [resultText, setResultText] = useState(SAMPLE_BUYER_TEXTS.kopi);

  // State Mode Importir (Buyer)
  const [buyerCommodityId, setBuyerCommodityId] = useState('kopi-gayo');
  const [buyerPortId, setBuyerPortId] = useState('hamburg');
  const [buyerIncoterm, setBuyerIncoterm] = useState('CIF');
  const [buyerQty, setBuyerQty] = useState('20,000 Kg (20 MT / 1 FCL 20ft)');
  const [buyerCompany, setBuyerCompany] = useState(session?.company || 'Hanseatic Trade Partners GmbH');
  const [buyerNotes, setBuyerNotes] = useState('Requires Sucofindo/SGS inspection Certificate of Analysis, Food Grade packaging, shipment within 30 days.');
  const [buyerGeneratedText, setBuyerGeneratedText] = useState('');

  const rfq = useMemo(() => computeRfq(resultText.toLowerCase()), [resultText]);

  const selectedCommodity = useMemo(
    () => BUYER_COMMODITY_PRESETS.find((c) => c.id === buyerCommodityId) || BUYER_COMMODITY_PRESETS[0],
    [buyerCommodityId]
  );

  const selectedPort = useMemo(
    () => DESTINATION_PORTS.find((p) => p.id === buyerPortId) || DESTINATION_PORTS[0],
    [buyerPortId]
  );

  function handleConvert() {
    setConverting(true);
    setTimeout(() => {
      setResultText(rawInput);
      setConverting(false);
    }, 350);
  }

  function handleBuildBuyerRfq() {
    const refCode = `RFQ-2026-${selectedPort.country.slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const termStr = `${buyerIncoterm} ${selectedPort.name} (Incoterms 2020)`;
    const inquiry = `[OFFICIAL TRADE INQUIRY & RFQ]
Reference: #${refCode}
Buyer: ${buyerCompany} (${selectedPort.country})
Target Commodity: ${selectedCommodity.name} (HS Code: ${selectedCommodity.hsCode})
Requested Quantity: ${buyerQty}
Trade Term: ${termStr}
Port of Loading: ${selectedCommodity.pol}
Quality Specs: ${selectedCommodity.qualitySpec}
Packaging Standard: ${selectedCommodity.packaging}
Notes & Requirements: ${buyerNotes}
Settlement Terms: 100% Escrow Vault Protection with 4 Milestones (30% DP, 30% PEB, 20% BL, 20% Port Arrival).`;

    setBuyerGeneratedText(inquiry);
  }

  function handleCopyBuyerRfq() {
    if (!buyerGeneratedText) return;
    navigator.clipboard.writeText(buyerGeneratedText).then(() => {
      if (showToast) {
        showToast('📋 Dokumen RFQ resmi berhasil disalin ke clipboard!');
      } else {
        window.alert('Dokumen RFQ resmi berhasil disalin!');
      }
    });
  }

  function handleTransferToSeller() {
    if (!buyerGeneratedText) handleBuildBuyerRfq();
    const textToTransfer = buyerGeneratedText || `Looking for ${buyerQty} ${selectedCommodity.name} ${buyerIncoterm} ${selectedPort.name}, packaging ${selectedCommodity.packaging}.`;
    setRawInput(textToTransfer);
    setResultText(textToTransfer);
    setRfqMode('seller');
    if (showToast) {
      showToast('⚡ RFQ berhasil dialihkan ke Mode Eksportir untuk kalkulasi HPP!');
    }
  }

  return (
    <div className="ai-tab-pane active">
      <div className="sim-wrapper-card">

        {/* Mode Switcher: Eksportir vs Importir */}
        <div className="rfq-mode-bar">
          <button
            type="button"
            className={`rfq-mode-btn${rfqMode === 'seller' ? ' active' : ''}`}
            onClick={() => setRfqMode('seller')}
          >
            <span>🌱</span>
            <span>{isEn ? 'Exporter Mode: Analyze Buyer Inquiry & Calculate Quotation' : 'Mode Eksportir: Analisis Pesan Buyer & Hitung HPP Penawaran'}</span>
            <span className="rfq-mode-badge">{isEn ? 'Seller' : 'Eksportir'}</span>
          </button>
          <button
            type="button"
            className={`rfq-mode-btn${rfqMode === 'buyer' ? ' active' : ''}`}
            onClick={() => {
              setRfqMode('buyer');
              if (!buyerGeneratedText) handleBuildBuyerRfq();
            }}
          >
            <span>🌍</span>
            <span>{isEn ? 'Importer Mode: Official RFQ & Inquiry Builder' : 'Mode Importir: Penyusun RFQ & Inquiry Resmi'}</span>
            <span className="rfq-mode-badge">{isEn ? 'Buyer' : 'Importir'}</span>
          </button>
        </div>

        {/* ==================== KONTEN MODE EKSPORTIR (SELLER) ==================== */}
        {rfqMode === 'seller' && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-title)' }}>
                {isEn ? 'Informal Buyer Message / Inquiry from Overseas:' : 'Pesan / Permintaan Informal dari Buyer Luar Negeri:'}
              </label>
              <div className="rfq-sample-chips">
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isEn ? 'Quick Samples:' : 'Contoh Cepat:'}</span>
                {Object.entries(SAMPLE_BUYER_TEXTS).map(([key, text]) => (
                  <button
                    key={key}
                    type="button"
                    className="rfq-sample-btn"
                    onClick={() => { setRawInput(text); setResultText(text); }}
                  >
                    {key === 'kopi'
                      ? 'Kopi Robusta (Hamburg, DE)'
                      : key === 'rempah'
                        ? 'Cengkeh (Los Angeles, US)'
                        : key === 'briket'
                          ? 'Briket Kelapa (Dubai, AE)'
                          : 'Kursi Rotan (Tokyo, JP)'}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="rfq-input-area"
              placeholder={isEn ? 'Paste buyer inquiry message here (e.g., Looking for 20 MT Robusta green beans CIF Hamburg port, packaging 60kg gunny bags)...' : 'Masukkan pesan chat/email dari buyer luar negeri (cth: Looking for 20 MT Robusta green beans CIF Hamburg port, packaging 60kg gunny bags)...'}
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
        )}

        {/* ==================== KONTEN MODE IMPORTIR (BUYER) ==================== */}
        {rfqMode === 'buyer' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: 'var(--navy-title)' }}>
                {isEn ? 'Structured RFQ & Inquiry Builder (For Global Importers):' : 'Penyusun RFQ & Dokumen Inquiry Resmi (Untuk Importir Global):'}
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {isEn
                  ? 'Select commodity, destination port, volume, and trade terms to generate a standardized international inquiry.'
                  : 'Pilih komoditas unggulan Indonesia, pelabuhan tujuan, volume, dan klausul Incoterms untuk menerbitkan dokumen penawaran resmi.'}
              </p>
            </div>

            <div className="rfq-buyer-grid">
              <div className="rfq-field-group">
                <label>Pilihan Komoditas Ekspor Indonesia:</label>
                <select
                  className="custom-select"
                  value={buyerCommodityId}
                  onChange={(e) => {
                    setBuyerCommodityId(e.target.value);
                    const comm = BUYER_COMMODITY_PRESETS.find((c) => c.id === e.target.value);
                    if (comm) setBuyerQty(comm.defaultQty);
                  }}
                >
                  {BUYER_COMMODITY_PRESETS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} &bull; HS {c.hsCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rfq-field-group">
                <label>Pelabuhan Tujuan Bongkar (Port of Discharge):</label>
                <select
                  className="custom-select"
                  value={buyerPortId}
                  onChange={(e) => setBuyerPortId(e.target.value)}
                >
                  {DESTINATION_PORTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rfq-field-group">
                <label>Klausul Ketentuan Perdagangan (Incoterms 2020):</label>
                <select
                  className="custom-select"
                  value={buyerIncoterm}
                  onChange={(e) => setBuyerIncoterm(e.target.value)}
                >
                  <option value="CIF">CIF (Cost, Insurance &amp; Freight) - Penjual tanggung kirim &amp; asuransi ke pelabuhan tujuan</option>
                  <option value="FOB">FOB (Free On Board) - Penjual tanggung barang sampai di atas kapal pelabuhan muat Indonesia</option>
                </select>
              </div>

              <div className="rfq-field-group">
                <label>Target Kuantitas / Volume Pengapalan:</label>
                <input
                  type="text"
                  className="custom-input"
                  value={buyerQty}
                  onChange={(e) => setBuyerQty(e.target.value)}
                  placeholder="Contoh: 20,000 Kg (20 MT / 1 FCL 20ft)"
                />
              </div>

              <div className="rfq-field-group">
                <label>Nama Perusahaan Importir (Buyer Company):</label>
                <input
                  type="text"
                  className="custom-input"
                  value={buyerCompany}
                  onChange={(e) => setBuyerCompany(e.target.value)}
                  placeholder="Nama perusahaan Anda"
                />
              </div>

              <div className="rfq-field-group">
                <label>Spesifikasi Mutu &amp; Standar Kemasan:</label>
                <input
                  type="text"
                  className="custom-input"
                  value={selectedCommodity.qualitySpec}
                  readOnly
                  style={{ background: '#f8fafc', color: '#475569' }}
                />
              </div>
            </div>

            <div className="rfq-field-group" style={{ marginBottom: '18px' }}>
              <label>Catatan Tambahan, Sertifikasi, &amp; Syarat Dokumen Pengapalan:</label>
              <textarea
                className="custom-input"
                rows={2}
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="Misal: Perlu sertifikasi Sucofindo, Certificate of Origin (COO), karantina bebas serangga..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" type="button" onClick={handleBuildBuyerRfq}>
                ✨ Terbitkan Draf Dokumen RFQ Resmi
              </button>
            </div>

            {buyerGeneratedText && (
              <div className="rfq-generated-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                  <div>
                    <strong style={{ color: '#38bdf8', fontSize: '14px' }}>📄 Formal Request for Quotation (RFQ) Dokumen Siap Kirim</strong>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Standar Incoterms 2020 &bull; Siap dikirim ke Eksportir Indonesia</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline btn-sm" type="button" style={{ borderColor: '#64748b', color: '#e2e8f0' }} onClick={handleCopyBuyerRfq}>
                      📋 Salin RFQ
                    </button>
                    <button className="btn btn-primary btn-sm" type="button" onClick={handleTransferToSeller}>
                      ⚡ Simulasikan di Mode Eksportir (HPP &amp; Margin) →
                    </button>
                  </div>
                </div>

                <pre className="rfq-preview-pre">{buyerGeneratedText}</pre>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', fontSize: '11.5px', color: '#94a3b8' }}>
                  <span>🛡️ Pembayaran terlindungi di <strong>NusaBridge Escrow Vault</strong> multi-valas berjenjang 4 fase.</span>
                  <Link to="/produk" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'underline' }}>
                    Lihat Katalog Produk Terkait →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

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
  const { lang, session } = useApp();
  const [phase, setPhase] = useState(1);
  const [vaultStatus, setVaultStatus] = useState('VAULT AKTIF');
  const [chat, setChat] = useState([
    {
      sender: 'agent',
      header: 'Smart Contract Simulation',
      text: lang === 'en'
        ? 'Welcome to the NusaBridge Escrow Vault simulation. This sandbox shows how milestone-based payouts work. Click one of the four phase buttons on the left to see the simulated release notification.'
        : 'Selamat datang di Simulasi Escrow Vault NusaBridge. Sandbox ini menunjukkan cara kerja pencairan dana bertahap. Klik salah satu tombol 4 Fase di sebelah kiri untuk melihat notifikasi pencairan simulasi.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const boxRef = useRef(null);

  function scrollBottom() {
    requestAnimationFrame(() => {
      if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
    });
  }

  function pushAgent(text, header) {
    setChat((prev) => [...prev, { sender: 'agent', header, text }]);
    scrollBottom();
  }

  function selectPhase(p) {
    setPhase(p);
    const data = PHASE_NOTIFICATIONS[p];
    if (!data) return;
    setVaultStatus(`PROGRES VAULT: ${data.pct}`);
    pushAgent(
      `**${data.title}**\n\n${data.msg}\n\n---\nPencairan Dana: **${data.amount}** · Total Progres: **${data.pct}**\nHash Smart Contract: ${data.hash}`,
      `NOTIFIKASI ESCROW VAULT - ${data.tag}`
    );
  }

  async function handleSend() {
    const text = (chatInput || '').trim();
    if (!text || sending) return;

    const history = chat
      .filter((item) => item.text)
      .slice(-8)
      .map((item) => ({
        role: item.sender === 'agent' ? 'assistant' : 'user',
        content: item.text,
      }));

    setChat((prev) => [...prev, { sender: 'user', text }]);
    setChatInput('');
    setSending(true);
    scrollBottom();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const data = await sendAiChat({
        message: text,
        lang,
        role: session?.role,
        page: 'escrow',
        history,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      pushAgent(data.reply, 'NusaBridge AI');
    } catch (e) {
      clearTimeout(timeoutId);
      pushAgent(
        getLocalAiReply({ message: text, lang, role: session?.role, page: 'escrow' }),
        'NusaBridge AI'
      );
    } finally {
      setSending(false);
    }
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
              <span className="ecb-status">{lang === 'en' ? '● Local simulation' : '● Simulasi lokal'}</span>
            </div>

            <div className="ecb-messages" ref={boxRef}>
              {chat.map((m, i) => (
                m.sender === 'user' ? (
                  <div key={i} className="ecb-msg" style={{ background: '#2563eb', color: '#ffffff', alignSelf: 'flex-end', borderRadius: '12px', maxWidth: '85%', padding: '9px 13px', fontSize: '12.5px' }}>{m.text}</div>
                ) : (
                  <div key={i} className="ecb-msg agent">
                    <strong>🤖 {m.header || 'NusaBridge Escrow AI'} &bull; {nowTime()}</strong>
                    {m.text ? <span dangerouslySetInnerHTML={{ __html: formatAiText(m.text) }} /> : null}
                  </div>
                )
              ))}
            </div>

            <div className="ecb-footer">
              <input
                type="text"
                className="ecb-input"
                placeholder={lang === 'en' ? 'Ask about escrow milestones or clauses...' : 'Tanyakan tahap escrow atau klausulnya...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                disabled={sending}
              />
              <button className="ecb-send-btn" type="button" onClick={handleSend} disabled={sending}>
                {sending ? (lang === 'en' ? 'Sending…' : 'Mengirim…') : (lang === 'en' ? 'Send' : 'Kirim')}
              </button>
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
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('tab-rfq');

  // Deep link dari navbar: /solusi#rfq-studio dan /solusi#dokumen
  useEffect(() => {
    const hash = (location.hash || '').replace('#', '').toLowerCase();
    if (hash === 'rfq-studio') setActiveTab('tab-rfq');
    if (hash === 'dokumen' || hash === 'pdf' || hash === 'documents') setActiveTab('tab-pdf');
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    requestAnimationFrame(() => {
      const el =
        document.getElementById(hash) ||
        document.getElementById('ai-interactive-suite');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

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

      {/* ==================== PERAN & KEGUNAAN ==================== */}
      <RolesSection />

      {/* ==================== AI SUITE INTERAKTIF ==================== */}
      <section className="section-ai-simulator" id="ai-interactive-suite">
        <div className="site-container">
          <div className="section-header text-center">
            <div className="pill-badge pill-blue">NUSABRIDGE AI SUITE</div>
            <h2 className="section-title">Studio Operasional Ekspor Berbasis NusaBridge AI</h2>
            <p className="section-subtitle">Uji coba interaktif 4 kemampuan inti AI: Konversi RFQ Incoterms 2020, penerbitan draf berkas PDF resmi, audit legalitas KYC Hub, dan notifikasi 4 fase Escrow Vault.</p>
          </div>

          <span id="rfq-studio" className="section-anchor" aria-hidden="true" />
          <span id="dokumen" className="section-anchor" aria-hidden="true" />
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
