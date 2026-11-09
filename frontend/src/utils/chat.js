/**
 * ==========================================================================
 * NUSABRIDGE - FRONTEND AI CLIENT
 * File: utils/chat.js
 *
 * Satu jalur untuk memanggil /api/ai/chat dan satu fallback lokal yang tetap
 * menjawab pertanyaan tentang website saat backend/API tidak tersedia.
 * ==========================================================================
 */

import { apiUrl } from './api.js';
import { PRODUCTS_DATA } from '../data/products.js';
import { findLocalReferenceAnswer } from './referenceAnswers.js';
import {
  localizeProduct,
  localizeProductName,
  localizeProductDesc,
  localizeOrigin,
} from '../data/productTranslations.js';

const CATEGORY_LABELS = {
  kopi: { id: 'Kopi', en: 'Coffee' },
  rempah: { id: 'Rempah & Hasil Alam', en: 'Spices & Natural Products' },
  kriya: { id: 'Kriya & Kerajinan', en: 'Crafts & Handicrafts' },
  tekstil: { id: 'Tekstil & Wastra', en: 'Textiles & Wastra' },
};

const ROLE_INFO = {
  seller: {
    id: 'Eksportir Indonesia (seller)',
    en: 'Indonesian exporter (seller)',
    focusId: 'profil usaha, informasi produk, alur RFQ, draf dokumen, data KYC, dan simulasi Escrow',
    focusEn: 'business profile, product information, RFQ flow, document drafts, KYC data, and the Escrow simulation',
  },
  buyer: {
    id: 'Importir global (buyer)',
    en: 'Global importer (buyer)',
    focusId: 'katalog, spesifikasi produk, pengajuan RFQ, Incoterms dan dokumen, serta simulasi Escrow',
    focusEn: 'the catalog, product specifications, RFQ submission, Incoterms and documents, and the Escrow simulation',
  },
  guest: {
    id: 'Pengunjung',
    en: 'Guest',
    focusId: 'menjelajah katalog dan bertanya tentang fitur website sebelum membuat akun',
    focusEn: 'browsing the catalog and asking about website features before creating an account',
  },
};

const OFF_TOPIC_PATTERNS = [
  { re: /(\b\d+[\s]*[\+\-\*\/\^xX\:]+[\s]*\d+\b|\b(hitung|kalkulator|aljabar|integral|turunan|persamaan kuadrat|geometri|trigonometri|kalkulus|rumus fisika|rumus kimia|rumus matematika)\b)/i },
  {
    re: /\b(resep|masakan|cara masak|cara membuat (?:kue|roti|donat|makanan|minuman|jus|sup|soto|bakso|mie|nasi)|cara bikin (?:kue|roti|donat|makanan|minuman|jus|sup|soto|bakso|mie|nasi)|bumbu (?:rendang|dapur|masak|opor|balado)|nasi goreng|mie goreng|memasak|baking|resep makanan|kuliner|recipe|recipes|cooking|fried rice|noodle|soup|bake|cake|pastry|cuisine)\b/i,
    allowIf: /\b(nusabridge|website|katalog|produk|komoditas|ekspor|impor)\b/i,
  },
  { re: /\b(coding|koding|pemrograman|program komputer|javascript|typescript|python|java|c\+\+|golang|rust|react|vue|angular|node js|php|sql|html|css|algoritma|debug|source code|buatkan kode|buatkan script|buatkan program|bikin aplikasi|syntax)\b/i },
  { re: /\b(film|movie|bioskop|aktor|aktris|artis|selebriti|lagu|musik|chord|lirik|drakor|kpop|bts|blackpink|taylor swift|anime|manga|naruto|one piece|game|gaming|mobile legends|free fire|pubg|valorant|playstation|xbox|sepak bola|piala dunia|liga inggris|liga champions|real madrid|barcelona|persib|persebaya|messi|ronaldo|lelucon|cerita lucu|meme|song|singer|lyrics|celebrity|football|world cup|movie star)\b/i },
  { re: /\b(presiden|gubernur|walikota|dpr|pemilu|pilpres|partai|menteri|politik|berita artis|zodiak|ramalan bintang|ramalan jodoh|cuaca hari ini|cuaca besok|gempa|president|prime minister|election|politics|politician|government|weather today|weather tomorrow|earthquake|horoscope)\b/i },
  { re: /\b(agama|ibadah|doa|kitab suci|ustad|pendeta|surat al|surat injil|ayat|khutbah|religion|prayer|bible|quran|sermon|worship)\b/i },
  { re: /\b(puisi|pantun|cerpen|dongeng|curhat|pacar|cinta|jodoh|kucing|anjing|hewan peliharaan|burung|ikan cupang|bumi bulat|bumi datar|langit biru|gravitasi|tata surya|planet (?:mars|jupiter|saturnus|venus)|fotosintesis|dinosaurus|relativitas|kecepatan cahaya|kenapa hujan|kenapa laut asin|umur bumi|ibu kota (?:perancis|prancis|inggris|jepang|amerika|rusia)|siapa penemu|sejarah perang dunia|poem|poetry|short story|relativity|gravity|solar system|photosynthesis|dinosaur|speed of light|why is the sky blue|why is the sea salty|age of the earth|capital of)\b/i },
  {
    re: /\b(obat|penyakit|dokter|rumah sakit|vitamin|fitness|diet|sakit (?:gigi|kepala|perut|pinggang|tenggorokan)|batuk|pilek|flu|demam|pusing|maag|asam lambung|paracetamol|antibiotik|gejala|kanker|stroke|diabetes|tensi darah|kolesterol|medicine|medication|doctor|hospital|disease|headache|fever|cough|sick|pain|symptom|cancer|blood pressure|cholesterol)\b/i,
    allowIf: /\b(nusabridge|website|katalog|produk|komoditas)\b/i,
  },
  { re: /\b(buatkan (?:makalah|skripsi|tesis|puisi|pantun|cerpen|rangkuman)|kerjakan pr|tugas sekolah|jawaban lks)\b/i },
  { re: /\b(crypto|cryptocurrency|bitcoin|ethereum|trading forex|saham gorengan|slot online|slot gacor|judi|pinjol|pinjaman online)\b/i },
];

const GENERAL_AI_PATTERN = /\b(apa itu ai|what is ai|cara kerja ai|how does ai work|machine learning|deep learning|neural network|llm|kecerdasan buatan|model ai|transformer)\b/i;
const WEBSITE_ALLOW_PATTERN = /\b(nusabridge|website|fitur|asisten|chatbot|halaman)\b/i;

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (['seller', 'exporter', 'eksportir', 'penjual'].includes(value)) return 'seller';
  if (['buyer', 'importer', 'importir', 'pembeli'].includes(value)) return 'buyer';
  return 'guest';
}

function isGreeting(message) {
  const text = normalize(message);
  if (!text) return false;
  if (/^(apa kabar|how are you|good morning|good afternoon|good evening)[\s!?]*$/.test(text)) return true;
  const words = text.split(' ');
  if (words.length > 5) return false;
  return /^(halo|hallo|hai|hi|hey|hello|selamat pagi|selamat siang|selamat sore|selamat malam|assalamualaikum|salam)[\s!?]*/.test(text);
}

export function detectOffTopic(message) {
  const text = normalize(message);
  if (!text) return false;

  if (GENERAL_AI_PATTERN.test(text) && !WEBSITE_ALLOW_PATTERN.test(text)) return true;

  for (const group of OFF_TOPIC_PATTERNS) {
    if (!group.re.test(text)) continue;
    if (group.allowIf && group.allowIf.test(text)) continue;
    return true;
  }
  return false;
}

// Cocokkan kata utuh agar kata umum tidak salah cocok dengan potongan nama
// produk/daerah (misalnya "itu" di dalam "Belitung").
function containsTerm(haystack, term) {
  if (!term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'u').test(haystack);
}

function findProducts(message) {
  const qLower = String(message || '').toLowerCase();
  const stopwords = [
    'dan', 'yang', 'untuk', 'dengan', 'dari', 'bisa', 'tolong', 'halo', 'info',
    'harga', 'berapa', 'apakah', 'jual', 'kami', 'saya', 'ekspor', 'impor',
    'mau', 'ingin', 'kirim', 'buatkan', 'spesifikasi', 'spek', 'ada', 'cari',
    'tentang', 'produk', 'komoditas', 'katalog', 'detail', 'jelaskan', 'apa',
    'bagaimana', 'contoh', 'tersedia', 'punya', 'menjual', 'jualan',
  ];
  const keywords = qLower
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !stopwords.includes(word));

  if (!keywords.length && qLower.length < 3) return [];

  return PRODUCTS_DATA
    .map((product) => {
      let score = 0;
      const name = String(product.name || '').toLowerCase();
      const nameEn = String(localizeProductName(product, 'en') || '').toLowerCase();
      const category = String(product.category || '').toLowerCase();
      const origin = String(product.origin || '').toLowerCase();
      const originEn = String(localizeOrigin(product.origin, 'en') || '').toLowerCase();
      const desc = String(product.desc || '').toLowerCase();
      const descEn = String(localizeProductDesc(product, 'en') || '').toLowerCase();

      if (qLower.length >= 3 && name.includes(qLower)) score += 60;
      if (qLower.length >= 3 && nameEn.includes(qLower)) score += 60;
      if (qLower.length >= 3 && category.includes(qLower)) score += 20;
      keywords.forEach((keyword) => {
        if (containsTerm(name, keyword)) score += 15;
        if (containsTerm(nameEn, keyword)) score += 15;
        if (containsTerm(category, keyword)) score += 8;
        if (containsTerm(origin, keyword)) score += 8;
        if (containsTerm(originEn, keyword)) score += 8;
        if (containsTerm(desc, keyword)) score += 3;
        if (containsTerm(descEn, keyword)) score += 3;
      });
      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.product);
}

function isGenericCategoryQuery(text) {
  return /^(apa itu|what is|what are|tell me about|jelaskan|explain)\s+(kopi|coffee|rempah|spice|kriya|kerajinan|craft|tekstil|wastra|textile)$/.test(text);
}

function isProductListQuery(text) {
  const listMarker = /(sebutkan|tampilkan|berikan|tunjukkan|list|daftar|contoh|apa\s*saja|apa\s*aja|macam|jenis|pilihan|tersedia|jual\s*apa|ada\s*apa|berapa|total|jumlah|banyak|count)/i.test(text);
  const productWord = /(produk|komoditas|katalog|koleksi)/i.test(text);
  const categoryWord = /(kopi|rempah|kriya|kerajinan|tekstil|wastra)/i.test(text);
  return (productWord && listMarker) || (categoryWord && listMarker && !/(harga|spesifikasi|spek|moq|detail|sertifikat|asal|hs)/i.test(text));
}

function categoryFromText(text) {
  if (/(kopi|coffee)/i.test(text)) return 'kopi';
  if (/(rempah|bumbu|spice|cengkeh|lada|pala|vanila|kayu manis|nilam)/i.test(text)) return 'rempah';
  if (/(kriya|kerajinan|mebel|rotan|bambu|ukiran kayu|kayu jati|gerabah|craft)/i.test(text)) return 'kriya';
  if (/(tekstil|wastra|batik|tenun|songket|textile)/i.test(text)) return 'tekstil';
  return null;
}

function categoriesFromText(text) {
  const found = [];
  if (/(kopi|coffee)/i.test(text)) found.push('kopi');
  if (/(rempah|bumbu|spice|cengkeh|lada|pala|vanila|kayu manis|nilam)/i.test(text)) found.push('rempah');
  if (/(kriya|kerajinan|mebel|rotan|bambu|ukiran kayu|kayu jati|gerabah|craft)/i.test(text)) found.push('kriya');
  if (/(tekstil|wastra|batik|tenun|songket|textile)/i.test(text)) found.push('tekstil');
  return found;
}

function shortName(product, lang = 'id') {
  return String(localizeProductName(product, lang) || 'Produk').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function catalogReply(text, lang) {
  const isEn = lang === 'en';
  const categories = categoriesFromText(text);
  const category = categories[0] || null;
  const countMatch = text.match(/(\d+)\s*(produk|komoditas|item|buah|jenis|macam)/i);
  const requested = countMatch ? Math.max(1, parseInt(countMatch[1], 10)) : 5;

  if (categories.length > 1) {
    const sections = categories.map((key) => {
      const pool = PRODUCTS_DATA.filter((product) => product.category === key);
      const picked = pool.slice(0, Math.min(requested, 20));
      const label = CATEGORY_LABELS[key]?.[isEn ? 'en' : 'id'] || key;
      const lines = picked.map((product, index) =>
        `${index + 1}. **${shortName(product, lang)}** — ${localizeOrigin(product.origin, lang)} · USD ${Number(product.price).toFixed(2)}/${product.unit} · MOQ ${Number(product.moq).toLocaleString(isEn ? 'en-US' : 'id-ID')} ${product.unit} · HS ${product.hsCode}`
      ).join('\n');
      return `${isEn ? `**${label}** — ${pool.length} products:` : `**${label}** — ${pool.length} produk:`}\n${lines}`;
    }).join('\n\n');

    return isEn
      ? `The catalog has products in the requested categories:\n\n${sections}\n\nOpen the Products page for full specifications and the RFQ form.`
      : `Katalog memiliki produk dalam kategori yang Anda tanyakan:\n\n${sections}\n\nBuka halaman Produk untuk spesifikasi lengkap dan formulir RFQ.`;
  }

  if (category) {
    const pool = PRODUCTS_DATA.filter((product) => product.category === category);
    const picked = pool.slice(0, Math.min(requested, 20));
    const label = CATEGORY_LABELS[category]?.[isEn ? 'en' : 'id'] || category;
    const lines = picked.map((product, index) =>
      `${index + 1}. **${shortName(product, lang)}** — ${localizeOrigin(product.origin, lang)} · USD ${Number(product.price).toFixed(2)}/${product.unit} · MOQ ${Number(product.moq).toLocaleString(isEn ? 'en-US' : 'id-ID')} ${product.unit} · HS ${product.hsCode}`
    ).join('\n');
    return isEn
      ? `The catalog has **${pool.length} ${label}** products. Here are ${picked.length}:\n\n${lines}\n\nOpen the Products page for full specifications and the RFQ form.`
      : `Katalog memiliki **${pool.length} produk ${label}**. Berikut ${picked.length} di antaranya:\n\n${lines}\n\nBuka halaman Produk untuk spesifikasi lengkap dan formulir RFQ.`;
  }

  const counts = PRODUCTS_DATA.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  const lines = Object.entries(CATEGORY_LABELS)
    .filter(([key]) => counts[key])
    .map(([key, label]) => {
      const pool = PRODUCTS_DATA.filter((product) => product.category === key);
      return `- **${label[isEn ? 'en' : 'id']}** (${counts[key]}): ${pool.slice(0, 3).map((product) => shortName(product, lang)).join(', ')}${pool.length > 3 ? ', ...' : ''}`;
    })
    .join('\n');

  return isEn
    ? `NusaBridge currently lists **${PRODUCTS_DATA.length} export products** in four categories:\n\n${lines}\n\nOpen the Products page for search, filters, sorting, full specifications, and the RFQ form.`
    : `NusaBridge saat ini menampilkan **${PRODUCTS_DATA.length} produk ekspor** dalam empat kategori:\n\n${lines}\n\nBuka halaman Produk untuk pencarian, filter, sortir, spesifikasi lengkap, dan formulir RFQ.`;
}

function productReply(product, lang) {
  const isEn = lang === 'en';
  const view = localizeProduct(product, lang);
  const category = CATEGORY_LABELS[view.category]?.[isEn ? 'en' : 'id'] || view.category;
  const specs = Array.isArray(view.specs) ? view.specs.map((spec) => `${spec.k}: ${spec.v}`).join(' | ') : '';
  const certs = Array.isArray(view.certs) ? view.certs.join(', ') : '';

  return [
    `**${view.name}**`,
    '',
    `- ${isEn ? 'Category' : 'Kategori'}: ${category}`,
    `- ${isEn ? 'Origin' : 'Asal'}: ${view.origin}`,
    `- ${isEn ? 'Reference price' : 'Harga acuan'}: USD ${Number(view.price).toFixed(2)} / ${view.unit}`,
    `- MOQ: ${Number(view.moq).toLocaleString(isEn ? 'en-US' : 'id-ID')} ${view.unit}`,
    `- HS Code: ${view.hsCode}`,
    `- ${isEn ? 'Shipping' : 'Pengiriman'}: ${view.shipping || '-'}`,
    certs ? `- ${isEn ? 'Certifications' : 'Sertifikasi'}: ${certs}` : '',
    specs ? `- ${isEn ? 'Specifications' : 'Spesifikasi'}: ${specs}` : '',
    view.desc ? `\n${view.desc}` : '',
    '',
    isEn
      ? 'Open the Products page to review the full specification and submit an RFQ. The reference price is catalog data, not a final quotation.'
      : 'Buka halaman Produk untuk melihat spesifikasi lengkap dan mengajukan RFQ. Harga acuan berasal dari katalog, bukan penawaran final.',
  ].filter(Boolean).join('\n');
}

function greetingReply(role, lang) {
  const info = ROLE_INFO[normalizeRole(role)];
  if (lang === 'en') {
    return `Hi! I am **NusaBridge AI**, the assistant for the NusaBridge website. Your current role is **${info.en}**, so I will focus on ${info.focusEn}.\n\nAsk about website features, the 50-product catalog, domestic SME trade, RFQ, Auto-PDF drafts, KYC Hub, Escrow Vault, account roles, or export-import steps.`;
  }
  return `Halo! Saya **NusaBridge AI**, asisten untuk website NusaBridge. Peran akun Anda saat ini adalah **${info.id}**, jadi saya akan memfokuskan jawaban pada ${info.focusId}.\n\nTanyakan fitur website, katalog 50 produk, perdagangan domestik UMKM, RFQ, draf Auto-PDF, KYC Hub, Escrow Vault, peran akun, atau langkah ekspor-impor.`;
}

function chatFreeReply(lang = 'id') {
  return lang === 'en'
    ? [
        'Yes, absolutely! You can freely ask anything about the NusaBridge website and international export-import trade.',
        '',
        'I am ready to guide you on:',
        '1. **Catalog & Commodities**: Specifications of 50 Indonesian export products (Coffee, Spices, Crafts, Textiles), reference USD prices, MOQ, and HS codes.',
        '2. **Export & Import Features**: RFQ submissions, Auto-PDF drafts (Proforma Invoice & Sales Contract), KYC Hub NIB verification, and the 4-phase Escrow Vault safe settlement simulation.',
        '3. **Account Roles**: Usability and workflows for Indonesian Exporter (Seller) and Global Importer (Buyer) accounts.',
        '4. **Trade Regulations & Paperwork**: Incoterms 2020 (FOB, CIF, CNF, EXW), customs paperwork (PEB/PIB, B/L, COO, Packing List), and foreign standards (FDA USA, EUDR Europe, JAS Japan, Halal UAE).',
        '',
        '*Note*: To maintain accurate and reliable guidance, I strictly focus on international trade and this website. Off-topic questions (such as recipes, coding, celebrity gossip, or politics) will be declined.'
      ].join('\n')
    : [
        'Tentu saja! Anda bisa bertanya secara bebas apa saja seputar website NusaBridge dan tata niaga perdagangan ekspor-impor internasional.',
        '',
        'Saya siap membantu Anda memahami:',
        '1. **Katalog & Komoditas**: Spesifikasi 50 produk ekspor Indonesia (Kopi, Rempah, Kriya, Tekstil), harga acuan USD, MOQ, dan kode HS.',
        '2. **Fitur Ekspor & Impor**: Alur pengajuan RFQ, penerbitan draf Auto-PDF (Proforma Invoice & Sales Contract), validasi legalitas NIB di KYC Hub, dan simulasi 4 fase pembayaran di Escrow Vault.',
        '3. **Peran Akun**: Manfaat serta alur kerja akun Eksportir Indonesia (Seller) dan Importir Global (Buyer).',
        '4. **Regulasi & Dokumen**: Incoterms 2020 (FOB, CIF, CNF, EXW), kepabeanan (PEB/PIB, B/L, COO, Packing List), hingga standar sertifikasi negara tujuan (FDA USA, EUDR Uni Eropa, JAS Jepang, Halal UEA).',
        '',
        '*Catatan*: Agar jawaban selalu akurat dan bermanfaat, saya hanya melayani topik perdagangan dan website NusaBridge. Pertanyaan di luar cakupan tersebut (seperti resep masakan, koding umum, hiburan, atau politik) tidak akan saya jawab.'
      ].join('\n');
}

function exportFeaturesReply(lang = 'id') {
  return lang === 'en'
    ? [
        '**NusaBridge Export Features for Indonesian Exporters:**',
        '',
        '1. **Export Catalog Showcase**: Displays commodities with international lab specifications, customs HS codes, and global reference prices.',
        '2. **RFQ Studio & AI Parser**: Processes overseas buyer inquiries into standardized Incoterms 2020 quotations (FOB/CIF).',
        '3. **Auto-PDF Generator**: Automatically drafts legal trade paperwork (Proforma Invoices and Sales Contracts under ICC rules).',
        '4. **KYC Hub Regulatory Screener**: Validates 13-digit OSS NIB and audits compliance for destination markets (FDA USA, EUDR Europe, JAS Japan, Halal UAE).',
        '5. **Escrow Vault Milestone Protection**: Eliminates buyer default risk with 4-phase milestone payouts (30% contract, 30% PEB/stuffing, 20% B/L, 20% arrival).',
        '6. **Maritime AIS Radar**: Tracks oceanic cargo vessel trajectories from Indonesian ports to destination terminals worldwide.'
      ].join('\n')
    : [
        '**Fitur Ekspor NusaBridge untuk Eksportir Indonesia:**',
        '',
        '1. **Showcase Katalog Ekspor**: Menampilkan komoditas Anda dengan standar spesifikasi internasional, kode HS kepabeanan, dan harga acuan pasar global.',
        '2. **RFQ Studio & AI Parser**: Menerima inquiry buyer luar negeri dan menyusun penawaran resmi terstruktur sesuai Incoterms 2020 (FOB/CIF).',
        '3. **Auto-PDF Generator**: Menerbitkan instan draf dokumen ekspor legal berstandar ICC (Proforma Invoice dan Sales Contract siap cetak/unduh).',
        '4. **KYC Hub Regulatory Screener**: Memvalidasi NIB 13 digit OSS RBA dan mengecek kesiapan regulasi ekspor ke negara tujuan (FDA USA, EUDR Eropa, JAS Jepang, Halal UEA).',
        '5. **Escrow Vault Milestone Protection**: Mencegah risiko gagal bayar dengan simulasi pencairan dana bertahap 4 fase (30% kontrak disepakati, 30% stuffing kargo & PEB, 20% penerbitan Bill of Lading, 20% kargo tiba).',
        '6. **Radar Maritim AIS**: Memantau pergerakan rute kapal kargo trans-samudera dari pelabuhan muat Indonesia ke pelabuhan tujuan buyer.'
      ].join('\n');
}

function importFeaturesReply(lang = 'id') {
  return lang === 'en'
    ? [
        '**NusaBridge Import Features for Global Importers:**',
        '',
        '1. **50 Curated Commodities Catalog**: Explore Indonesian export commodities (Specialty Coffee, Spices, Rattan/Wood Crafts, Textiles) with lab parameters and MOQ.',
        '2. **Structured RFQ Generator**: Submit formal quotation requests with selected quantities, Incoterms (FOB, CIF, CNF, EXW), and destination ports.',
        '3. **Compliance & Standards Verification**: Ensure Indonesian exporters meet the safety, quarantine, and import criteria of your country.',
        '4. **Instant Legal Trade Drafts**: Receive standardized Proforma Invoices and Sales Contracts with clear ICC trade and arbitration clauses.',
        '5. **Escrow Vault Fund Protection**: Your payments remain safely locked in escrow and are only released to suppliers upon validated shipping documents (B/L) and confirmed port arrival.',
        '6. **Container Vessel Telemetry**: Track the exact position of your cargo vessel in real time using the Maritime AIS Radar.'
      ].join('\n')
    : [
        '**Fitur Impor NusaBridge untuk Importir Global:**',
        '',
        '1. **Katalog 50 Komoditas Unggulan**: Telusuri komoditas kurasi (Kopi Specialty, Rempah Nusantara, Kerajinan Anyaman/Kayu, Tekstil Wastra) dengan rincian kadar air, kadar abu, sertifikasi, dan MOQ.',
        '2. **Pengajuan RFQ Terstruktur**: Ajukan permintaan penawaran resmi dalam hitungan detik dengan memilih produk, kuantitas, Incoterms (FOB, CIF, CNF, EXW), dan pelabuhan tujuan kargo.',
        '3. **Verifikasi Kepatuhan Standar**: Pastikan pemasok dan produk memenuhi standar mutu serta karantina yang dipersyaratkan oleh negara Anda.',
        '4. **Draf Kontrak Perdagangan Instan**: Dapatkan draf Proforma Invoice dan Sales Contract berkekuatan hukum dengan klausul ICC dan arbitrase internasional.',
        '5. **Proteksi Dana Escrow Vault**: Dana pembayaran Anda aman di rekening escrow multi-valas dan hanya dicairkan kepada penjual setelah dokumen pengapalan resmi (B/L) terbit dan barang terverifikasi tiba.',
        '6. **Pelacakan Telemetri Kontainer**: Pantau posisi kapal kargo pengangkut kontainer pesanan Anda secara transparan melalui Radar Maritim AIS.'
      ].join('\n');
}

function domesticReply(lang = 'id') {
  return lang === 'en'
    ? [
      '**Domestic Trade (/domestik) — buying and selling between Indonesian SMEs:**',
      '',
      'The page has three tabs: **Buy**, **Sell**, and **Orders**.',
      '',
      '- **Buy** — search local products, filter by category or province, sort by best-selling/price/stock, and see Rupiah prices, MOQ, stock, seller, and shipping origin.',
      '- **Checkout** — choose quantity, destination city, local courier or inter-island cargo, and payment (NusaBridge Escrow, bank transfer/VA, or QRIS). The summary shows subtotal, shipping cost, 11% VAT, and total.',
      '- **Escrow** — a 4-phase simulation: 30% order confirmed, 30% goods ready/delivery note issued, 20% in transit, 20% received by buyer.',
      '- **Domestic documents** — Purchase Order (PO), Invoice, Delivery Note (Surat Jalan), and Handover Report (BAST) can be downloaded as HTML drafts.',
      '- **Compliance** — checklist for SNI, BPOM, Halal BPJPH, active NIB/NPWP, and agricultural quarantine.',
      '- **Sell** — add a listing with name, category, price in Rupiah, unit, MOQ, stock, origin, and description. The listing appears in the domestic catalog and can be deleted.',
      '- **Orders** — status flows Awaiting Payment → Paid → Processing → Shipped → Completed, with escrow release and document download.',
      '',
      'Domestic data is stored in browser localStorage as a demo. This page is separate from international export: it uses Rupiah, 11% VAT, and domestic documents, without PEB, COO, or customs clearance.',
    ].join('\n')
    : [
      '**Perdagangan Domestik (/domestik) — jual-beli antarsesama UMKM Indonesia:**',
      '',
      'Halaman ini punya tiga tab: **Beli**, **Jual**, dan **Pesanan**.',
      '',
      '- **Beli** — cari produk lokal, filter kategori atau provinsi, sortir terlaris/harga/stok, dan lihat harga Rupiah, MOQ, stok, penjual, serta asal pengiriman.',
      '- **Checkout** — pilih jumlah, kota tujuan, kurir lokal atau kargo antarpulau, dan pembayaran (Escrow NusaBridge, transfer bank/VA, atau QRIS). Ringkasan menampilkan subtotal, ongkos kirim, PPN 11%, dan total.',
      '- **Escrow** — simulasi 4 fase: 30% pesanan dikonfirmasi, 30% barang siap/surat jalan terbit, 20% dalam perjalanan, 20% diterima pembeli.',
      '- **Dokumen domestik** — Purchase Order (PO), Invoice, Surat Jalan, dan Berita Acara Serah Terima (BAST) dapat diunduh sebagai draf HTML.',
      '- **Kepatuhan** — checklist SNI, BPOM, Halal BPJPH, NIB/NPWP aktif, dan karantina pertanian.',
      '- **Jual** — tambah listing dengan nama, kategori, harga Rupiah, satuan, MOQ, stok, asal, dan deskripsi. Listing muncul di katalog domestik dan bisa dihapus.',
      '- **Pesanan** — status pesanan Menunggu Pembayaran → Dibayar → Diproses → Dikirim → Selesai, dengan pencairan escrow dan unduh dokumen.',
      '',
      'Data domestik disimpan di localStorage browser sebagai demo. Halaman ini terpisah dari ekspor internasional: memakai Rupiah, PPN 11%, dan dokumen domestik, tanpa PEB, COO, atau bea cukai.',
    ].join('\n');
}

function developerReply(lang = 'id') {
  return lang === 'en'
    ? 'NusaBridge is developed by the Arjika Labs Team from SMK Antartika 1 Sidoarjo. The platform was created as an integrated trade facilitation and educational innovation for Indonesian SMEs, combining an export commodity catalog, AI Sales Assistant, legal document drafting (Proforma Invoice & Sales Contract), KYC compliance validation, and a 4-phase secure Escrow Vault simulation.'
    : 'NusaBridge dikembangkan oleh Tim Arjika Labs dari SMK Antartika 1 Sidoarjo. Platform ini diciptakan sebagai inovasi fasilitasi perdagangan dan edukasi ekspor-impor bagi pelaku UMKM Indonesia, menggabungkan katalog produk ekspor, AI Sales Assistant, otomasi draf dokumen legal (Proforma Invoice & Sales Contract), validasi kepatuhan KYC Hub, dan simulasi 4 fase pembayaran aman di Escrow Vault.';
}

function unknownReply(lang = 'id') {
  return lang === 'en'
    ? [
        'Your question is not yet specific or does not relate directly to the NusaBridge website and international export-import trade.',
        '',
        'NusaBridge AI can assist you with:',
        '- **50 Export Commodities Catalog**: Coffee, Spices, Crafts, Textiles (specifications, HS codes, reference prices, MOQ)',
        '- **Domestic SME Trade**: Rupiah catalog, local/inter-island shipping, 11% VAT, escrow, PO/Invoice/Delivery Note/BAST, seller listings, and orders',
        '- **Export & Import Features**: RFQ submissions, Auto-PDF drafts (Proforma Invoice & Sales Contract), KYC Hub compliance, and the 4-phase Escrow Vault simulation',
        '- **Account Roles**: Indonesian Exporter (Seller) and Global Importer (Buyer) usage',
        '- **Trade Regulations & Paperwork**: Incoterms 2020 (FOB vs CIF), customs declarations (PEB/PIB, B/L, COO), and foreign standards (FDA, EUDR, JAS, Halal)',
        '',
        'Please feel free to ask a specific question regarding any of these topics!'
      ].join('\n')
    : [
        'Pertanyaan Anda belum spesifik atau tidak terkait langsung dengan website NusaBridge dan tata niaga ekspor-impor internasional.',
        '',
        'NusaBridge AI difokuskan untuk membantu Anda seputar:',
        '- **Katalog 50 Komoditas Ekspor**: Kopi, Rempah, Kriya, dan Tekstil (spesifikasi lab, kode HS, harga acuan USD, dan MOQ)',
        '- **Perdagangan Domestik UMKM**: katalog Rupiah, ongkir lokal/antarpulau, PPN 11%, escrow, PO/Invoice/Surat Jalan/BAST, listing penjual, dan pesanan',
        '- **Fitur Ekspor & Impor**: Alur RFQ, otomasi draf Auto-PDF (Proforma Invoice & Sales Contract), validasi kepatuhan KYC Hub, dan simulasi 4 fase Escrow Vault',
        '- **Peran Akun**: Eksportir Indonesia (Seller) dan Importir Global (Buyer)',
        '- **Regulasi & Dokumen**: Incoterms 2020 (FOB vs CIF), kepabeanan (PEB/PIB, B/L, COO), dan standar negara tujuan (FDA USA, EUDR Uni Eropa, JAS Jepang, Halal UEA)',
        '',
        'Silakan ketik pertanyaan spesifik seputar topik di atas agar saya dapat memberikan jawaban yang tepat.'
      ].join('\n');
}

function offTopicReply(lang) {
  return lang === 'en'
    ? 'That question is outside the scope of NusaBridge AI. I am dedicated exclusively to the NusaBridge website and export-import trade guidance. Please feel free to ask about website features (product catalog, RFQ simulation, Auto-PDF, KYC Hub, Escrow Vault), exporter & importer roles, or international trade workflows.'
    : 'Pertanyaan tersebut berada di luar cakupan NusaBridge AI. Saya adalah asisten khusus untuk website NusaBridge dan panduan perdagangan ekspor-impor. Silakan tanyakan seputar fitur website (katalog produk, simulasi RFQ, Auto-PDF, KYC Hub, Escrow Vault), peran akun eksportir & importir, atau alur perdagangan internasional.';
}

function generalWebsiteReply(lang) {
  return lang === 'en'
    ? [
        '**NusaBridge AI Trade Assistant**',
        '',
        'NusaBridge is an all-in-one trade facilitation and education platform for Indonesian SME export-import:',
        '- **Product Catalog** — 50 curated commodities (Coffee, Spices, Crafts, Textiles) with lab parameters and HS codes.',
        '- **Domestic Trade** — buy/sell between Indonesian SMEs in Rupiah with local/inter-island shipping, 11% VAT, 4-phase escrow, PO/Invoice/Delivery Note/BAST documents, seller listings, and order history.',
        '- **RFQ Studio** — converts buyer inquiries into structured Incoterms 2020 quotations.',
        '- **Auto-PDF Generator** — instantly drafts Proforma Invoices, Sales Contracts, and PEB drafts.',
        '- **KYC Hub** — validates 13-digit NIB OSS and screens compliance for USA (FDA), EU (EUDR), Japan (JAS), and UAE (Halal BPJPH).',
        '- **Escrow Vault** — simulates a 4-phase milestone payout (30% contract, 30% PEB, 20% B/L, 20% arrival) for safe transactions.',
        '- **Maritime Radar** — tracks cargo vessel routes and telemetries across trans-oceanic voyages.',
        '',
        'You can ask specifically about product specifications, the export/import workflow, exporter vs importer roles, or step-by-step document guidance!'
      ].join('\n')
    : [
        '**Asisten Perdagangan NusaBridge AI**',
        '',
        'NusaBridge adalah platform fasilitasi perdagangan dan edukasi ekspor-impor terpadu untuk UMKM Indonesia:',
        '- **Katalog Produk** — 50 komoditas ekspor kurasi (Kopi, Rempah, Kriya, Tekstil) lengkap dengan spesifikasi lab dan kode HS.',
        '- **Perdagangan Domestik** — jual-beli antarsesama UMKM Indonesia dalam Rupiah dengan ongkir lokal/antarpulau, PPN 11%, escrow 4 fase, dokumen PO/Invoice/Surat Jalan/BAST, listing penjual, dan riwayat pesanan.',
        '- **RFQ Studio** — mengubah permintaan buyer menjadi kuotasi terstruktur berstandar Incoterms 2020.',
        '- **Auto-PDF Generator** — menerbitkan draf resmi Proforma Invoice dan Sales Contract siap cetak.',
        '- **KYC Hub** — memvalidasi NIB 13 digit OSS RBA dan memeriksa kepatuhan standar USA (FDA), Uni Eropa (EUDR), Jepang (JAS), dan UEA (Halal BPJPH).',
        '- **Escrow Vault** — simulasi pencairan dana 4 tahap (30% kontrak, 30% PEB, 20% B/L, 20% tiba) untuk mencegah risiko gagal bayar.',
        '- **Radar Maritim** — pelacakan rute dan telemetri AIS kapal kargo internasional.',
        '',
        'Silakan tanyakan langkah spesifik yang ingin Anda ketahui: cara pesan di katalog, panduan alur ekspor/impor, kegunaan akun seller/buyer, atau ketentuan dokumen perdagangan!'
      ].join('\n');
}

/**
 * Fallback lokal saat backend tidak dapat dihubungi. Tetap memakai rujukan
 * bersama agar jawaban website/ekspor tidak berubah-ubah.
 */
export function getLocalAiReply({ message = '', lang = 'id', role = 'guest', page = '' } = {}) {
  const raw = String(message || '').trim();
  const isEn = lang === 'en';
  if (!raw) {
    return isEn
      ? 'Please type a question about the NusaBridge website or export-import guidance.'
      : 'Silakan ketik pertanyaan tentang website NusaBridge atau panduan ekspor-impor.';
  }

  // 1. Cek off-topic sebelum sapaan agar pertanyaan di luar topik langsung ditolak
  if (detectOffTopic(raw)) return offTopicReply(lang);

  // 2. Sapaan
  if (isGreeting(raw)) return greetingReply(role, lang);

  // 2b. Pertanyaan daftar produk dengan kategori eksplisit harus menampilkan
  // kategori tersebut (atau semua kategori yang diminta).
  const textNorm = normalize(raw);
  if (isProductListQuery(textNorm) && categoriesFromText(raw).length > 0) {
    return catalogReply(raw, lang);
  }

  // 3. Cek rujukan dengan skor tinggi terlebih dahulu
  const reference = findLocalReferenceAnswer(raw, lang);
  if (reference?.answer && (reference.score == null || reference.score >= 18)) {
    return reference.answer;
  }

  // 4. Katalog / Kategori
  if (isGenericCategoryQuery(textNorm) || isProductListQuery(raw)) {
    return catalogReply(raw, lang);
  }

  // 5. Detail produk spesifik
  const products = findProducts(raw);
  if (products.length && /(harga|spesifikasi|spek|moq|minimal|asal|sertifikat|detail|info|jelaskan|berapa|hs|kode|deskripsi|tentang|profil|apa itu|what is|what are|tell me about)/i.test(raw)) {
    return productReply(products[0], lang);
  }

  // 6. Rujukan positif lainnya
  if (reference?.answer) return reference.answer;

  // 7. Intent tambahan khusus
  if (/(bisa|boleh|apakah bisa|kamu bisa).*(chat|tanya|ngobrol|konsultasi).*(bebas|apa saja|apa aja)|(chat|tanya).*(bebas|apa saja)/i.test(textNorm)) {
    return chatFreeReply(lang);
  }
  if (/(fitur|fasilitas|layanan|alat).*(ekspor|seller|penjual)|(ekspor|seller).*(fitur|fasilitas|keunggulan)/i.test(textNorm)) {
    return exportFeaturesReply(lang);
  }
  if (/(fitur|fasilitas|layanan|alat).*(impor|buyer|pembeli)|(impor|buyer).*(fitur|fasilitas|keunggulan)/i.test(textNorm)) {
    return importFeaturesReply(lang);
  }
  if (/(siapa|siapakah|tim|asal).*(pembuat|pengembang|bikin|buat|dibuat|developer|pencipta)|(pembuat|pengembang|bikin|buat|dibuat|developer|pencipta).*(siapa|siapakah)|arjika|antartika/i.test(textNorm)) {
    return developerReply(lang);
  }
  if (/(domestik|domestic|antarpulau|antar pulau|dalam negeri|perdagangan lokal|jualan lokal|beli lokal|umkm lokal|harga rupiah|idr|surat jalan|bast|berita acara serah terima)/i.test(textNorm)) {
    return domesticReply(lang);
  }

  // 8. Respon panduan terarah jika pertanyaan tidak spesifik / di luar domain
  return unknownReply(lang);
}

/**
 * Panggil endpoint AI. Mengembalikan objek { reply, model, ... }.
 * Melempar error bila backend tidak memberi jawaban yang valid.
 */
export async function sendAiChat({
  message,
  lang = 'id',
  role = 'guest',
  page = '',
  history = [],
  signal,
} = {}) {
  const res = await fetch(apiUrl('/api/ai/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      lang,
      context: {
        role: normalizeRole(role),
        page,
        history: Array.isArray(history) ? history.slice(-8) : [],
      },
    }),
    signal,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success || typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error(data?.message || (lang === 'en' ? 'The AI service is unavailable.' : 'Layanan AI tidak tersedia.'));
  }
  return data;
}
