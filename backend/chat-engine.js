/**
 * ==========================================================================
 * NUSABRIDGE - WEBSITE-AWARE CHAT ENGINE
 * File: chat-engine.js
 *
 * Mesin jawaban deterministik untuk NusaBridge AI:
 * - Menjawab pertanyaan tentang website, fitur, peran akun, dan alur ekspor.
 * - Menolak pertanyaan di luar cakupan tanpa ikut menjawabnya.
 * - Memakai katalog sebagai satu-satunya sumber fakta produk.
 * - Dipakai saat Groq tidak tersedia, atau sebagai pengaman sebelum Groq.
 * ==========================================================================
 */

const FALLBACK_PRODUCTS = require('./database/products-fallback.json');
const { findReferenceAnswer } = require('./reference-answers');

const CATEGORY_LABELS = {
  kopi: { id: 'Kopi', en: 'Coffee' },
  rempah: { id: 'Rempah & Hasil Alam', en: 'Spices & Natural Products' },
  kriya: { id: 'Kriya & Kerajinan', en: 'Crafts & Handicrafts' },
  tekstil: { id: 'Tekstil & Wastra', en: 'Textiles & Wastra' },
};

const CATALOG_COUNTS = FALLBACK_PRODUCTS.reduce((acc, product) => {
  acc[product.category] = (acc[product.category] || 0) + 1;
  return acc;
}, {});

const ROLE_INFO = {
  seller: {
    id: 'Eksportir Indonesia (seller)',
    en: 'Indonesian exporter (seller)',
    focusId:
      'menyiapkan profil usaha, menampilkan informasi produk di katalog, memahami alur RFQ, menyiapkan draf dokumen, memeriksa data KYC, dan mempelajari simulasi Escrow',
    focusEn:
      'preparing the business profile, presenting product information in the catalog, understanding the RFQ flow, preparing document drafts, reviewing KYC data, and learning the Escrow simulation',
  },
  buyer: {
    id: 'Importir global (buyer)',
    en: 'Global importer (buyer)',
    focusId:
      'menelusuri katalog, membandingkan spesifikasi produk, mengajukan RFQ, memahami Incoterms dan dokumen, serta mempelajari simulasi Escrow',
    focusEn:
      'browsing the catalog, comparing product specifications, submitting an RFQ, understanding Incoterms and documents, and learning the Escrow simulation',
  },
  guest: {
    id: 'Pengunjung',
    en: 'Guest',
    focusId: 'menjelajah katalog dan bertanya tentang fitur website sebelum membuat akun',
    focusEn: 'browsing the catalog and asking about website features before creating an account',
  },
};

const PAGE_LABELS = {
  home: { id: 'Beranda', en: 'Home' },
  products: { id: 'Katalog Produk', en: 'Product Catalog' },
  solutions: { id: 'Solusi AI', en: 'AI Solutions' },
  escrow: { id: 'Simulasi Escrow Vault', en: 'Escrow Vault Simulation' },
  pricing: { id: 'Paket & Harga', en: 'Plans & Pricing' },
  transport: { id: 'Transportasi & Logistik', en: 'Transport & Logistics' },
  tracking: { id: 'Pelacakan', en: 'Tracking' },
  auth: { id: 'Masuk / Daftar', en: 'Login / Register' },
};

const WEBSITE_PAGES_ID = [
  'Beranda (/) — ringkasan platform, alur ekspor, dan CTA pendaftaran.',
  'Produk (/produk) — katalog 50 komoditas, pencarian, filter kategori, sortir, halaman 12 produk, modal spesifikasi, dan formulir RFQ.',
  'Solusi AI (/solusi) — chat NusaBridge AI, penjelasan 4 pilar, dan studio interaktif RFQ, Auto-PDF, KYC Hub, serta Escrow Vault.',
  'Harga (/harga) — paket UMKM, voucher subsidi, dan kalkulator estimasi.',
  'Transportasi (/transportasi) — pemilihan transportasi multimoda dan estimasi rute, biaya, serta ETA berdasarkan input pengiriman.',
  'Pelacakan (/pelacakan) — status dan progres pengiriman menggunakan data simulasi, bukan GPS atau status ekspedisi nyata.',
  'Masuk/Daftar — modal akun dengan pilihan peran Eksportir (seller) atau Importir (buyer), unggah logo, dan sesi tersimpan di browser.',
];

const WEBSITE_FACTS_ID = `FAKTA WEBSITE NUSABRIDGE (hanya gunakan fakta ini):
- NusaBridge adalah website informasi dan simulasi perdagangan ekspor-impor untuk UMKM Indonesia. NusaBridge bukan penjual, produsen, bank, atau instansi verifikasi resmi.
- Halaman: ${WEBSITE_PAGES_ID.join(' ')}
- Katalog berisi ${FALLBACK_PRODUCTS.length} produk: ${CATALOG_COUNTS.kopi || 0} kopi, ${CATALOG_COUNTS.rempah || 0} rempah & hasil alam, ${CATALOG_COUNTS.kriya || 0} kriya, dan ${CATALOG_COUNTS.tekstil || 0} tekstil. Setiap produk memiliki nama, kategori, asal, harga acuan USD, satuan, MOQ, kode HS, deskripsi, spesifikasi, sertifikasi, dan pelabuhan pengiriman.
- RFQ: pengguna memilih produk, mengisi jumlah, Incoterms (FOB/CIF/CNF/EXW), pelabuhan tujuan, dan email kontak. Setelah tersimpan, website menampilkan nomor RFQ, status "Diajukan — menunggu peninjauan", tahapan proses, dan tombol "Perbarui Status". Website tidak mengirim RFQ otomatis ke pemasok, tidak menerima atau membandingkan penawaran, dan tidak menyediakan dashboard negosiasi.
- Auto-PDF: menghasilkan draf Proforma Invoice dan Sales Contract yang dapat dicetak atau disalin. Ini draf, bukan dokumen resmi yang sudah diverifikasi.
- KYC Hub: simulasi pemeriksaan format NIB/NPWP dan menampilkan checklist standar negara tujuan. Ini bukan verifikasi resmi OSS, Bea Cukai, atau otoritas negara tujuan.
- Escrow Vault: simulasi 4 fase pencairan (30% kontrak, 30% PEB/stuffing, 20% B/L, 20% tiba). Website tidak memproses pembayaran atau menyimpan dana sungguhan.
- Transportasi: pengguna dapat memasukkan detail pengiriman untuk melihat pilihan multimoda dan estimasi rute, biaya, serta ETA; hasilnya adalah estimasi website.
- Pelacakan: halaman menampilkan status/progres pengiriman dari data demo. Website tidak menampilkan GPS atau status ekspedisi/kepabeanan nyata.
- Peran akun: Eksportir (seller) dan Importir (buyer). Peran memengaruhi tampilan panduan dan konteks jawaban AI; tidak membuka dashboard transaksi khusus.
- Bahasa antarmuka: Indonesia dan Inggris. Akun menyimpan nama usaha, email, logo, dan peran di sesi browser.
- AI: menjawab pertanyaan tentang website NusaBridge dan panduan umum ekspor-impor. AI tidak menjawab topik di luar itu dan tidak boleh mengarang fitur, harga, stok, status transaksi, atau regulasi.`;

const WEBSITE_FACTS_EN = `NUSABRIDGE WEBSITE FACTS (use only these facts):
- NusaBridge is an information and simulation website for Indonesian SME export-import trade. NusaBridge is not a seller, producer, bank, or official verification authority.
- Pages: Home (/), Products (/produk), AI Solutions (/solusi), Pricing (/harga), Transport (/transportasi), Tracking (/pelacakan), and the Login/Register modal. Transport provides multimodal route/cost/ETA estimates based on shipment inputs. Tracking uses demo data only, not live GPS, carrier, or customs status. The product catalog has ${FALLBACK_PRODUCTS.length} products: ${CATALOG_COUNTS.kopi || 0} coffee, ${CATALOG_COUNTS.rempah || 0} spices & natural products, ${CATALOG_COUNTS.kriya || 0} crafts, and ${CATALOG_COUNTS.tekstil || 0} textiles.
- RFQ: choose a product, enter quantity, Incoterms (FOB/CIF/CNF/EXW), destination port, and contact email. The site returns an RFQ number, a "submitted — awaiting review" status, process steps, and a status refresh button. It does not automatically contact suppliers, collect or compare quotations, or provide a negotiation dashboard.
- Auto-PDF: creates printable/copyable draft Proforma Invoice and Sales Contract documents. They are drafts, not officially verified documents.
- KYC Hub: a simulation that checks NIB/NPWP format and shows destination-country checklists. It is not official verification by OSS, Customs, or a foreign authority.
- Escrow Vault: a 4-phase payout simulation (30% contract, 30% PEB/stuffing, 20% B/L, 20% arrival). The site does not process real payments or hold funds.
- Transport: users can enter shipment details to see multimodal options and estimated route, cost, and ETA; results are website estimates.
- Tracking: the page displays shipment status/progress from demo data. The site does not show real GPS, carrier, or customs status.
- Account roles: Exporter (seller) and Importer (buyer). The role changes guidance and AI context; it does not unlock a dedicated transaction dashboard.
- Interface languages: Indonesian and English. The browser session stores business name, email, logo, and role.
- AI: answers questions about the NusaBridge website and general export-import guidance only. It must not answer unrelated topics or invent features, prices, stock, transaction status, or regulations.`;

const OFF_TOPIC_GROUPS = [
  {
    id: 'math',
    re: /(\b\d+[\s]*[\+\-\*\/\^xX\:]+[\s]*\d+\b|\b(hitung|kalkulator|aljabar|integral|turunan|persamaan kuadrat|geometri|trigonometri|kalkulus|rumus fisika|rumus kimia|rumus matematika)\b)/i,
  },
  {
    id: 'recipes-food',
    re: /\b(resep|masakan|cara masak|cara membuat (?:kue|roti|donat|makanan|minuman|jus|sup|soto|bakso|mie|nasi)|cara bikin (?:kue|roti|donat|makanan|minuman|jus|sup|soto|bakso|mie|nasi)|bumbu (?:rendang|dapur|masak|opor|balado)|nasi goreng|mie goreng|memasak|baking|resep makanan|kuliner|recipe|recipes|cooking|fried rice|noodle|soup|bake|cake|pastry|cuisine)\b/i,
    allowIf: /\b(nusabridge|website|katalog|produk|komoditas|ekspor|impor)\b/i,
  },
  {
    id: 'coding',
    re: /\b(coding|koding|pemrograman|program komputer|javascript|typescript|python|java|c\+\+|golang|rust|react|vue|angular|node js|php|sql|html|css|algoritma|debug|source code|buatkan kode|buatkan script|buatkan program|bikin aplikasi|syntax)\b/i,
  },
  {
    id: 'entertainment',
    re: /\b(film|movie|bioskop|aktor|aktris|artis|selebriti|lagu|musik|chord|lirik|drakor|kpop|bts|blackpink|taylor swift|anime|manga|naruto|one piece|game|gaming|mobile legends|free fire|pubg|valorant|playstation|xbox|sepak bola|piala dunia|liga inggris|liga champions|real madrid|barcelona|persib|persebaya|messi|ronaldo|lelucon|cerita lucu|meme|song|singer|lyrics|celebrity|football|world cup|movie star)\b/i,
  },
  {
    id: 'politics',
    re: /\b(presiden|gubernur|walikota|dpr|pemilu|pilpres|partai|menteri|politik|berita artis|zodiak|ramalan bintang|ramalan jodoh|cuaca hari ini|cuaca besok|gempa|president|prime minister|election|politics|politician|government|weather today|weather tomorrow|earthquake|horoscope)\b/i,
  },
  {
    id: 'religion',
    re: /\b(agama|ibadah|doa|kitab suci|ustad|pendeta|surat al|surat injil|ayat|khutbah|religion|prayer|bible|quran|sermon|worship)\b/i,
  },
  {
    id: 'casual-science-trivia',
    re: /\b(puisi|pantun|cerpen|dongeng|curhat|pacar|cinta|jodoh|kucing|anjing|hewan peliharaan|burung|ikan cupang|bumi bulat|bumi datar|langit biru|gravitasi|tata surya|planet (?:mars|jupiter|saturnus|venus)|fotosintesis|dinosaurus|relativitas|kecepatan cahaya|kenapa hujan|kenapa laut asin|umur bumi|ibu kota (?:perancis|prancis|inggris|jepang|amerika|rusia)|siapa penemu|sejarah perang dunia|poem|poetry|short story|relativity|gravity|solar system|photosynthesis|dinosaur|speed of light|why is the sky blue|why is the sea salty|age of the earth|capital of)\b/i,
  },
  {
    id: 'health',
    re: /\b(obat|penyakit|dokter|rumah sakit|vitamin|fitness|diet|sakit (?:gigi|kepala|perut|pinggang|tenggorokan)|batuk|pilek|flu|demam|pusing|maag|asam lambung|paracetamol|antibiotik|gejala|kanker|stroke|diabetes|tensi darah|kolesterol|medicine|medication|doctor|hospital|disease|headache|fever|cough|sick|pain|symptom|cancer|blood pressure|cholesterol)\b/i,
    allowIf: /\b(nusabridge|website|katalog|produk|komoditas)\b/i,
  },
  {
    id: 'general-ai',
    re: /\b(apa itu ai|what is ai|cara kerja ai|how does ai work|machine learning|deep learning|neural network|llm|kecerdasan buatan|model ai|transformer)\b/i,
    allowIf: /\b(nusabridge|website|fitur|asisten|chatbot|halaman)\b/i,
  },
  {
    id: 'homework-essays',
    re: /\b(buatkan (?:makalah|skripsi|tesis|puisi|pantun|cerpen|rangkuman)|kerjakan pr|tugas sekolah|jawaban lks)\b/i,
  },
  {
    id: 'crypto-pinjol',
    re: /\b(crypto|cryptocurrency|bitcoin|ethereum|trading forex|saham gorengan|slot online|slot gacor|judi|pinjol|pinjaman online)\b/i,
  },
];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

// Cocokkan kata utuh, bukan potongan kata. Tanpa ini, kata seperti "itu"
// bisa cocok dengan "Belitung" dan membuat pertanyaan non-produk salah
// dianggap pertanyaan produk.
function containsTerm(haystack, term) {
  if (!term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'u').test(haystack);
}

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (['seller', 'exporter', 'eksportir', 'penjual'].includes(value)) return 'seller';
  if (['buyer', 'importer', 'importir', 'pembeli'].includes(value)) return 'buyer';
  return 'guest';
}

function getPageLabel(page, lang = 'id') {
  const key = String(page || '').toLowerCase();
  const label = PAGE_LABELS[key];
  if (!label) return '';
  return label[lang === 'en' ? 'en' : 'id'];
}

function isGreeting(message) {
  const text = normalize(message);
  if (!text) return false;
  if (/^(apa kabar|how are you|good morning|good afternoon|good evening)[\s!?]*$/.test(text)) {
    return true;
  }
  const words = text.split(' ');
  if (words.length > 5) return false;
  return /^(halo|hallo|hai|hi|hey|hello|selamat pagi|selamat siang|selamat sore|selamat malam|assalamualaikum|salam)[\s!?]*/.test(text);
}

function detectOffTopic(message) {
  const text = normalize(message);
  if (!text) return null;

  for (const group of OFF_TOPIC_GROUPS) {
    if (!group.re.test(text)) continue;
    if (group.allowIf && group.allowIf.test(text)) continue;
    return group.id;
  }
  return null;
}

function findMatchingProducts(text, list = FALLBACK_PRODUCTS) {
  if (!Array.isArray(list) || !list.length) return [];

  const qLower = String(text || '').toLowerCase();
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

  const scored = list
    .map((item) => {
      let score = 0;
      const name = String(item.name || '').toLowerCase();
      const category = String(item.category || '').toLowerCase();
      const origin = String(item.origin || '').toLowerCase();
      const desc = String(item.desc || '').toLowerCase();

      if (qLower.length >= 3 && name.includes(qLower)) score += 60;
      if (qLower.length >= 3 && category.includes(qLower)) score += 20;

      keywords.forEach((keyword) => {
        if (containsTerm(name, keyword)) score += 15;
        if (containsTerm(category, keyword)) score += 8;
        if (containsTerm(origin, keyword)) score += 8;
        if (containsTerm(desc, keyword)) score += 3;
      });

      return { item, score };
    })
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((entry) => entry.item);
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

function isProductDetailQuery(text, matches) {
  if (!matches.length) return false;
  if (isProductListQuery(text)) return false;
  return /(harga|spesifikasi|spek|moq|minimal|asal|sertifikat|detail|info|jelaskan|berapa|hs|kode|deskripsi|tentang|profil|apa itu|what is|what are|tell me about)/i.test(text);
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

function productName(product) {
  return String(product?.name || 'Produk').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function formatProduct(product, lang = 'id') {
  const isEn = lang === 'en';
  const specs = Array.isArray(product.specs)
    ? product.specs.map((spec) => `${spec.k}: ${spec.v}`).join(' | ')
    : '';
  const certs = Array.isArray(product.certs) ? product.certs.join(', ') : '';
  const category = CATEGORY_LABELS[product.category]?.[isEn ? 'en' : 'id'] || product.category || '-';

  return [
    `**${product.name}**`,
    '',
    `- ${isEn ? 'Category' : 'Kategori'}: ${category}`,
    `- ${isEn ? 'Origin' : 'Asal'}: ${product.origin || '-'}`,
    `- ${isEn ? 'Reference price' : 'Harga acuan'}: USD ${Number(product.price).toFixed(2)} / ${product.unit || 'unit'}`,
    `- ${isEn ? 'Minimum order (MOQ)' : 'Minimum order (MOQ)'}: ${Number(product.moq || 0).toLocaleString('id-ID')} ${product.unit || 'unit'}`,
    `- HS Code: ${product.hsCode || '-'}`,
    `- ${isEn ? 'Shipping' : 'Pengiriman'}: ${product.shipping || '-'}`,
    certs ? `- ${isEn ? 'Certifications' : 'Sertifikasi'}: ${certs}` : '',
    specs ? `- ${isEn ? 'Specifications' : 'Spesifikasi'}: ${specs}` : '',
    product.desc ? `\n${product.desc}` : '',
    '',
    isEn
      ? 'Open the Products page to review the full specification and submit an RFQ. The reference price is catalog data, not a final quotation.'
      : 'Buka halaman Produk untuk melihat spesifikasi lengkap dan mengajukan RFQ. Harga acuan berasal dari katalog, bukan penawaran final.',
  ].filter(Boolean).join('\n');
}

function formatCatalogList(text, lang = 'id', products = FALLBACK_PRODUCTS) {
  const isEn = lang === 'en';
  const categories = categoriesFromText(text);
  const category = categories[0] || null;
  const countMatch = text.match(/(\d+)\s*(produk|komoditas|item|buah|jenis|macam)/i);
  const requested = countMatch ? Math.max(1, parseInt(countMatch[1], 10)) : 5;

  if (categories.length > 1) {
    const sections = categories.map((key) => {
      const pool = products.filter((product) => product.category === key);
      const picked = pool.slice(0, Math.min(requested, 20));
      const label = CATEGORY_LABELS[key]?.[isEn ? 'en' : 'id'] || key;
      const lines = picked.map((product, index) =>
        `${index + 1}. **${productName(product)}** — ${product.origin || '-'} · USD ${Number(product.price).toFixed(2)}/${product.unit || 'unit'} · MOQ ${Number(product.moq || 0).toLocaleString('id-ID')} ${product.unit || 'unit'} · HS ${product.hsCode || '-'}`
      ).join('\n');
      return [
        isEn
          ? `**${label}** — ${pool.length} products:`
          : `**${label}** — ${pool.length} produk:`,
        lines,
      ].join('\n');
    }).join('\n\n');

    return [
      isEn
        ? `The catalog has products in ${categories.length} of the requested categories:`
        : `Katalog memiliki produk dalam ${categories.length} kategori yang Anda tanyakan:`,
      '',
      sections,
      '',
      isEn
        ? 'Ask for a product name to see its specifications, or open the Products page to submit an RFQ.'
        : 'Sebutkan nama produk untuk melihat spesifikasinya, atau buka halaman Produk untuk mengajukan RFQ.',
    ].join('\n');
  }

  if (category) {
    const pool = products.filter((product) => product.category === category);
    const picked = pool.slice(0, Math.min(requested, 20));
    const label = CATEGORY_LABELS[category]?.[isEn ? 'en' : 'id'] || category;
    const lines = picked.map((product, index) =>
      `${index + 1}. **${productName(product)}** — ${product.origin || '-'} · USD ${Number(product.price).toFixed(2)}/${product.unit || 'unit'} · MOQ ${Number(product.moq || 0).toLocaleString('id-ID')} ${product.unit || 'unit'} · HS ${product.hsCode || '-'}`
    ).join('\n');

    return [
      isEn
        ? `The catalog has **${pool.length} ${label}** products. Here are ${picked.length}:`
        : `Katalog memiliki **${pool.length} produk ${label}**. Berikut ${picked.length} di antaranya:`,
      '',
      lines,
      '',
      isEn
        ? 'Ask for a product name to see its specifications, or open the Products page to submit an RFQ.'
        : 'Sebutkan nama produk untuk melihat spesifikasinya, atau buka halaman Produk untuk mengajukan RFQ.',
    ].join('\n');
  }

  const categoryLines = Object.entries(CATEGORY_LABELS)
    .filter(([key]) => (CATALOG_COUNTS[key] || 0) > 0)
    .map(([key, label]) => {
      const pool = products.filter((product) => product.category === key);
      const examples = pool.slice(0, 3).map((product) => productName(product)).join(', ');
      return `- **${label[isEn ? 'en' : 'id']}** (${CATALOG_COUNTS[key]}): ${examples}${pool.length > 3 ? ', ...' : ''}`;
    })
    .join('\n');

  return [
    isEn
      ? `NusaBridge currently lists **${products.length} export products** in four categories:`
      : `NusaBridge saat ini menampilkan **${products.length} produk ekspor** dalam empat kategori:`,
    '',
    categoryLines,
    '',
    isEn
      ? 'Open the Products page for search, filters, sorting, full specifications, and the RFQ form.'
      : 'Buka halaman Produk untuk pencarian, filter, sortir, spesifikasi lengkap, dan formulir RFQ.',
  ].join('\n');
}

function offTopicReply(lang = 'id') {
  return lang === 'en'
    ? 'That question is outside the scope of NusaBridge AI. I am dedicated exclusively to the NusaBridge website and export-import trade guidance. Please feel free to ask about website features (product catalog, RFQ simulation, Auto-PDF, KYC Hub, Escrow Vault), exporter & importer roles, or international trade workflows.'
    : 'Pertanyaan tersebut berada di luar cakupan NusaBridge AI. Saya adalah asisten khusus untuk website NusaBridge dan panduan perdagangan ekspor-impor. Silakan tanyakan seputar fitur website (katalog produk, simulasi RFQ, Auto-PDF, KYC Hub, Escrow Vault), peran akun eksportir & importir, atau alur perdagangan internasional.';
}

function greetingReply(role, lang = 'id') {
  const normalizedRole = normalizeRole(role);
  const info = ROLE_INFO[normalizedRole];
  const isEn = lang === 'en';

  if (isEn) {
    return [
      `Hi! I am **NusaBridge AI**, the assistant for the NusaBridge website. Your current role is **${info.en}**, so I will focus on ${info.focusEn}.`,
      '',
      'You can ask about:',
      '- Website features and page flows',
      '- The 50-product catalog and product specifications',
      '- RFQ submission and status',
      '- Auto-PDF drafts, KYC Hub, and the Escrow Vault simulation',
      '- Account roles, login/register, and plans',
      '',
      'What would you like to know?',
    ].join('\n');
  }

  return [
    `Halo! Saya **NusaBridge AI**, asisten untuk website NusaBridge. Peran akun Anda saat ini adalah **${info.id}**, jadi saya akan memfokuskan jawaban pada ${info.focusId}.`,
    '',
    'Anda bisa bertanya tentang:',
    '- Fitur website dan alur tiap halaman',
    '- Katalog 50 produk dan spesifikasi produk',
    '- Pengajuan RFQ dan statusnya',
    '- Draf Auto-PDF, KYC Hub, dan simulasi Escrow Vault',
    '- Peran akun, masuk/daftar, dan paket harga',
    '',
    'Apa yang ingin Anda ketahui?',
  ].join('\n');
}

function roleReply(role, lang = 'id') {
  const normalizedRole = normalizeRole(role);
  const isEn = lang === 'en';
  const current = ROLE_INFO[normalizedRole];

  if (isEn) {
    return [
      'NusaBridge has two account roles:',
      '',
      '**Exporter (seller)** — for Indonesian businesses presenting products and learning the export flow. Focus: business profile, product information, RFQ flow, document drafts, KYC data, and the Escrow simulation.',
      '',
      '**Importer (buyer)** — for overseas buyers exploring the catalog. Focus: product specifications, RFQ submission, Incoterms and documents, and the Escrow simulation.',
      '',
      `Your current role is **${current.en}**. The role changes the guidance and AI context, but it does not unlock a separate transaction dashboard or negotiation room.`,
    ].join('\n');
  }

  return [
    'NusaBridge memiliki dua peran akun:',
    '',
    '**Eksportir (seller)** — untuk pelaku usaha Indonesia yang menampilkan produk dan mempelajari alur ekspor. Fokus: profil usaha, informasi produk, alur RFQ, draf dokumen, data KYC, dan simulasi Escrow.',
    '',
    '**Importir (buyer)** — untuk pembeli luar negeri yang menelusuri katalog. Fokus: spesifikasi produk, pengajuan RFQ, Incoterms dan dokumen, serta simulasi Escrow.',
    '',
    `Peran akun Anda saat ini adalah **${current.id}**. Peran memengaruhi panduan dan konteks jawaban AI, tetapi tidak membuka dashboard transaksi atau ruang negosiasi terpisah.`,
  ].join('\n');
}

function accountReply(lang = 'id') {
  return lang === 'en'
    ? [
      'To create an account, click **Register** in the navigation bar. In the modal, choose **Exporter (seller)** or **Importer (buyer)**, enter the business name and email, optionally upload a logo, then continue. The session is stored in the browser.',
      '',
      'The login modal uses the same role tabs. The website does not currently provide password-based account recovery, a seller dashboard, or product upload. Logging out removes the local session.',
    ].join('\n')
    : [
      'Untuk membuat akun, klik **Daftar** di navigation bar. Pada modal, pilih **Eksportir (seller)** atau **Importir (buyer)**, isi nama usaha dan email, unggah logo bila perlu, lalu lanjutkan. Sesi disimpan di browser.',
      '',
      'Modal masuk memakai pilihan peran yang sama. Website belum menyediakan pemulihan kata sandi, dashboard penjual, atau unggah produk. Keluar akun akan menghapus sesi lokal.',
    ].join('\n');
}

function rfqReply(lang = 'id') {
  return lang === 'en'
    ? [
      '**RFQ flow on NusaBridge:**',
      '',
      '1. Open the Products page and choose a product.',
      '2. Click **Ajukan RFQ** (Submit RFQ).',
      '3. The product is preselected. Enter the quantity, choose Incoterms (FOB, CIF, CNF, or EXW), the destination port, and a contact email.',
      '4. Click **Kirim RFQ**. The site returns an RFQ number, the request details, the status **submitted — awaiting review**, and process steps.',
      '5. Use **Perbarui Status** to fetch the latest status for that RFQ number.',
      '',
      'An RFQ receipt is not proof of payment or a confirmed order. The website does not automatically send the request to a supplier, collect quotations, compare offers, or provide a negotiation dashboard.',
    ].join('\n')
    : [
      '**Alur RFQ di NusaBridge:**',
      '',
      '1. Buka halaman Produk dan pilih produk.',
      '2. Klik **Ajukan RFQ**.',
      '3. Produk sudah terpilih. Isi jumlah, pilih Incoterms (FOB, CIF, CNF, atau EXW), pelabuhan tujuan, dan email kontak.',
      '4. Klik **Kirim RFQ**. Website menampilkan nomor RFQ, detail permintaan, status **Diajukan — menunggu peninjauan**, dan tahapan proses.',
      '5. Gunakan **Perbarui Status** untuk mengambil status terbaru nomor RFQ tersebut.',
      '',
      'Bukti RFQ bukan bukti pembayaran atau pesanan yang sudah disepakati. Website tidak otomatis mengirim permintaan ke pemasok, menerima penawaran, membandingkan penawaran, atau menyediakan dashboard negosiasi.',
    ].join('\n');
}

function pdfReply(lang = 'id') {
  return lang === 'en'
    ? [
      '**Auto-PDF** is on the AI Solutions page, in the **Auto-PDF Document Generator** tab. It can produce a draft Proforma Invoice or Sales Contract from the form, then let you print or copy the draft.',
      '',
      'The output is a draft for review. NusaBridge does not issue officially verified documents, does not submit them to Customs, and does not replace a legal or trade advisor.',
    ].join('\n')
    : [
      '**Auto-PDF** ada di halaman Solusi AI, tab **Auto-PDF Document Generator**. Fitur ini membuat draf Proforma Invoice atau Sales Contract dari formulir, lalu dapat dicetak atau disalin.',
      '',
      'Hasilnya adalah draf untuk ditinjau. NusaBridge tidak menerbitkan dokumen yang sudah diverifikasi resmi, tidak mengirimkannya ke Bea Cukai, dan tidak menggantikan penasihat hukum atau perdagangan.',
    ].join('\n');
}

function kycReply(lang = 'id') {
  return lang === 'en'
    ? [
      '**KYC Hub** is on the AI Solutions page. It simulates a compliance check using the NIB and NPWP you enter, then shows a checklist for the selected destination country.',
      '',
      'This is a simulation and educational checklist. It does not verify data against OSS, Customs, or a foreign authority, and the result is not an official compliance certificate.',
    ].join('\n')
    : [
      '**KYC Hub** ada di halaman Solusi AI. Fitur ini menyimulasikan pemeriksaan kepatuhan memakai NIB dan NPWP yang Anda masukkan, lalu menampilkan checklist untuk negara tujuan yang dipilih.',
      '',
      'Ini adalah simulasi dan checklist edukatif. Fitur tidak memverifikasi data ke OSS, Bea Cukai, atau otoritas negara tujuan, dan hasilnya bukan sertifikat kepatuhan resmi.',
    ].join('\n');
}

function escrowReply(lang = 'id') {
  return lang === 'en'
    ? [
      '**Escrow Vault** on NusaBridge is a simulation of a four-phase payout:',
      '',
      '- Phase 1 — 30% when the contract is agreed',
      '- Phase 2 — 30% when the PEB/stuffing milestone is reached',
      '- Phase 3 — 20% when the vessel sails and the B/L is issued',
      '- Phase 4 — 20% when the cargo arrives and the buyer confirms',
      '',
      'You can click the phase buttons on the AI Solutions page to see example notifications. The website does not process real payments, hold funds, or act as a licensed escrow service.',
    ].join('\n')
    : [
      '**Escrow Vault** di NusaBridge adalah simulasi pencairan empat fase:',
      '',
      '- Fase 1 — 30% saat kontrak disepakati',
      '- Fase 2 — 30% saat milestone PEB/stuffing tercapai',
      '- Fase 3 — 20% saat kapal berlayar dan B/L terbit',
      '- Fase 4 — 20% saat kargo tiba dan buyer mengonfirmasi',
      '',
      'Klik tombol fase di halaman Solusi AI untuk melihat contoh notifikasinya. Website tidak memproses pembayaran sungguhan, tidak menyimpan dana, dan bukan layanan escrow berlisensi.',
    ].join('\n');
}

function pricingReply(lang = 'id') {
  return lang === 'en'
    ? [
      'The **Pricing** page has three options: a free Starter/Sandbox plan, a paid UMKM Exporter plan (1 month, 5 months, or 1 year), and a custom Enterprise plan via WhatsApp. A 15% subsidy voucher is available for the 5-month and 12-month options.',
      '',
      'Prices, taxes, and voucher terms are shown on the Pricing page. NusaBridge does not process payment on this website; the page provides plan information and a contact route.',
    ].join('\n')
    : [
      'Halaman **Harga** memiliki tiga pilihan: paket Starter/Sandbox gratis, paket UMKM Eksportir berbayar (1 bulan, 5 bulan, atau 1 tahun), dan paket Enterprise kustom melalui WhatsApp. Voucher subsidi 15% tersedia untuk pilihan 5 bulan dan 12 bulan.',
      '',
      'Harga, pajak, dan ketentuan voucher ditampilkan di halaman Harga. NusaBridge tidak memproses pembayaran di website ini; halaman tersebut menyediakan informasi paket dan jalur kontak.',
    ].join('\n');
}

function featuresReply(lang = 'id') {
  return lang === 'en'
    ? [
      '**NusaBridge website features:**',
      '',
      '- **Product catalog** — 50 products across coffee, spices, crafts, and textiles, with search, filters, sorting, specifications, and RFQ.',
      '- **NusaBridge AI chat** — explains website features and general export-import guidance.',
      '- **AI Solutions studio** — RFQ Studio, Auto-PDF drafts, KYC Hub simulation, and Escrow Vault simulation.',
      '- **Accounts** — exporter or importer role, business profile, logo, and Indonesian/English interface.',
      '- **Pricing page** — plan information, subsidy voucher, and an estimate calculator.',
      '',
      'Ask about one feature if you want the detailed flow.',
    ].join('\n')
    : [
      '**Fitur website NusaBridge:**',
      '',
      '- **Katalog produk** — 50 produk kopi, rempah, kriya, dan tekstil, dengan pencarian, filter, sortir, spesifikasi, dan RFQ.',
      '- **Chat NusaBridge AI** — menjelaskan fitur website dan panduan umum ekspor-impor.',
      '- **Studio Solusi AI** — RFQ Studio, draf Auto-PDF, simulasi KYC Hub, dan simulasi Escrow Vault.',
      '- **Akun** — peran eksportir atau importir, profil usaha, logo, dan antarmuka Indonesia/Inggris.',
      '- **Halaman Harga** — informasi paket, voucher subsidi, dan kalkulator estimasi.',
      '',
      'Tanyakan salah satu fitur jika ingin alur detailnya.',
    ].join('\n');
}

function aboutReply(lang = 'id') {
  return lang === 'en'
    ? [
      '**NusaBridge** is an information and simulation website for Indonesian SME export-import trade. It brings together a curated product catalog, an AI assistant, draft document tools, a KYC checklist simulation, and an Escrow payout simulation.',
      '',
      'NusaBridge is a platform, not a seller, producer, bank, or official verification authority. Product data comes from the catalog; regulations and trade requirements must still be verified with the relevant authorities.',
      '',
      'The site has Home, Products, AI Solutions, and Pricing pages, plus exporter/importer accounts.',
    ].join('\n')
    : [
      '**NusaBridge** adalah website informasi dan simulasi perdagangan ekspor-impor untuk UMKM Indonesia. Website ini menggabungkan katalog produk kurasi, asisten AI, alat draf dokumen, simulasi checklist KYC, dan simulasi pencairan Escrow.',
      '',
      'NusaBridge adalah platform, bukan penjual, produsen, bank, atau otoritas verifikasi resmi. Data produk berasal dari katalog; regulasi dan persyaratan perdagangan tetap harus diverifikasi ke instansi terkait.',
      '',
      'Halaman yang tersedia: Beranda, Produk, Solusi AI, dan Harga, ditambah akun eksportir/importir.',
    ].join('\n');
}

function navigationReply(lang = 'id') {
  return lang === 'en'
    ? [
      '**Website map:**',
      '',
      '- **Home** — platform overview, export flow, and registration CTA.',
      '- **Products** — catalog, search/filter/sort, specifications, and RFQ.',
      '- **AI Solutions** — AI chat, four pillars, and the interactive studio.',
      '- **Pricing** — plans, voucher, and estimate calculator.',
      '- **Login/Register** — account modal with exporter/importer roles.',
      '',
      'Tell me which page you are on and what you want to do, and I will explain the steps.',
    ].join('\n')
    : [
      '**Peta halaman website:**',
      '',
      '- **Beranda** — ringkasan platform, alur ekspor, dan CTA pendaftaran.',
      '- **Produk** — katalog, pencarian/filter/sortir, spesifikasi, dan RFQ.',
      '- **Solusi AI** — chat AI, empat pilar, dan studio interaktif.',
      '- **Harga** — paket, voucher, dan kalkulator estimasi.',
      '- **Masuk/Daftar** — modal akun dengan peran eksportir/importir.',
      '',
      'Sebutkan halaman yang sedang Anda buka dan tujuan Anda, nanti saya jelaskan langkahnya.',
    ].join('\n');
}

function aiScopeReply(lang = 'id') {
  return lang === 'en'
    ? 'I answer questions about the NusaBridge website and general export-import guidance. I do not answer unrelated topics such as programming, recipes, politics, entertainment, or general AI theory. I also will not invent features, prices, stock, transaction status, or regulations.'
    : 'Saya menjawab pertanyaan tentang website NusaBridge dan panduan umum ekspor-impor. Saya tidak menjawab topik di luar itu seperti pemrograman, resep, politik, hiburan, atau teori AI umum. Saya juga tidak mengarang fitur, harga, stok, status transaksi, atau regulasi.';
}

function contactReply(lang = 'id') {
  return lang === 'en'
    ? 'For support, use the contact details shown on the Home page: **support@nusabridge.id** or WhatsApp **+62 857-3580-0491**. The website itself does not provide a live support chat or ticketing system.'
    : 'Untuk bantuan, gunakan kontak yang tercantum di halaman Beranda: **support@nusabridge.id** atau WhatsApp **+62 857-3580-0491**. Website belum menyediakan live support chat atau sistem tiket.';
}

function tradeReply(text, lang = 'id', reference = null) {
  if (reference?.answer) return reference.answer;

  const isEn = lang === 'en';
  const asksImport = /(impor|import)/i.test(text);
  const asksDocs = /(dokumen|invoice|packing|bill of lading|peb|coo|sertifikat)/i.test(text);
  const asksIncoterms = /(incoterm|fob|cif|cfr|cnf|exw)/i.test(text);
  const asksHs = /(hs code|kode hs|harmonized)/i.test(text);
  const asksLegal = /(nib|npwp|oss|karantina|izin|legalitas|sertifikasi)/i.test(text);
  const asksPayment = /(pembayaran|payment|escrow|rekber|asuransi)/i.test(text);

  if (asksIncoterms) {
    return isEn
      ? 'Incoterms 2020 defines who handles costs, risks, and tasks between seller and buyer. Common choices are **EXW** (buyer collects at the seller’s premises), **FOB** (seller delivers on board at the origin port), **CFR/CNF** (seller pays freight, buyer insures), and **CIF** (seller pays freight and insurance). The exact choice must match the contract. NusaBridge only records the selected Incoterm in an RFQ; it does not determine the final price or legal responsibility.'
      : 'Incoterms 2020 mengatur pembagian biaya, risiko, dan tugas antara penjual dan pembeli. Pilihan umum: **EXW** (pembeli mengambil di lokasi penjual), **FOB** (penjual menyerahkan barang di atas kapal pelabuhan asal), **CFR/CNF** (penjual membayar freight, pembeli mengasuransikan), dan **CIF** (penjual membayar freight dan asuransi). Pilihan harus sesuai kontrak. NusaBridge hanya mencatat Incoterm yang dipilih pada RFQ; website tidak menetapkan harga final atau tanggung jawab hukum.'
    ;
  }

  if (asksDocs) {
    return isEn
      ? 'Export documents usually include a commercial invoice, packing list, Bill of Lading or Air Waybill, and a Certificate of Origin or other certificates when required. Some goods also need quarantine, phytosanitary, or destination-specific approvals. Confirm the exact set with Customs/INSW and the buyer before shipment. NusaBridge can prepare **draft** Proforma Invoice and Sales Contract documents, but does not issue official documents.'
      : 'Dokumen ekspor umumnya mencakup commercial invoice, packing list, Bill of Lading atau Air Waybill, serta Certificate of Origin atau sertifikat lain bila diwajibkan. Sebagian barang juga memerlukan karantina, fitosanitari, atau izin khusus negara tujuan. Pastikan daftar finalnya ke Bea Cukai/INSW dan buyer sebelum pengiriman. NusaBridge dapat menyiapkan **draf** Proforma Invoice dan Sales Contract, tetapi tidak menerbitkan dokumen resmi.'
    ;
  }

  if (asksHs) {
    return isEn
      ? 'An HS code classifies goods for customs. The code affects tariffs, permits, and document requirements. Use the product’s HS code as a starting point, then verify the classification and current tariff with INSW or Customs. NusaBridge shows catalog HS codes but does not issue an official classification.'
      : 'Kode HS mengklasifikasikan barang untuk kepabeanan. Kode ini memengaruhi tarif, izin, dan persyaratan dokumen. Gunakan kode HS pada produk sebagai titik awal, lalu verifikasi klasifikasi dan tarif terbaru melalui INSW atau Bea Cukai. NusaBridge menampilkan kode HS dari katalog, tetapi tidak menerbitkan klasifikasi resmi.'
    ;
  }

  if (asksLegal) {
    return isEn
      ? 'For export legality, start with the business registration (NIB through OSS) and the permits that match the goods and destination. Some products also need quarantine, phytosanitary, SVLK, FDA, EUDR, or JAS-related documents. Verify requirements with OSS, Customs/INSW, the quarantine authority, and the destination authority. The KYC Hub on NusaBridge is a checklist simulation, not official verification.'
      : 'Untuk legalitas ekspor, mulai dari izin usaha (NIB melalui OSS) dan izin yang sesuai dengan barang serta negara tujuan. Sebagian produk juga memerlukan karantina, fitosanitari, SVLK, FDA, EUDR, atau dokumen terkait JAS. Verifikasi persyaratan ke OSS, Bea Cukai/INSW, otoritas karantina, dan otoritas negara tujuan. KYC Hub di NusaBridge adalah simulasi checklist, bukan verifikasi resmi.'
    ;
  }

  if (asksPayment) {
    return isEn
      ? 'Export payment methods include advance payment, letters of credit, documentary collections, and open account terms. Each has different risk. Escrow Vault on NusaBridge is only a simulation of milestone payouts; it is not a licensed payment or escrow service. For real transactions, use a bank or licensed provider and a clear contract.'
      : 'Metode pembayaran ekspor mencakup pembayaran di muka, letter of credit, documentary collection, dan open account. Risikonya berbeda-beda. Escrow Vault di NusaBridge hanya simulasi pencairan bertahap; bukan layanan pembayaran atau escrow berlisensi. Untuk transaksi nyata, gunakan bank atau penyedia berlisensi dan kontrak yang jelas.'
    ;
  }

  if (asksImport) {
    return isEn
      ? 'To prepare an import into Indonesia, start with a complete goods description and HS classification, check tariffs and restrictions through INSW, confirm the required permits, and prepare the supplier documents (commercial invoice, packing list, B/L or AWB, and COO if required). Then process the import declaration (PIB) through the official procedure. Requirements depend on the goods, origin, and current rules.'
      : 'Untuk menyiapkan impor ke Indonesia, mulai dari deskripsi barang dan klasifikasi HS, cek tarif serta larangan/pembatasan melalui INSW, pastikan izin yang diperlukan, dan siapkan dokumen pemasok (commercial invoice, packing list, B/L atau AWB, dan COO bila diwajibkan). Lalu proses PIB melalui prosedur resmi. Persyaratan bergantung pada barang, asal, dan aturan yang berlaku.'
    ;
  }

  return isEn
    ? 'For export-import questions, I can help with general steps, documents, Incoterms, HS codes, legality, payment methods, and shipping. Tell me the product, destination country, and stage you are at so I can keep the answer specific. Always verify final requirements with the relevant authority.'
    : 'Untuk pertanyaan ekspor-impor, saya dapat membantu langkah umum, dokumen, Incoterms, kode HS, legalitas, metode pembayaran, dan pengiriman. Sebutkan produk, negara tujuan, dan tahap yang sedang Anda hadapi agar jawabannya spesifik. Selalu verifikasi persyaratan final ke instansi terkait.';
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
        '- **Fitur Ekspor & Impor**: Alur RFQ, otomasi draf Auto-PDF (Proforma Invoice & Sales Contract), validasi kepatuhan KYC Hub, dan simulasi 4 fase Escrow Vault',
        '- **Peran Akun**: Eksportir Indonesia (Seller) dan Importir Global (Buyer)',
        '- **Regulasi & Dokumen**: Incoterms 2020 (FOB vs CIF), kepabeanan (PEB/PIB, B/L, COO), dan standar negara tujuan (FDA USA, EUDR Uni Eropa, JAS Jepang, Halal UEA)',
        '',
        'Silakan ketik pertanyaan spesifik seputar topik di atas agar saya dapat memberikan jawaban yang tepat.'
      ].join('\n');
}

function generalWebsiteReply(text, lang = 'id') {
  const isEn = lang === 'en';
  return isEn
    ? [
        '**NusaBridge AI Trade Assistant**',
        '',
        'NusaBridge is an all-in-one trade facilitation and education platform for Indonesian SME export-import:',
        '- **Product Catalog** — 50 curated commodities (Coffee, Spices, Crafts, Textiles) with lab parameters and HS codes.',
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
        '- **RFQ Studio** — mengubah permintaan buyer menjadi kuotasi terstruktur berstandar Incoterms 2020.',
        '- **Auto-PDF Generator** — menerbitkan draf resmi Proforma Invoice dan Sales Contract siap cetak.',
        '- **KYC Hub** — memvalidasi NIB 13 digit OSS RBA dan memeriksa kepatuhan standar USA (FDA), Uni Eropa (EUDR), Jepang (JAS), dan UEA (Halal BPJPH).',
        '- **Escrow Vault** — simulasi pencairan dana 4 tahap (30% kontrak, 30% PEB, 20% B/L, 20% tiba) untuk mencegah risiko gagal bayar.',
        '- **Radar Maritim** — pelacakan rute dan telemetri AIS kapal kargo internasional.',
        '',
        'Silakan tanyakan langkah spesifik yang ingin Anda ketahui: cara pesan di katalog, panduan alur ekspor/impor, kegunaan akun seller/buyer, atau ketentuan dokumen perdagangan!'
      ].join('\n');
}

function detectIntent(message, products = FALLBACK_PRODUCTS) {
  const text = normalize(message);

  // Off-topic harus dicek lebih dulu agar "halo, buatkan resep" tidak lolos
  // sebagai sapaan biasa.
  if (detectOffTopic(message)) return 'off-topic';
  if (isGreeting(message)) return 'greeting';
  if (isGenericCategoryQuery(text) || isProductListQuery(text)) return 'catalog-list';

  const matches = findMatchingProducts(message, products);
  if (isProductDetailQuery(text, matches)) return 'product';

  if (/(bisa|boleh|apakah bisa|kamu bisa).*(chat|tanya|ngobrol|konsultasi).*(bebas|apa saja|apa aja)|(chat|tanya).*(bebas|apa saja)/i.test(text)) {
    return 'chat-free';
  }
  if (/(fitur|fasilitas|layanan|alat).*(ekspor|seller|penjual)|(ekspor|seller).*(fitur|fasilitas|keunggulan)/i.test(text)) {
    return 'export-features';
  }
  if (/(fitur|fasilitas|layanan|alat).*(impor|buyer|pembeli)|(impor|buyer).*(fitur|fasilitas|keunggulan)/i.test(text)) {
    return 'import-features';
  }
  if (/(siapa|siapakah|tim|asal).*(pembuat|pengembang|bikin|buat|dibuat|developer|pencipta)|(pembuat|pengembang|bikin|buat|dibuat|developer|pencipta).*(siapa|siapakah)|arjika|antartika/i.test(text)) {
    return 'developer';
  }
  if (/(peran|role|seller|buyer|eksportir|importir|akun eksportir|akun importir|beda seller|difference between seller)/i.test(text)) {
    return 'roles';
  }
  if (/(daftar|register|masuk|login|akun|profil|logo|logout|keluar akun)/i.test(text)) {
    return 'account';
  }
  if (/(rfq|request for quotation|kuotasi|permintaan harga|permintaan penawaran|ajukan penawaran)/i.test(text)) {
    return 'rfq';
  }
  if (/(auto pdf|auto-pdf|proforma|sales contract|generate dokumen|dokumen pdf|fitur dokumen|cetak dokumen)/i.test(text)) {
    return 'pdf';
  }
  if (/(kyc|verifikasi nib|audit legalitas|cek nib|fitur kyc|kyc hub)/i.test(text)) {
    return 'kyc';
  }
  if (/(escrow|vault|rekber|pembayaran aman|pencairan dana)/i.test(text)) {
    return 'escrow';
  }
  if (/(paket|pricing|langganan|harga website|biaya langganan|voucher|subsidi|plan)/i.test(text)) {
    return 'pricing';
  }
  if (/(ai ini|asisten ini|chatbot|bisa jawab apa|batasan|off topic|di luar topik|scope|cakupan|kamu bisa apa|cara kerja ai|apa itu ai)/i.test(text)) {
    return 'ai-scope';
  }
  if (/(fitur|pilar|kemampuan|bisa apa|apa saja yang bisa|menu|layanan|feature)/i.test(text)) {
    return 'features';
  }
  if (/(tentang|nusabridge|platform ini|siapa kamu|kamu siapa|who are you|apa ini|about)/i.test(text)) {
    return 'about';
  }
  if (/(halaman|navigasi|link|di mana|where|page)/i.test(text)) {
    return 'navigation';
  }
  if (/(kontak|hubungi|support|bantuan|email|whatsapp|contact)/i.test(text)) {
    return 'contact';
  }
  if (/(ekspor|impor|export|import|incoterm|fob|cif|cfr|cnf|exw|dokumen|hs code|kode hs|nib|npwp|oss|karantina|bea cukai|pabean|buyer|supplier|pemasok|logistik|kontainer|pengiriman|asuransi|invoice|packing list|peb|coo|negara tujuan|pembayaran)/i.test(text)) {
    return 'trade';
  }

  return 'unknown';
}

/**
 * Jawaban fallback deterministik. Selalu mengembalikan string, tidak pernah
 * melempar error, sehingga endpoint AI tetap bisa menjawab tanpa API key.
 */
function buildFallbackReply({
  message = '',
  lang = 'id',
  role = 'guest',
  page = '',
  products = FALLBACK_PRODUCTS,
  reference = null,
} = {}) {
  const raw = String(message || '').trim();
  const isEn = lang === 'en';
  if (!raw) {
    return isEn
      ? 'Please type a question about the NusaBridge website or export-import guidance.'
      : 'Silakan ketik pertanyaan tentang website NusaBridge atau panduan ekspor-impor.';
  }

  // 1. Off-topic guardrail: immediately reject and do NOT answer off-topic content
  if (detectOffTopic(raw)) return offTopicReply(lang);

  // 2. Greeting check
  if (isGreeting(raw)) return greetingReply(role, lang);

  // 2b. Catalog list questions with an explicit category must list that
  // category (or every requested category), not a generic reference answer.
  const rawNorm = normalize(raw);
  const pageLabel = getPageLabel(page, lang);
  if (isProductListQuery(rawNorm) && categoriesFromText(raw).length > 0) {
    const catalogText = formatCatalogList(raw, lang, products);
    return pageLabel ? `${catalogText}\n\n${isEn ? `You are currently on the **${pageLabel}** page.` : `Anda sedang berada di halaman **${pageLabel}**.`}` : catalogText;
  }

  // 3. Resolve reference answer with high score first
  const activeRef = reference || findReferenceAnswer(raw, lang);
  if (activeRef?.answer && (activeRef.score == null || activeRef.score >= 18)) {
    return activeRef.answer;
  }

  const textNorm = rawNorm;

  // 4. Catalog list or category overview check
  if (isGenericCategoryQuery(textNorm) || isProductListQuery(textNorm)) {
    const catalogText = formatCatalogList(raw, lang, products);
    return pageLabel ? `${catalogText}\n\n${isEn ? `You are currently on the **${pageLabel}** page.` : `Anda sedang berada di halaman **${pageLabel}**.`}` : catalogText;
  }

  // 5. Specific product match check
  const matches = findMatchingProducts(raw, products);
  if (isProductDetailQuery(textNorm, matches)) {
    return formatProduct(matches[0], lang);
  }

  // 6. If reference answer matched with any positive score, use it
  if (activeRef?.answer) {
    return activeRef.answer;
  }

  const intent = detectIntent(raw, products);

  switch (intent) {
    case 'chat-free':
      return activeRef?.answer || chatFreeReply(lang);
    case 'export-features':
      return activeRef?.answer || exportFeaturesReply(lang);
    case 'import-features':
      return activeRef?.answer || importFeaturesReply(lang);
    case 'developer':
      return activeRef?.answer || developerReply(lang);
    case 'roles':
      return roleReply(role, lang);
    case 'account':
      return accountReply(lang);
    case 'rfq':
      return rfqReply(lang);
    case 'pdf':
      return pdfReply(lang);
    case 'kyc':
      return kycReply(lang);
    case 'escrow':
      return escrowReply(lang);
    case 'pricing':
      return pricingReply(lang);
    case 'ai-scope':
      return aiScopeReply(lang);
    case 'features':
      return featuresReply(lang);
    case 'about':
      return aboutReply(lang);
    case 'navigation':
      return navigationReply(lang);
    case 'contact':
      return contactReply(lang);
    case 'trade':
      return tradeReply(raw, lang, activeRef);
    default:
      if (activeRef?.answer) return activeRef.answer;
      return unknownReply(lang);
  }
}

/**
 * System prompt untuk Groq. Fakta website dan katalog dimasukkan agar model
 * tidak mengarang fitur/harga, dan aturan off-topic ditegaskan.
 */
function buildSystemPrompt({
  lang = 'id',
  role = 'guest',
  page = '',
  products = [],
  referenceAnswer = '',
} = {}) {
  const isEn = lang === 'en';
  const normalizedRole = normalizeRole(role);
  const roleInfo = ROLE_INFO[normalizedRole];
  const pageLabel = getPageLabel(page, lang);
  const facts = isEn ? WEBSITE_FACTS_EN : WEBSITE_FACTS_ID;

  const catalogLines = (Array.isArray(products) ? products : [])
    .slice(0, 12)
    .map((product) => JSON.stringify({
      name: product.name,
      category: product.category,
      origin: product.origin,
      priceUSD: product.price,
      unit: product.unit,
      moq: product.moq,
      hsCode: product.hsCode,
      description: product.desc,
      specifications: product.specs,
      certifications: product.certs,
      shipping: product.shipping,
    }))
    .join('\n');

  return isEn ? `You are NusaBridge AI, an intelligent export-import assistant specifically for UMKM (Indonesian SMEs) and the NusaBridge website.

CORE PRINCIPLES:
1. THINK FIRST - Understand the question thoroughly before answering. Consider context from conversation history.
2. BE ACCURATE - Only answer based on verified facts. If information is unknown or not available, be honest and say so.
3. STAY FOCUSED - You ONLY discuss export-import, trade, UMKM, and the NusaBridge website. Nothing else.
4. BE RELEVANT - Give clear, practical answers tailored to SMEs.
5. CONTEXT AWARE - Maintain conversation context and handle follow-up questions properly.

MANDATORY RULES:
1. Answer ONLY the user's latest question directly and concisely. Do not go off-topic or repeat the question.
2. Scope: NusaBridge website (pages, export/import features, account roles seller/buyer, RFQ flow, Auto-PDF, KYC Hub, Escrow Vault, pricing plans, commodity catalog) and general international trade for export-import.
3. NEVER answer off-topic questions (recipes, coding, gossip, movies/games, sports, politics, health/medicine, math/general science, or AI theory). Politely refuse in 1-2 sentences and redirect to export-import or NusaBridge website topics. DO NOT answer the off-topic content.
4. If asked "can I chat freely?" or similar, respond that yes you can discuss anything related to NusaBridge website and export-import, and give examples.
5. Do not invent features, menus, transaction status, prices, stock, regulations, or product data. Use only website facts and catalog data below. If unavailable, say it's not available.
6. NusaBridge is a trade facilitation and education platform - not a direct seller, commodity producer, bank, or customs authority. Auto-PDF, KYC Hub, Escrow Vault are draft/simulation modules for education.
7. If ambiguous, ask ONE short clarifying question. If clear, answer directly.
8. Current role: ${roleInfo.en}. Role focus: ${roleInfo.focusEn}. Do not claim role unlocks features that don't exist.
${pageLabel ? `9. User is on page: ${pageLabel}.` : '9. Page unknown; do not guess.'}
10. Respond in English. Use clean Markdown, no raw HTML.
11. For product questions, only state fields that exist in catalog data. Do not add quality claims, market fit, or unlisted Incoterms.

${facts}

${catalogLines ? `RELEVANT CATALOG DATA (${Math.min(products.length, 12)} of ${products.length}):\n${catalogLines}` : 'CATALOG DATA: No matching products; do not invent product details.'}

${referenceAnswer ? `RELATED TRADE REFERENCE (use only if relevant):\n${referenceAnswer}` : ''}` : `Kamu adalah NusaBridge AI, asisten cerdas ekspor-impor khusus untuk UMKM Indonesia dan website NusaBridge.

PRINSIP UTAMA:
1. BERPIKIR TERLEBIH DAHULU - Pahami pertanyaan dengan baik sebelum menjawab. Pertimbangkan konteks percakapan.
2. AKURAT - Hanya jawab berdasarkan fakta yang terverifikasi. Jika informasi tidak diketahui, jujur katakan.
3. FOKUS - Hanya bahas ekspor-impor, perdagangan, UMKM, dan website NusaBridge.
4. RELEVAN - Beri jawaban jelas dan praktis untuk UMKM.
5. PEDULI KONTEKS - Pahami konteks percakapan dan pertanyaan lanjutan.

ATURAN WAJIB:
1. Jawab HANYA pertanyaan terbaru pengguna secara langsung, padat, dan akurat. Jangan membahas di luar pertanyaan. Jangan mengulang pertanyaan.
2. Cakupan: website NusaBridge (halaman, fitur ekspor/impor, peran akun seller/buyer, alur RFQ, Auto-PDF, KYC Hub, Escrow Vault, paket harga, katalog komoditas) dan tata niaga umum ekspor-impor internasional.
3. JANGAN PERNAH menjawab pertanyaan di luar cakupan (resep masakan, koding, gosip, film/game, olahraga, politik, kesehatan/obat, matematika/sains umum, teori AI). Jika ditanya, tolak tegas dan sopan dalam 1-2 kalimat serta tawarkan topik perdagangan ekspor-impor atau website NusaBridge. JANGAN jawab isi pertanyaan luar cakupan.
4. Jika ditanya "bisa chat bebas?", jawab ramah bahwa bisa bertanya seputar website NusaBridge dan ekspor-impor, berikan contoh topik.
5. Jangan mengarang fitur, menu, status transaksi, harga, stok, regulasi, atau data produk. Gunakan hanya fakta website dan data katalog. Jika tidak ada, katakan tidak tersedia.
6. NusaBridge adalah platform fasilitasi perdagangan dan edukasi, bukan penjual langsung, produsen komoditas, bank, atau otoritas pabean. Auto-PDF, KYC Hub, Escrow Vault adalah modul draf dan simulasi edukatif.
7. Jika ambigu, ajukan SATU pertanyaan klarifikasi singkat. Jika jelas, langsung jawab.
8. Peran saat ini: ${roleInfo.id}. Fokus peran: ${roleInfo.focusId}. Jangan klaim peran membuka fitur yang tidak ada.
${pageLabel ? `9. Pengguna berada di halaman: ${pageLabel}.` : '9. Halaman tidak diketahui; jangan mengarang.'}
10. Jawab dalam bahasa Indonesia. Format Markdown bersih, tanpa HTML mentah.
11. Untuk pertanyaan produk, sebutkan hanya field yang ada di data katalog. Jangan tambah klaim kualitas, kecocokan pasar, atau Incoterm yang tidak tercantum.

${facts}

${catalogLines ? `DATA KATALOG RELEVAN (${Math.min(products.length, 12)} dari ${products.length}):\n${catalogLines}` : 'DATA KATALOG: tidak ada produk cocok; jangan mengarang detail produk.'}

${referenceAnswer ? `RUJUKAN PERDAGANGAN TERKAIT (gunakan hanya jika relevan):\n${referenceAnswer}` : ''}`;
}

module.exports = {
  FALLBACK_PRODUCTS,
  CATALOG_COUNTS,
  CATEGORY_LABELS,
  ROLE_INFO,
  WEBSITE_FACTS_ID,
  WEBSITE_FACTS_EN,
  normalizeRole,
  normalize,
  isGreeting,
  detectOffTopic,
  detectIntent,
  findMatchingProducts,
  buildFallbackReply,
  buildSystemPrompt,
  getPageLabel,
  offTopicReply,
};
