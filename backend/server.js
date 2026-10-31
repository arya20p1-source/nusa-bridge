/**
 * ==========================================================================
 * NUSABRIDGE - BACKEND REST API & GEMINI AI AGENT ENGINE
 * File: server.js
 * Deskripsi: Server Express dengan Database JavaScript native & AI Agent
 * NusaBridge Prototype
 * ==========================================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./database/db-supabase');
const { findReferenceAnswer } = require('./reference-answers');

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (struktur folder terpisah: frontend & backend)
// frontend/public  -> aset statis (assets, favicon)
// frontend/dist    -> hasil `npm run build` (SPA React)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(path.join(FRONTEND_DIR, 'public')));

const DIST_DIR = path.join(FRONTEND_DIR, 'dist');
const fs = require('fs');
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  // Aset hasil build Vite (JS/CSS/aset hasil hash)
  app.use(express.static(DIST_DIR));

  // SPA fallback: semua route non-API diarahkan ke index.html React Router
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// ==========================================================================
// 1. HEALTH CHECK
// ==========================================================================
app.get('/api/health', async (req, res) => {
  try {
    const database = await db.healthCheck();
    res.json({
      status: 'online',
      platform: 'NusaBridge AI Trade Facilitation Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: db.provider,
      databaseConfigured: database.configured,
      databaseConnected: database.connected,
      databaseReady: database.ready,
      databaseCatalogReady: database.tables.find((table) => table.name === 'products').rowCount > 0,
      databaseTables: database.tables.map(({ name, table, available }) => ({
        name,
        table,
        available,
      })),
    });
  } catch (err) {
    console.error('[Health Check]:', err.message);
    res.status(503).json({
      status: 'degraded',
      platform: 'NusaBridge AI Trade Facilitation Engine',
      timestamp: new Date().toISOString(),
      database: db.provider,
      databaseConfigured: db.configured,
      databaseConnected: false,
      databaseReady: false,
      databaseCatalogReady: false,
    });
  }
});

// ==========================================================================
// 2. AUTHENTICATION (REGISTER & LOGIN)
// ==========================================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, company, role = 'seller', nib, npwp, plan = 'Free Trial' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi.' });
    }

    // Cek apakah email sudah terdaftar
    const existing = await db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.json({
        success: true,
        message: 'Akun sudah terdaftar. Berhasil masuk langsung!',
        user: existing,
        token: `nb_token_${existing.id}_${Date.now()}`
      });
    }

    // Buat user baru
    const newUser = await db.create('users', {
      name,
      email,
      company: company || name,
      role, // 'seller' atau 'buyer'
      nib: nib || '12' + Math.floor(10000000000 + Math.random() * 90000000000),
      npwp: npwp || '01.' + Math.floor(100 + Math.random() * 900) + '.' + Math.floor(100 + Math.random() * 900) + '.0-012.000',
      status: 'verified',
      plan,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Akun Anda aktif dan otomatis login.',
      user: newUser,
      token: `nb_token_${newUser.id}_${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memproses registrasi: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
    }

    const user = await db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Untuk kemudahan demo prototipe lomba: jika email belum ada, auto-register!
      const autoUser = await db.create('users', {
        name: email.split('@')[0].toUpperCase(),
        email,
        company: `UMKM ${email.split('@')[0]}`,
        role: 'seller',
        nib: '1294801928415',
        status: 'verified',
        plan: 'Free Trial (1 Bulan)',
        createdAt: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: 'Akun demo baru berhasil dibuat & otomatis login!',
        user: autoUser,
        token: `nb_token_${autoUser.id}_${Date.now()}`
      });
    }

    res.json({
      success: true,
      message: 'Login berhasil! Selamat datang kembali.',
      user,
      token: `nb_token_${user.id}_${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memproses login: ' + err.message });
  }
});

// ==========================================================================
// 3. PRODUCTS CATALOG (105+ KOMODITAS EKSPOR INDONESIA)
// ==========================================================================
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, page, limit, sort } = req.query;
    const result = await db.queryProducts({
      category: category || 'all',
      search: search || '',
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 12,
      sort: sort || 'featured'
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.findById('products', req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================================
// 4. REQUEST FOR QUOTATION (RFQ)
// ==========================================================================
app.post('/api/rfq', async (req, res) => {
  try {
    const { buyerName, buyerCompany, buyerCountry, productId, productName, quantity, unit, targetIncoterms, targetPriceUSD } = req.body;
    const buyerEmail = String(req.body.buyerEmail || '').trim().toLowerCase();
    const cleanProductName = String(productName || '').trim();
    const cleanPort = String(buyerCountry || '').trim();
    const cleanIncoterms = String(targetIncoterms || '').trim().toUpperCase();
    const requestedQuantity = Number(quantity);
    const referencePrice = Number(targetPriceUSD);

    if (!cleanProductName || cleanProductName.length > 200) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi (maksimal 200 karakter).' });
    }
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah pesanan harus berupa angka lebih dari 0.' });
    }
    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return res.status(400).json({ success: false, message: 'Email kontak buyer wajib diisi dengan format yang valid.' });
    }
    if (!cleanPort || cleanPort.length > 120) {
      return res.status(400).json({ success: false, message: 'Pelabuhan tujuan wajib diisi (maksimal 120 karakter).' });
    }
    if (!['FOB', 'CIF', 'CNF', 'EXW'].includes(cleanIncoterms)) {
      return res.status(400).json({ success: false, message: 'Pilihan Incoterms tidak valid.' });
    }
    if (!Number.isFinite(referencePrice) || referencePrice < 0) {
      return res.status(400).json({ success: false, message: 'Harga acuan produk tidak valid.' });
    }

    const createdAt = new Date().toISOString();
    const buyer = buyerEmail.split('@')[0];

    const newRfq = await db.create('rfq', {
      buyerName: String(buyerName || buyer).trim(),
      buyerCompany: String(buyerCompany || '').trim(),
      buyerEmail,
      buyerCountry: cleanPort,
      productId: String(productId || '').trim() || null,
      productName: cleanProductName,
      quantity: requestedQuantity,
      unit: String(unit || 'unit').trim(),
      targetIncoterms: cleanIncoterms,
      targetPriceUSD: referencePrice,
      totalValueUSD: referencePrice * requestedQuantity,
      status: 'submitted',
      process: [
        {
          key: 'submitted',
          label: 'RFQ diterima',
          status: 'done',
          at: createdAt,
        },
        {
          key: 'review',
          label: 'Menunggu peninjauan dan penawaran',
          status: 'waiting',
          at: null,
        },
        {
          key: 'confirmed',
          label: 'Menunggu konfirmasi buyer',
          status: 'waiting',
          at: null,
        },
      ],
      createdAt,
    });

    res.status(201).json({
      success: true,
      message: 'Permintaan RFQ berhasil dicatat.',
      rfq: newRfq
    });
  } catch (err) {
    console.error('[RFQ submit]:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/rfq/:id', async (req, res) => {
  try {
    const rfq = await db.findById('rfq', req.params.id);
    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ tidak ditemukan.' });
    }

    const { id, productName, quantity, unit, targetIncoterms, buyerCountry, status, process, createdAt, updatedAt } = rfq;
    res.json({
      success: true,
      rfq: { id, productName, quantity, unit, targetIncoterms, buyerCountry, status, process, createdAt, updatedAt },
    });
  } catch (err) {
    console.error('[RFQ status]:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/rfq', async (req, res) => {
  try {
    const items = await db.read('rfq');
    const rfqs = items.map((rfq) =>
      Object.fromEntries(Object.entries(rfq).filter(([key]) => key !== 'buyerEmail'))
    );
    res.json({ success: true, count: rfqs.length, rfqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================================
// 5. KYC & LEGALITY OSS VERIFICATION SANDBOX
// ==========================================================================
app.post('/api/kyc/verify', (req, res) => {
  const { nib, npwp, companyName } = req.body;
  const cleanNib = String(nib || '').replace(/\D/g, '');

  if (cleanNib.length !== 13) {
    return res.status(400).json({
      success: false,
      status: 'invalid_format',
      message: 'Nomor Induk Berusaha (NIB) harus berjumlah tepat 13 digit angka standar OSS.'
    });
  }

  // Simulasi cek registrasi
  const isValid = !cleanNib.startsWith('999');

  if (isValid) {
    return res.json({
      success: true,
      status: 'verified',
      verifiedShield: 'Verified Global Exporter (VGE-2026)',
      data: {
        nib: cleanNib,
        npwp: npwp || '01.234.567.8-012.000',
        companyName: companyName || 'Pelaku UMKM Ekspor Indonesia',
        ossStatus: 'TERDAFTAR & AKTIF (Hak Akses Kepabeanan & Angka Pengenal Importir/Eksportir)',
        klasifikasiBaku: 'KBLI 46311 (Perdagangan Besar Kopi, Teh, Rempah-Rempah)',
        skalaUsaha: 'Usaha Kecil & Menengah (UKM Go-Global)',
        verifiedAt: new Date().toISOString()
      }
    });
  } else {
    return res.json({
      success: false,
      status: 'not_found',
      message: 'NIB tidak ditemukan pada database OSS Sandbox. Silakan periksa kembali digit nomor usaha Anda.'
    });
  }
});

// ==========================================================================
// 6. DOKUMEN EKSPOR GENERATOR (PROFORMA INVOICE, SALES CONTRACT, PEB)
// ==========================================================================
app.post('/api/documents/generate', (req, res) => {
  const { docType = 'invoice', exporterName = 'CV Kopi Nusantara Mandiri', buyerName = 'Nordic Coffee Importers GmbH', commodity = 'Kopi Arabika Gayo Specialty Grade 1', quantity = 18000, priceUSD = 9.20, incoterms = 'CIF Hamburg' } = req.body;

  const totalUSD = quantity * priceUSD;
  const docNo = `NB-${docType.toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  res.json({
    success: true,
    docNumber: docNo,
    docType,
    generatedAt: new Date().toISOString(),
    payload: {
      exporter: {
        name: exporterName,
        country: 'Indonesia',
        nib: '1294801928415',
        originPort: 'Pelabuhan Belawan / Tanjung Priok'
      },
      buyer: {
        name: buyerName,
        destination: incoterms.replace(/^(FOB|CIF|CFR)\s*/, '') || 'Port of Hamburg, Germany'
      },
      terms: {
        incoterms,
        paymentTerms: 'Escrow Vault 4-Stage Protected (30% DP / 30% BL / 20% Suez / 20% Final)'
      },
      item: {
        description: commodity,
        quantity,
        unitPriceUSD: priceUSD,
        totalUSD
      },
      signature: {
        verifiedBy: 'NusaBridge AI Trade Agent Engine',
        digitalSeal: 'DIGITAL_SEAL_VERIFIED_VALID_ICC_2020'
      }
    }
  });
});

// ==========================================================================
// 7. GEMINI AI AGENT & TRADE INTELLIGENCE (@google/genai)
// ==========================================================================
let genaiClient = null;

/** Ambil token API key dari teks apa pun (buang spasi, kurung, tanda kutip, dll).
 *  Mendukung dua format: key lama "AIza..." dan auth key baru "AQ....". */
function sanitizeApiKey(raw) {
  if (!raw) return '';
  const s = String(raw);
  const m = s.match(/(gsk_[0-9A-Za-z]{20,80})/);
  if (m) return m[0];
  return s.trim().replace(/^["']|["']$/g, '');
}

/** API key Groq yang sah: diawali gsk_ */
function isPlausibleApiKey(key) {
  return /^gsk_[0-9A-Za-z]{20,80}$/.test(key);
}

function getStoredApiKey() {
  const fromEnv = sanitizeApiKey(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
  if (isPlausibleApiKey(fromEnv)) return fromEnv;
  try {
    const fs = require('fs');
    const geminiJsonPath = path.join(__dirname, 'gemini.json');
    if (fs.existsSync(geminiJsonPath)) {
      const data = JSON.parse(fs.readFileSync(geminiJsonPath, 'utf8'));
      const fromJson = sanitizeApiKey(data.apiKey);
      if (isPlausibleApiKey(fromJson)) return fromJson;
    }
  } catch (e) {  }
  return '';
}

// (Groq dipanggil via fetch, tanpa SDK)

// Endpoint terjemahan UI (ID -> EN) memakai Gemini, dengan hasil berupa array
app.post('/api/translate', async (req, res) => {
  const texts = Array.isArray(req.body.texts)
    ? req.body.texts.filter((t) => typeof t === 'string' && t.trim()).slice(0, 80)
    : [];
  if (!texts.length) return res.json({ success: true, translations: [] });

  const key = getStoredApiKey();
  if (!key) return res.json({ success: false, translations: [], message: 'Groq belum aktif' });

  try {
    const prompt = `Translate each item of the JSON array below from Indonesian to natural, concise English suitable for a website UI.
Rules: keep brand/product names, numbers, currency, HS codes, URLs and emails unchanged; do not add explanations; keep the same order and length.
Return ONLY a valid JSON array of strings.

${JSON.stringify(texts)}`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return res.json({ success: false, translations: [], message: (data.error && data.error.message) || ('HTTP ' + resp.status) });
    }
    const raw = String(data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length) {
      return res.json({ success: true, translations: arr });
    }
    return res.json({ success: false, translations: [], message: 'Gagal menerjemahkan teks' });
  } catch (err) {
    return res.json({ success: false, translations: [], message: err.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  const { message = '', context = {} } = req.body;
  const rawText = String(message || '').trim();
  const q = rawText.toLowerCase();

  // Ambil data produk dari database JSON untuk pencarian dinamis
  let allProducts = [];
  try {
    allProducts = await db.read('products');
  } catch (err) {
    console.warn('[AI Chat catalog]:', err.message);
    allProducts = [];
  }

  function findMatchingProducts(text, list) {
    if (!list || !list.length) return [];
    const qLower = text.toLowerCase();
    const stopwords = ['dan', 'yang', 'untuk', 'dengan', 'dari', 'bisa', 'tolong', 'halo', 'info', 'harga', 'berapa', 'apakah', 'jual', 'kami', 'saya', 'ekspor', 'mau', 'ingin', 'kirim', 'buatkan', 'spesifikasi', 'spek', 'ada', 'cari', 'tentang', 'produk'];
    const keywords = qLower
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopwords.includes(w));

    if (!keywords.length && qLower.length < 3) return [];

    const scored = list.map(item => {
      let score = 0;
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const origin = (item.origin || '').toLowerCase();
      const desc = (item.desc || '').toLowerCase();

      if (name.includes(qLower)) score += 60;
      if (cat.includes(qLower)) score += 30;

      keywords.forEach(kw => {
        if (name.includes(kw)) score += 15;
        if (cat.includes(kw)) score += 8;
        if (origin.includes(kw)) score += 8;
        if (desc.includes(kw)) score += 3;
      });

      return { item, score };
    }).filter(r => r.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 2).map(r => r.item);
  }

  // Knowledge Engine Respons Terstruktur NusaBridge (Format Alami Khas Google Gemini)
  function getHeuristicReply(messageText) {
    const raw = messageText.trim();
    const q = raw.toLowerCase();

    // 0. Pertanyaan Seputar AI, Gemini, dan Kecerdasan Buatan (Prioritas Utama agar tidak keluar topik)
    const isAiQuery = /\b(ai|gemini|kecerdasan buatan|machine learning|deep learning|llm|transformer|neural network|bot)\b/i.test(q) ||
                      q.includes('cara kerja ai') || q.includes('apa itu ai') || q.includes('bagaimana ai') ||
                      q.includes('explain how ai works') || q.includes('how does ai work') || q.includes('what is ai');
    if (isAiQuery) {
      return `Halo! Kecerdasan Buatan (Artificial Intelligence / AI) seperti Google Gemini bekerja dengan prinsip-prinsip komputasi modern berikut:

**1. Pelatihan Skala Besar (Deep Learning & Arsitektur Transformer)**
Model AI dilatih menggunakan miliaran data teks, buku, artikel, dan kode program menggunakan arsitektur jaringan saraf tiruan (neural network) bernama *Transformer*. Model mempelajari hubungan semantik antarkata, struktur bahasa, logika penalaran, dan konteks informasi global.

**2. Pemrosesan Bahasa Alami (Natural Language Processing / NLP)**
Ketika Anda mengetikkan pertanyaan:
• **Tokenisasi**: Pertanyaan dipecah menjadi unit-unit kata atau suku kata (token).
• **Self-Attention Mechanism**: Model menganalisis kata mana yang paling penting dan bagaimana keterkaitannya dalam kalimat Anda.
• **Generasi Prediktif**: Model memprediksi kata demi kata selanjutnya dengan probabilitas tertinggi yang paling akurat, relevan, dan terstruktur.

**3. Implementasi Gemini AI di NusaBridge**
Di platform NusaBridge, AI bertindak sebagai asisten cerdas perdagangan ekspor-impor yang:
• Mengonversi pesan penawaran buyer asing menjadi dokumen RFQ Incoterms 2020.
• Mengaudit legalitas NIB OSS & mendeteksi regulasi negara tujuan (FDA, EUDR, JAS).
• Menghitung kalkulasi biaya ekspor transparan (FOB, ocean freight, asuransi, CIF).
• Memandu alur pencairan dana bertahap secara aman via Escrow Vault.

Ada bagian dari cara kerja AI atau ekspor yang ingin Anda ketahui lebih mendalam?`;
    }

    // 0b. Sapaan Ramah, Sapaan Singkat & Greeting Kasual
    const isGreeting = (
      q.includes('sapaan') || q.includes('sapa') || (q.includes('salam') && !q.includes('salamander')) ||
      /^(halo|hai|hi|hello|selamat pagi|selamat siang|selamat sore|selamat malam|assalamualaikum)[\s!.,?]*$/i.test(q) ||
      ((q.startsWith('halo') || q.startsWith('hai') || q.startsWith('selamat')) && (q.length < 50 || q.includes('singkat')) && !q.includes('fob') && !q.includes('cif') && !q.includes('kontrak'))
    );
    if (isGreeting) {
      return `Halo! Selamat datang di NusaBridge AI. Senang sekali bisa menyapa Anda! Saya adalah asisten cerdas yang ramah dan siap membantu kebutuhan perdagangan ekspor-impor UMKM Anda maupun diskusi teknologi. Ada yang bisa saya bantu hari ini?`;
    }

    // Periksa apakah pertanyaan adalah tentang panduan, regulasi, kalkulasi, atau konsep ekspor
    const isLegalityOrGuide = (
      q.includes('cara ekspor') || q.includes('bagaimana ekspor') || q.includes('memulai ekspor') || q.includes('langkah ekspor') || q.includes('pemula') ||
      q.includes('incoterm') || q.includes('beda fob') || q.includes('perbedaan') ||
      q.includes('legalitas') || q.includes('karantina') || q.includes('fitosanitari') || q.includes('sertifikat') || q.includes('izin') || q.includes('syarat') ||
      q.includes('escrow') || q.includes('keamanan') ||
      q.includes('dokumen') || q.includes('surat ekspor') || q.includes('berkas') ||
      q.includes('hamburg') || q.includes('los angeles') || q.includes('tokyo') || q.includes('hitung') || q.includes('kalkulasi')
    );

    // 1. Pencarian Produk Langsung dari Katalog 120 Komoditas
    const matchedProducts = findMatchingProducts(raw, allProducts);
    const isAskingProduct = (
      q.includes('harga') || q.includes('produk') || q.includes('kopi') || q.includes('rempah') ||
      q.includes('cengkeh') || q.includes('kayu') || q.includes('rotan') || q.includes('batik') ||
      q.includes('tenun') || q.includes('songket') || q.includes('ulos') || q.includes('vanila') ||
      q.includes('lada') || q.includes('pala') || q.includes('nilam') || q.includes('atsiri') ||
      q.includes('kapulaga') || q.includes('jahe') || q.includes('kunyit') || q.includes('gayo') ||
      q.includes('toraja') || q.includes('mandheling') || q.includes('lampung') || q.includes('dampit') ||
      q.includes('kintamani') || q.includes('bajawa') || q.includes('wamena') || q.includes('spek') ||
      q.includes('spesifikasi') || q.includes('moq') || q.includes('minimal order') || q.includes('jual')
    );

    // 1a. Permintaan menampilkan daftar produk / komoditas ("sebutkan 5 produk", "produk apa saja", dll.)
    const wantsProductList =
      /(produk|komoditas)/i.test(q) &&
      /(sebutkan|tampilkan|berikan|tunjukkan|list|daftar|contoh|apa\s*saja|apa\s*aja|produk\s*apa|komoditas\s*apa|macam|jenis|pilihan|tersedia)/i.test(q);

    if (wantsProductList && Array.isArray(allProducts) && allProducts.length > 0) {
      const countMatch = q.match(/(\d+)\s*(produk|komoditas|item|buah|jenis|macam)/);
      const wantCount = Math.min(countMatch ? Math.max(1, parseInt(countMatch[1], 10)) : 5, 20);

      let pool = allProducts;
      let catLabel = '';
      if (q.includes('kopi')) { pool = pool.filter((p) => p.category === 'kopi'); catLabel = 'Kopi'; }
      else if (q.includes('rempah') || q.includes('bumbu')) { pool = pool.filter((p) => p.category === 'rempah'); catLabel = 'Rempah'; }
      else if (q.includes('kriya') || q.includes('kerajinan') || q.includes('mebel') || q.includes('rotan')) { pool = pool.filter((p) => p.category === 'kriya'); catLabel = 'Kriya'; }
      else if (q.includes('tekstil') || q.includes('batik') || q.includes('tenun') || q.includes('songket')) { pool = pool.filter((p) => p.category === 'tekstil'); catLabel = 'Tekstil'; }

      const picked = pool.slice(0, wantCount);
      const lines = picked.map((p, i) => {
        const price = Number(p.price).toFixed(2);
        return `${i + 1}. **${p.name}**\n   • Asal: ${p.origin} • Harga: $${price} USD/${p.unit} • MOQ: ${p.moq} ${p.unit} • HS: ${p.hsCode || '-'}`;
      }).join('\n');

      return `Berikut ${picked.length} produk${catLabel ? ' **' + catLabel + '**' : ''} unggulan yang tersedia di katalog NusaBridge (total ${pool.length}${catLabel ? ' produk ' + catLabel : ' produk'}):

${lines}

Ingin detail lengkap salah satunya (spesifikasi, sertifikasi, estimasi CIF/FOB)? Sebutkan nama produknya, misalnya: _"Harga dan spesifikasi ${picked[0]?.name?.split('(')[0].trim()}"_.`;
    }

    if (!isLegalityOrGuide && matchedProducts.length > 0 && isAskingProduct) {
      const p = matchedProducts[0];
      const idrEst = Math.round(p.price * 16250).toLocaleString('id-ID');
      const specsText = Array.isArray(p.specs) ? p.specs.map(s => `${s.k}: ${s.v}`).join(' | ') : 'Standar Ekspor';
      const certsText = Array.isArray(p.certs) ? p.certs.join(', ') : 'Tersertifikasi Ekspor';

      return `Halo! Berikut adalah informasi komoditas ekspor yang Anda tanyakan:

📦 **${p.name}**
• **Kategori Komoditas**: ${p.category ? p.category.toUpperCase() : 'Unggulan Ekspor'}
• **Harga Acuan Ekspor**: $${Number(p.price).toFixed(2)} USD / ${p.unit} (sekitar Rp ${idrEst} / ${p.unit})
• **Minimum Pemesanan (MOQ)**: ${p.moq} ${p.unit}
• **Asal Daerah**: ${p.origin}
• **Kode HS**: ${p.hsCode || '-'}
• **Sertifikasi & Kepatuhan**: ${certsText}
• **Standar Pengiriman**: ${p.shipping || 'FOB Pelabuhan Indonesia'}
• **Spesifikasi Utama**: ${specsText}

${p.desc}

💡 **Langkah Selanjutnya**:
Apakah Anda ingin saya buatkan kalkulasi estimasi pengiriman (Incoterms FOB atau CIF), rincian ocean freight, asuransi, dan margin aman untuk produk ini? Cukup sebutkan jumlah kuantitas dan negara/pelabuhan tujuannya!`;
    }

    // 2. Rute Ekspor Khusus: Hamburg / Jerman / Uni Eropa (Kopi Robusta/Arabika)
    if (q.includes('hamburg') || (q.includes('jerman') && (q.includes('ekspor') || q.includes('kopi') || q.includes('cif'))) || (q.includes('robusta') && (q.includes('cif') || q.includes('20 mt') || q.includes('ton')))) {
      return `Halo! Terima kasih atas pertanyaannya. Berikut adalah analisis menyeluruh untuk pengiriman ekspor Kopi Robusta Lampung ke Hamburg Port, Jerman:

**1. Perhitungan Biaya & Incoterms 2020 (CIF Hamburg)**
• Volume Pengiriman: 20 Metric Ton (20.000 Kg) / 1 Kontainer 20ft FCL
• Harga Dasar FOB Pelabuhan Tanjung Priok: $3.85 / Kg (Total: $77.000 USD)
• Ocean Freight & Asuransi Kargo Laut: $0.42 / Kg ($8.400 USD)
• Total Nilai CIF Hamburg Port: $85.400 USD ($4.27 / Kg)
• Rekomendasi Margin Aman UMKM: +18.5% Net Profit

**2. Audit Legalitas & Regulasi Uni Eropa (EUDR)**
• Legalitas Eksportir: NIB OSS RBA aktif dengan Hak Akses Kepabeanan & Angka Pengenal Eksportir
• Sertifikat Saniter: Phytosanitary Certificate resmi dari Karantina Tumbuhan Indonesia
• Kepatuhan EUDR: Peta poligon geolokasi kebun terdaftar bebas deforestasi
• Skor Kepatuhan: 100% Lolos Verifikasi Ekspor

**3. Dokumen Legal yang Diterbitkan**
Draf Commercial Invoice #INV-2026-DE-088 dan Sales Contract berstandar ICC Incoterms 2020 otomatis diterbitkan dalam format PDF.

**4. Skema Pembayaran Aman via Escrow Vault**
Dana pembayaran buyer sebesar $85.400 USD dikunci di Escrow Vault dan dicairkan dalam 4 tahap:
• Tahap 1 (30% - $25.620): Down Payment (DP) cair saat kontrak ditandatangani untuk modal kerja.
• Tahap 2 (30% - $25.620): Cair saat pemeriksaan stuffing kontainer selesai dan PEB Bea Cukai terbit.
• Tahap 3 (20% - $17.080): Cair saat peti kemas naik ke kapal kargo dan Bill of Lading (B/L) terbit.
• Tahap 4 (20% - $17.080): Pelunasan final saat kapal sandar di Hamburg Port dan kontainer diterima.

Waktu pelayaran laut dari Tanjung Priok ke Hamburg Port berkisar antara 24 hingga 28 hari via Jalur Terusan Suez.`;
    }

    // 3. Rute Ekspor Khusus: Los Angeles / USA (Cengkeh Lalpari / Rempah / Kopi)
    if (q.includes('los angeles') || (q.includes('amerika') && (q.includes('ekspor') || q.includes('cengkeh') || q.includes('cif'))) || (q.includes('cengkeh') && q.includes('cif'))) {
      return `Halo! Berikut adalah analisis kalkulasi ekspor Cengkeh Lalpari Maluku menuju Port of Los Angeles, Amerika Serikat:

**1. Perhitungan Biaya & Incoterms 2020 (CIF Los Angeles)**
• Volume: 5 Metric Ton (5.000 Kg) dalam 200 karung goni laminasi @ 25 Kg
• Harga Dasar FOB Pelabuhan Tanjung Perak: $12.50 / Kg (Total: $62.500 USD)
• Ocean Freight & Asuransi Rute Pasifik: $1.15 / Kg ($5.750 USD)
• Total Nilai Penawaran CIF Los Angeles: $68.250 USD ($13.65 / Kg)
• Rekomendasi Margin Aman: +19.2% Net Profit

**2. Kepatuhan Regulasi US FDA**
• Registrasi US FDA Food Facility Registration terverifikasi aktif
• Prior Notice of Imported Food dikirim sebelum kontainer tiba
• Bebas cemaran aflatoksin dan kadar air terkontrol ketat (<12%)
• Sertifikat Uji Lab & Karantina Indonesia terlampir lengkap

**3. Dokumen Ekspor Resmi**
Proforma Invoice #PI-2026-US-104, Sales Contract, Packing List CBM, dan formulir PEB siap diterbitkan otomatis.

**4. Pencairan Dana Escrow Vault 4 Tahap**
Total nilai transaksi $68.250 USD dikunci secara aman:
• Tahap 1 (30% - $20.475): DP cair saat kontrak disepakati.
• Tahap 2 (30% - $20.475): Cair saat selesai stuffing kontainer dan PEB Bea Cukai terbit.
• Tahap 3 (20% - $13.650): Cair saat kapal bertolak dan On-Board Bill of Lading terbit.
• Tahap 4 (20% - $13.650): Settlement akhir saat kontainer tiba di Los Angeles Port.

Estimasi transit pelayaran laut dari Surabaya ke Los Angeles Port adalah 22-26 hari.`;
    }

    // 4. Rute Ekspor Khusus: Tokyo / Jepang (Kursi Rotan / Kriya / Kayu Jati)
    if (q.includes('tokyo') || (q.includes('jepang') && (q.includes('ekspor') || q.includes('rotan') || q.includes('fob'))) || (q.includes('rotan') && q.includes('fob'))) {
      return `Halo! Berikut analisis penawaran ekspor Furnitur Kursi Rotan Alami Cirebon ke Port of Tokyo, Jepang:

**1. Perhitungan Biaya & Incoterms 2020 (FOB Tanjung Priok)**
• Kuantitas: 2.000 Pcs Kursi Rotan Alami (Muatan 2 x 40ft High Cube Container ~136 CBM)
• Harga Satuan FOB Tanjung Priok: $78.00 / Pcs (Total: $156.000 USD)
• Biaya Ocean Freight: Ditanggung oleh buyer dari Tokyo (skema FOB)
• Margin Aman Pengrajin UMKM: +22.0% Net Profit

**2. Audit Legalitas & Standar Mutu Jepang**
• Dokumen V-Legal SVLK Kementerian Lingkungan Hidup & Kehutanan RI aktif
• Perlakuan Fumigasi Standar Internasional ISPM 15 (Bebas Rayap & Jamur Kayu)
• Penggunaan silica gel kargo di setiap kemasan untuk mencegah kelembapan laut

**3. Skema Pencairan Dana Escrow Vault**
Pembayaran senilai $156.000 USD dikunci di awal dan dicairkan bertahap:
• Tahap 1 (30% - $46.800): DP modal pengrajin dan anyaman rotan.
• Tahap 2 (30% - $46.800): Pemeriksaan QC lolos dan dokumen PEB terbit.
• Tahap 3 (20% - $31.200): Kontainer termuat di kapal dan Bill of Lading terbit.
• Tahap 4 (20% - $31.200): Pelunasan saat kontainer tiba di Port of Tokyo.

Estimasi waktu pelayaran Tanjung Priok menuju Tokyo Port berkisar antara 10 hingga 14 hari.`;
    }

    // 5. Perhitungan Biaya Umum / Kalkulator Incoterms
    if (q.includes('hitung biaya') || q.includes('kalkulasi biaya') || q.includes('estimasi biaya') || q.includes('ongkir') || q.includes('biaya kirim') || q.includes('freight')) {
      return `Halo! Untuk menghitung estimasi biaya ekspor secara akurat, sistem NusaBridge membagi komponen biaya ke dalam 4 pos utama:

**1. Biaya Dasar Modal & FOB (Free on Board)**
• Harga pokok produksi komoditas di tingkat petani/pengrajin
• Biaya kemasan standar ekspor (karung goni laminasi / box karton 5-ply / pallet ISPM 15)
• Biaya transportasi darat (trucking) dari gudang ke pelabuhan muat
• Biaya penanganan pelabuhan (THC - Terminal Handling Charges) & pembuatan dokumen PEB

**2. Ocean Freight (Ongkos Kapal Internasional)**
• Kontainer 20ft FCL (kapasitas s/d 28 CBM / 20 ton): berkisar $1.200 - $3.500 USD tergantung jarak negara tujuan
• Kontainer 40ft High Cube (kapasitas s/d 68 CBM): berkisar $2.200 - $5.500 USD
• Muatan LCL (kubikasi kecil): dihitung per CBM (sekitar $80 - $180 USD/CBM)

**3. Marine Cargo Insurance (Asuransi Pengangkutan Laut)**
• Premi asuransi biasanya berkisar 0,3% - 0,5% dari total nilai barang (Invoice + Freight).

**4. Rekomendasi Margin Aman UMKM**
• NusaBridge merekomendasikan margin laba bersih 15% - 22% setelah seluruh biaya tertutupi.

Jika Anda ingin saya hitungkan untuk komoditas tertentu, cukup sebutkan nama produk, estimasi jumlah kuantitas, dan negara/pelabuhan tujuannya!`;
    }

    // 6. Penjelasan Konsep Incoterms 2020 (FOB, CIF, CFR, EXW)
    if (/\b(incoterm|incoterms|fob|cif|cfr|exw|ddp)\b/i.test(q) || q.includes('beda fob') || q.includes('syarat incoterm')) {
      return `Halo! Incoterms 2020 adalah aturan resmi dari ICC (International Chamber of Commerce) yang mengatur pembagian biaya, risiko, dan tanggung jawab antara penjual (eksportir) dan pembeli (buyer luar negeri).

Berikut penjelasan skema yang paling sering digunakan:

• **FOB (Free on Board - Pelabuhan Indonesia)**
Tanggung jawab Anda selesai setelah barang termuat di atas kapal di pelabuhan muat Indonesia (misal: Tanjung Priok atau Tanjung Perak). Ongkos kapal laut internasional dan asuransi kargo ditanggung penuh oleh pembeli. Skema ini sangat direkomendasikan untuk eksportir pemula karena minim risiko fluktuasi biaya kapal!

• **CIF (Cost, Insurance, and Freight - Pelabuhan Tujuan Buyer)**
Anda menanggung harga barang, ongkos kapal laut internasional, dan premi asuransi hingga kapal tiba di pelabuhan tujuan pembeli (misal: Hamburg, Tokyo, atau Los Angeles). Namun peralihan risiko kerusakan barang tetap beralih ke pembeli begitu barang termuat di kapal di Indonesia.

• **CFR (Cost and Freight)**
Mirip dengan skema CIF, tetapi tanpa asuransi. Biaya asuransi diurus dan ditanggung oleh pembeli sendiri.

• **EXW (Ex Works - Gudang Penjual)**
Pembeli mengambil barang langsung di pintu pabrik atau gudang Anda. Seluruh biaya pengangkutan lokal, perizinan ekspor, dan kapal ditanggung pembeli.

Saran terbaik bagi UMKM adalah menawarkan skema FOB terlebih dahulu, atau CIF jika pembeli meminta penawaran lengkap terima di pelabuhan tujuan.`;
    }

    // 7. Legalitas, NIB OSS, NPWP, dan Kepatuhan Karantina
    if (/\b(nib|npwp|oss|fitosanitari|phytosanitary|eudr|fda|svlk)\b/i.test(q) || q.includes('karantina') || q.includes('legalitas') || q.includes('izin ekspor') || q.includes('syarat ekspor')) {
      return `Halo! Memiliki legalitas yang lengkap adalah kunci utama agar komoditas ekspor Anda tidak tertahan di Bea Cukai maupun pelabuhan negara tujuan.

Berikut adalah persyaratan legalitas pokok untuk ekspor:

• **NIB (Nomor Induk Berusaha) 13 Digit OSS RBA**
Saat ini NIB berbasis risiko otomatis berfungsi sebagai identitas berusaha, Hak Akses Kepabeanan di Ditjen Bea Cukai, serta Angka Pengenal Eksportir/Importir (API).

• **NPWP Usaha Aktif**
NPWP badan usaha (PT, CV, Koperasi) atau perorangan yang telah berstatus valid di Direktorat Jenderal Pajak.

• **Sertifikat Fitosanitari (Phytosanitary Certificate)**
Wajib untuk seluruh komoditas hasil perkebunan, pertanian, kopi, dan rempah. Diterbitkan oleh Badan Karantina Indonesia setelah melalui uji laboratorium untuk memastikan bebas dari organisme pengganggu tumbuhan.

• **Sertifikasi Khusus Komoditas & Negara Tujuan**:
- **Produk Kayu & Rotan**: Wajib memiliki dokumen sertifikasi kelestarian V-Legal SVLK dari Kemenhut.
- **Tujuan Amerika Serikat**: Wajib mendaftarkan fasilitas produksi ke US FDA (Food Facility Registration).
- **Tujuan Uni Eropa**: Wajib mematuhi regulasi bebas deforestasi EUDR dilengkapi koordinat lokasi kebun.
- **Tujuan Jepang**: Memenuhi standar batas residu pestisida JAS (Japanese Agricultural Standards).

Anda dapat menguji validitas NIB usaha Anda pada tab menu KYC Hub di bawah untuk mendapatkan badge Verified Global Exporter.`;
    }

    // 8. Escrow Vault & Keamanan Pembayaran
    if (/\b(escrow|rekber|rekening bersama)\b/i.test(q) || (q.includes('pembayaran') && q.includes('ekspor')) || q.includes('keamanan dana') || q.includes('tahap pencairan') || q.includes('uang muka ekspor')) {
      return `Halo! Kekhawatiran terbesar eksportir UMKM adalah risiko pembeli luar negeri yang tidak membayar setelah barang dikirim. Fitur Escrow Vault NusaBridge hadir untuk meniadakan risiko tersebut secara tuntas.

**Bagaimana Cara Kerjanya?**
Sebelum proses produksi atau pengiriman dilakukan, buyer wajib menyetorkan 100% nilai transaksi ke rekening penampung aman Escrow Vault (multivalas USD/EUR).

Dana tersebut kemudian dicairkan kepada rekening eksportir dalam **4 Tahap Transparan**:
• **Tahap 1 (30% Down Payment)**: Cair seketika setelah Sales Contract ditandatangani oleh kedua pihak untuk dijadikan modal kerja dan persiapan stok.
• **Tahap 2 (30% Stuffing & PEB)**: Cair saat barang selesai dimuat ke kontainer dan dokumen Pemberitahuan Ekspor Barang (PEB) terbit dari Bea Cukai.
• **Tahap 3 (20% Kapal Bertolak)**: Cair saat kontainer sudah berada di atas kapal dan On-Board Bill of Lading (B/L) resmi diterbitkan maskapai pelayaran.
• **Tahap 4 (20% Settlement Final)**: Cair saat kapal sandar di pelabuhan tujuan dan kontainer lolos pemeriksaan kepabeanan setempat.

Dengan sistem ini, eksportir mendapat kepastian dana sudah tersedia, dan buyer mendapatkan jaminan bahwa barang benar-benar dikirim sesuai standar.`;
    }

    // 9. Dokumen Pokok Ekspor Resmi (Akurat tanpa false match pada kata 'jelaskan')
    const isDocQuery = /\b(dokumen|berkas ekspor|invoice|proforma|sales contract|packing list|bill of lading|surat jalan|surat ekspor)\b/i.test(q) ||
                       /\bpeb\b/i.test(q) ||
                       /\bcoo\b/i.test(q) ||
                       (/\bska\b/i.test(q) && !q.includes('jelas') && !q.includes('skala')) ||
                       /\bb\/l\b/i.test(q);
    if (isDocQuery) {
      return `Halo! Dalam perdagangan internasional, dokumen resmi adalah bukti legalitas kepemilikan dan dasar penagihan pembayaran. Berikut 6 dokumen pokok ekspor:

1. **Proforma Invoice**: Penawaran harga resmi di awal yang memuat kuantitas, harga per unit, spesifikasi produk, dan termin pembayaran.
2. **Sales Contract (Kontrak Penjualan)**: Perjanjian jual-beli yang mengikat hak dan kewajiban hukum antara eksportir dan buyer.
3. **Commercial Invoice**: Faktur tagihan resmi yang digunakan untuk proses kepabeanan (clearance) serta dasar penghitungan bea masuk di negara tujuan.
4. **Packing List**: Rincian fisik muatan seperti jenis kemasan, jumlah koli/karung, berat bersih (net weight), berat kotor (gross weight), dan volume CBM.
5. **PEB (Pemberitahuan Ekspor Barang)**: Dokumen pemberitahuan kepabeanan ke Kantor Bea Cukai untuk memperoleh Nota Pelayanan Ekspor (NPE).
6. **Bill of Lading (B/L)**: Bukti tanda terima muatan dan surat kepemilikan barang yang diterbitkan oleh perusahaan pelayaran pengangkut.

Di NusaBridge, Anda dapat menerbitkan draf Proforma Invoice dan Sales Contract berstandar ICC secara otomatis berformat PDF pada fitur Auto-PDF Generator!`;
    }

    // 10. Panduan Langkah Ekspor untuk Pemula
    if (q.includes('cara ekspor') || q.includes('bagaimana ekspor') || q.includes('memulai ekspor') || q.includes('langkah ekspor') || q.includes('pemula') || q.includes('panduan') || q.includes('alur ekspor')) {
      return `Halo Rekan Eksportir! Menembus pasar global sebenarnya sangat bisa dilakukan oleh UMKM jika mengikuti tahapan yang terstruktur. Berikut 5 langkah praktis untuk memulai:

**1. Persiapan Legalitas Dasar**
Pastikan Anda memiliki NIB (Nomor Induk Berusaha) dari sistem OSS RBA dan NPWP aktif. NIB kini otomatis berfungsi ganda sebagai izin ekspor dan Hak Akses Kepabeanan.

**2. Standarisasi Mutu & Kemasan**
Riset standar komoditas Anda. Untuk kopi dan rempah, pastikan kadar air terkontrol (<12%) dan siapkan kemasan ekspor berkualitas (seperti karung goni berlaminasi GrainPro).

**3. Penentuan Harga Penawaran**
Hitung harga modal dasar, biaya antar ke pelabuhan, dan gunakan skema penawaran FOB (Free on Board) terlebih dahulu agar Anda tidak terbebani risiko fluktuasi biaya kapal laut internasional.

**4. Terbitkan Dokumen Penawaran Resmi**
Saat ada calon buyer yang berminat, kirimkan Proforma Invoice dan Sales Contract resmi berformat PDF yang mencantumkan spesifikasi jelas, nomor rekening, dan klausul pengiriman.

**5. Gunakan Pembayaran Aman Escrow**
Hindari mengirim barang tanpa uang muka. Selalu gunakan sistem Escrow Vault agar dana buyer sudah terkunci 100% dan dicairkan bertahap (30% DP, 30% PEB, 20% B/L, 20% Tiba).

Jika barang Anda belum mencapai kuantitas 1 kontainer penuh (FCL), Anda bisa memulai dengan skema kargo LCL (konsolidasi muatan) bersama eksportir lain.`;
    }

    // 11. Informasi Katalog 50 Komoditas Ekspor
    if (q.includes('katalog') || q.includes('daftar komoditas') || q.includes('daftar produk') || q.includes('apa saja yang dijual') || q.includes('pilihan komoditas')) {
      const catCount = allProducts.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {});
      const kopiNames = allProducts.filter((p) => p.category === 'kopi').slice(0, 10).map((p) => p.name.split('(')[0].trim()).join(', ');
      return `Halo! NusaBridge menyediakan etalase kurasi **${allProducts.length} komoditas** ekspor unggulan Indonesia (tiap produk dengan foto unik) yang telah lolos verifikasi standar mutu dan legalitas:

☕ **Kopi Ekspor Unggulan (${catCount.kopi || 0} Produk)**
${kopiNames}, dll.

🌿 **Rempah-Rempah & Hasil Alam (${catCount.rempah || 0} Produk)**
Cengkeh Lalpari Maluku, Kayu Manis Korintji, Lada Putih Muntok, Lada Hitam Lampung, Vanila Papua, Pala Banda, Fuli Pala, Minyak Nilam Aceh, Jahe Merah, dan Kapulaga Putih Jawa.

🪑 **Kriya & Kerajinan Ramah Lingkungan (${catCount.kriya || 0} Produk)**
Kursi Rotan Cirebon, Keranjang Eceng Gondok, Mangkuk Batok Kelapa, Kayu Jati Jepara, Gerabah Kasongan, Lampu Bambu Tasikmalaya, Cermin Kerang Papua, Karpet Pandan Kebumen, dan Kotak Tisu Pelepah Pisang.

🧵 **Tekstil & Wastra Nusantara (${catCount.tekstil || 0} Produk)**
Batik Tulis Solo, Pekalongan, Lasem & Madura, Batik Cap Garutan, Tenun Ikat Troso, Sumba & Flores, Songket Palembang & Pandai Sikek.

Ketik _"sebutkan 5 produk kopi"_ untuk melihat daftar lengkap dengan harga dan MOQ, atau sebutkan nama produk untuk detail spesifikasinya!`;
    }

    // 14. Perbedaan Biji Kopi Arabika dan Robusta
    if ((q.includes('arabika') && q.includes('robusta')) || q.includes('beda arabika') || q.includes('perbedaan kopi')) {
      return `Halo! Biji kopi Arabika dan Robusta adalah dua komoditas ekspor utama Indonesia dengan perbedaan mendasar:

**1. Profil Cita Rasa (Flavor Profile):**
• **Arabika**: Memiliki rasa kompleks, keasaman (acidity) cerah dan menyegarkan, aroma buah (fruity) atau bunga (floral), dan kadar gula alami lebih tinggi (~6-9%).
• **Robusta**: Cita rasa cenderung earthy, tebal (heavy body), aroma nutty atau dark chocolate, dengan rasa pahit khas yang lebih dominan.

**2. Kandungan Kafein:**
• **Arabika**: Mengandung 1,2% - 1,5% kafein.
• **Robusta**: Mengandung 2,2% - 2,7% kafein (hampir 2 kali lebih pekat).

**3. Ketinggian Kebun (Elevasi):**
• **Arabika**: Tumbuh optimal di dataran tinggi 1.000 - 2.100 mdpl (Gayo, Toraja, Kintamani).
• **Robusta**: Tumbuh baik di dataran rendah hingga sedang 400 - 900 mdpl (Lampung, Dampit Malang).

**4. Nilai Pasar & Minat Buyer Dunia:**
• Arabika bernilai tinggi ($8.50 - $16.50 USD/Kg) untuk specialty coffee shop di Eropa, AS, dan Jepang.
• Robusta ($3.50 - $5.50 USD/Kg) sangat diminati industri kopi instan, roastery komersial, dan espresso blend di Eropa Barat dan Timur Tengah.`;
    }

    // 15. Cara Mencari Buyer Luar Negeri
    if (q.includes('cari buyer') || q.includes('mencari buyer') || q.includes('mencari pembeli') || q.includes('dapat buyer') || q.includes('buyer luar negeri')) {
      return `Halo! Menemukan buyer luar negeri yang kredibel dapat dilakukan melalui 5 strategi terbukti berikut:

**1. Manfaatkan Perwakilan Dagang RI di Luar Negeri:**
• Hubungi **ITPC (Indonesian Trade Promotion Center)** dan Atase Perdagangan (Atdag) Kemendag di kota tujuan (Hamburg, Los Angeles, Tokyo, Dubai, dll.). Mereka menyediakan daftar kontak importir resmi (*market intelligence*).
• Daftarkan produk Anda di portal resmi **inaexport.id** binaan Kemendag.

**2. Pameran Dagang Internasional:**
• Ikuti pameran B2B seperti **Trade Expo Indonesia (TEI)** di ICE BSD, Gulfood Dubai, atau SIAL Paris. Ini tempat berkumpulnya ribuan *sourcing manager* dari berbagai negara.

**3. Digital B2B Outreach via LinkedIn:**
• Buat profil perusahaan berbahasa Inggris profesional. Cari jabatan *Sourcing Manager*, *Procurement Specialist*, atau *Commodity Importer*.
• Kirimkan pesan singkat sopan berisi *Product Specification Sheet* dan foto laboratorium komoditas Anda.

**4. Kerjasama dengan Asosiasi Eksportir:**
• Bergabunglah dengan asosiasi resmi (seperti AEKI untuk kopi atau Dewan Rempah) untuk mendapatkan informasi kuota atau *buyer inquiry*.

**5. Manfaatkan NusaBridge:**
• Gunakan RFQ Studio untuk menerbitkan penawaran Incoterms resmi berstandar PDF dan tawarkan pembayaran aman via Escrow Vault agar buyer percaya bertransaksi dengan Anda!`;
    }

    // 16. Ekspor Tanpa PT / Perorangan
    if (q.includes('tanpa pt') || q.includes('perorangan') || q.includes('badan usaha') || q.includes('harus pt') || q.includes('apakah bisa ekspor')) {
      return `Halo! Jawabannya adalah: **BISA!** Pelaku UMKM di Indonesia kini sangat dimudahkan untuk melakukan ekspor bahkan tanpa harus memiliki PT:

**1. NIB Perorangan (OSS RBA):**
Melalui sistem OSS RBA (oss.go.id), usaha perorangan (Usaha Mikro dan Kecil) dapat mendaftar dan memperoleh NIB 13 digit secara gratis hanya bermodalkan KTP dan NPWP pribadi. NIB ini otomatis berlaku sebagai Angka Pengenal Eksportir dan Hak Akses Kepabeanan Bea Cukai!

**2. Skema Undername (Sewa Izin Ekspor):**
Jika perizinan Anda belum siap, Anda bisa menggunakan jasa freight forwarder dengan skema undername resmi atau konsolidator kargo LCL. Forwarder yang mengurus dokumen kepabeanan atas nama mereka, sementara produk dan hasil pembayaran tetap menjadi hak Anda.

Jadi ketiadaan PT bukan lagi halangan bagi UMKM untuk menembus pasar dunia!`;
    }

    // 17. Cara Mendaftar NIB di OSS RBA
    if (q.includes('daftar oss') || q.includes('buat nib') || q.includes('cara nib') || q.includes('daftar nib') || q.includes('bikin nib')) {
      return `Halo! Pendaftaran NIB (Nomor Induk Berusaha) dapat dilakukan dalam hitungan menit secara online dan gratis di portal **oss.go.id**:

**Tahapan Pendaftaran:**
1. Kunjungi website resmi [oss.go.id](https://oss.go.id) lalu klik **Daftar**.
2. Pilih skala usaha **Usaha Mikro & Kecil (UMK)**.
3. Masukkan NIK KTP, alamat email aktif, dan nomor WhatsApp untuk verifikasi OTP.
4. Isi data profil usaha Anda, alamat gudang, serta pilih kode **KBLI Ekspor**:
   • **46311**: Perdagangan Besar Kopi, Teh, dan Rempah-Rempah.
   • **46499**: Perdagangan Besar Kerajinan & Dekorasi Rumah.
   • **46411**: Perdagangan Besar Tekstil & Pakaian Jadi.
5. Klik simpan dan cetak draf. Dokumen NIB 13 digit berformat PDF akan langsung terbit beserta Hak Akses Kepabeanan Ditjen Bea Cukai.`;
    }

    // 18. Pengertian & Fungsi HS Code
    if (q.includes('hs code') || q.includes('kode hs') || q.includes('harmonized system')) {
      return `Halo! **HS Code (Harmonized System Code)** adalah kode identifikasi klasifikasi barang standar internasional yang digunakan oleh bea cukai di seluruh dunia:

**Fungsi Utama HS Code:**
• Menentukan besaran tarif bea masuk dan pajak di negara importir.
• Menentukan persyaratan dokumen wajib (seperti uji lab atau sertifikat karantina fitosanitari).
• Standarisasi dokumen ekspor (PEB, Invoice, Packing List, Certificate of Origin).

**Contoh HS Code Komoditas Unggulan:**
• \`0901.11.10\`: Kopi Arabika mentah (Green Beans)
• \`0901.21.10\`: Kopi Sangrai / Roasted Beans
• \`0907.10.00\`: Cengkeh Utuh
• \`0905.10.00\`: Biji Vanila
• \`9401.52.00\`: Kursi / Furnitur Anyaman Rotan
• \`5208.51.00\`: Kain Batik Tradisional Katun

Anda dapat mengecek kode HS komoditas spesifik melalui portal INSW (insw.go.id).`;
    }

    // 19. Perbedaan Pengiriman LCL vs FCL
    if (q.includes('lcl') || q.includes('fcl') || q.includes('beda kontainer') || q.includes('kubikasi')) {
      return `Halo! Dalam logistik pengiriman kargo laut internasional, ada 2 metode pengangkutan kontainer:

• **FCL (Full Container Load):** Satu kontainer penuh disewa khusus untuk muatan Anda sendiri.
  - Kontainer 20ft: Kapasitas ~28 CBM / muatan s/d 20-22 ton komoditas curah.
  - Kontainer 40ft High Cube: Kapasitas ~68 CBM / muatan kriya & mebel.
  - Kelebihan: Cepat, segel kontainer utuh dari pabrik sampai pelabuhan tujuan, minim risiko kerusakan.

• **LCL (Less than Container Load):** Muatan Anda digabungkan bersama eksportir lain dalam 1 kontainer bersama (konsolidasi).
  - Biaya dihitung per meter kubik (**per CBM**) atau per ton.
  - Kelebihan: Sangat hemat bagi UMKM yang baru mulai mengirim dalam volume kecil (misal: 1 - 5 CBM).`;
    }

    // 20. Demurrage dan Detention
    if (q.includes('demurrage') || q.includes('detention') || q.includes('denda kontainer')) {
      return `Halo! **Demurrage** dan **Detention** adalah biaya denda sewa kontainer dari perusahaan pelayaran (shipping line):

• **Demurrage:** Denda yang muncul jika kontainer berisi barang masih menumpuk di terminal pelabuhan melebihi batas waktu gratis (*free time*, biasanya 5-7 hari). Biasanya terjadi karena keterlambatan pengurusan izin bea cukai.
• **Detention:** Denda saat kontainer kosong belum dikembalikan ke depo pelayaran setelah selesai dibongkar di gudang pembeli.

💡 Gunakan NusaBridge Escrow Vault agar seluruh dokumen release kontainer (Bill of Lading, PEB) diserahkan secara digital tepat waktu untuk mencegah denda demurrage!`;
    }

    // 21. Waktu Tempuh Pelayaran Kapal Kargo
    if (q.includes('berapa hari') || q.includes('waktu tempuh') || q.includes('lama kirim') || q.includes('durasi kapal') || q.includes('estimasi tiba')) {
      return `Halo! Estimasi waktu tempuh kapal kargo (*transit time*) dari pelabuhan muat Indonesia (Tanjung Priok / Tanjung Perak / Belawan) ke pelabuhan tujuan internasional:

• **Singapura / Malaysia:** 2 - 4 Hari
• **Tokyo (Jepang) / Shanghai (Tiongkok):** 10 - 14 Hari
• **Jebel Ali Dubai (Timur Tengah):** 14 - 18 Hari
• **Melbourne / Sydney (Australia):** 12 - 16 Hari
• **Hamburg Port (Jerman / Eropa):** 24 - 28 Hari (via Terusan Suez)
• **Los Angeles Port (Amerika Serikat):** 22 - 26 Hari (via Rute Samudra Pasifik)

Pergerakan kapal pengangkut dapat Anda pantau secara langsung melalui fitur Radar Maritim NusaBridge!`;
    }

    // 22. Ketentuan Pajak & Bea Keluar Ekspor
    if (q.includes('pajak ekspor') || q.includes('bea keluar') || q.includes('ppn ekspor')) {
      return `Halo! Kebijakan perpajakan ekspor di Indonesia sangat mendukung UMKM:

• **PPN Ekspor: 0% (Nol Persen):** Seluruh ekspor barang kena pajak dikenakan tarif PPN 0%.
• **Bea Keluar 0% (Gratis) untuk Produk Olahan UMKM:** Mayoritas produk hilir UMKM (kopi sangrai, rempah kering, mebel kayu ber-SVLK, kerajinan rotan, dan batik) tidak dikenakan Bea Keluar.
• **PPh Final UMKM:** Pajak penghasilan usaha tetap mengikuti tarif PPh Final UMKM 0,5% sesuai PP 55/2022.`;
    }

    // 23. Pengiriman Sampel Produk
    if (q.includes('kirim sampel') || q.includes('sampel') || q.includes('sample') || q.includes('contoh barang')) {
      return `Halo! Mengirimkan sampel produk berkualitas adalah langkah awal mendapatkan kontrak ekspor:

1. **Jasa Kurir Internasional:** Gunakan kurir ekspres seperti DHL, FedEx, atau EMS Pos Indonesia.
2. **Dokumen Sampel:** Sertakan *Proforma Invoice for Sample Purpose* dengan keterangan *"Sample of No Commercial Value for Testing Purpose Only"* berharga nominal rendah agar buyer tidak terkena pajak masuk tinggi.
3. **Sertifikat Saniter:** Untuk produk pertanian mentah (kopi mentah atau rempah), sertakan Sertifikat Fitosanitari Karantina agar paket tidak disita di bandara tujuan.
4. **Kesepakatan Biaya:** Lazimnya eksportir memberikan sampel gratis, sedangkan ongkos kirim ditanggung oleh calon buyer (*Freight Collect* atau transfer dimuka).`;
    }

    // 24. Cara Kerja AI / Artificial Intelligence / Machine Learning
    if (q.includes('cara kerja ai') || q.includes('how ai works') || q.includes('how does ai work') || q.includes('apa itu ai') || q.includes('what is ai') || q.includes('kecerdasan buatan') || q.includes('machine learning') || q.includes('deep learning') || q.includes('neural network') || q.includes('llm') || q.includes('model ai')) {
      const isEnglish = q.includes('how') || q.includes('what is') || q.includes('explain');
      if (isEnglish) {
        return `Hello! Artificial Intelligence (AI) works by enabling computer systems to learn from experience, recognize complex patterns, and make data-driven decisions similarly to the human brain.

Here is a step-by-step breakdown of how AI functions:

1. **Data Ingestion & Preprocessing:**
AI requires large volumes of diverse data (text, numbers, audio, or trade metrics). The data is cleaned, tokenized, and converted into mathematical vectors that neural networks can process.

2. **Neural Networks & Architecture:**
Modern AI uses deep neural networks composed of input layers, multiple hidden layers, and output layers. In Large Language Models (like Google Gemini), Transformer architectures with self-attention mechanisms allow the model to understand context across entire documents.

3. **Training & Optimization:**
During training, algorithms compare model predictions against known truths, calculate loss/error, and use optimization techniques (such as Backpropagation and Stochastic Gradient Descent) to adjust billions of internal weights.

4. **Inference & Real-Time Processing:**
Once trained, the AI performs inference: when you ask a question or submit an inquiry, it evaluates probable tokens and calculates the most precise, contextually rich response in milliseconds.

5. **Practical Application in NusaBridge:**
On this platform, Google Gemini AI is specifically tailored to:
• Parse informal buyer emails into structured Incoterms 2020 RFQs
• Calculate safe exporter profit margins (+18% to +24%)
• Validate NIB OSS numbers and quarantine certificates
• Safeguard 4-phase milestone payouts via Escrow Vault.

Would you like to explore a specific aspect of AI or its application in international business?`;
      }

      return `Halo! Kecerdasan Buatan (Artificial Intelligence / AI) bekerja dengan cara meniru kemampuan otak manusia dalam memproses informasi, mengenali pola, dan mengambil keputusan berbasis data.

Berikut adalah 5 tahapan utama bagaimana AI bekerja:

1. **Pengumpulan & Pemrosesan Data (Data Ingestion):**
AI membutuhkan ribuan hingga miliaran sampel data sebagai bahan belajar—seperti teks, angka, gambar, dokumen hukum, atau riwayat transaksi logistik maritim. Data ini diubah menjadi representasi angka (vektor matematis).

2. **Arsitektur Jaringan Saraf Tiruan (Neural Networks):**
Model AI modern dibangun menggunakan arsitektur jaringan saraf berlapis (Deep Learning). Pada model bahasa besar (seperti Google Gemini), mekanisme *Transformer & Self-Attention* memungkinkan AI memahami konteks kalimat secara mendalam, bukan sekadar mencocokkan kata perkata.

3. **Pelatihan & Penyesuaian Bobot (Training & Optimization):**
Selama fase latihan, AI membuat tebakan hasil, menghitung tingkat kesalahan (*loss function*), dan secara mandiri memperbaiki miliaran parameter internalnya (*weights & biases*) melalui algoritma optimasi (*Backpropagation*).

4. **Inferensi & Respons Real-Time (Inference):**
Setelah terlatih, AI siap digunakan untuk tahap inferensi: saat Anda mengetik pertanyaan atau memasukkan pesan penawaran buyer, AI menghitung probabilitas terbaik dan menghasilkan jawaban yang cerdas, terstruktur, dan tepat sasaran dalam hitungan detik.

5. **Penerapan Nyata pada Platform NusaBridge:**
Pada sistem kami, kemampuan AI diintegrasikan langsung untuk memecahkan tantangan nyata ekspor UMKM:
• **AI Sales Assistant:** Mengonversi pesan email buyer asing menjadi draf RFQ Incoterms 2020 resmi dengan margin aman.
• **Otomatisasi Dokumen:** Menerbitkan Proforma Invoice dan Sales Contract PDF standar ICC secara instan.
• **KYC Hub:** Mengaudit keabsahan NIB OSS dan standar karantina negara tujuan (FDA, EUDR, JAS).
• **Escrow Vault:** Memantau 4 fase pencairan dana aman berdasarkan telemetri kapal kargo.

Apakah ada hal spesifik seputar AI atau penggunaannya dalam bisnis ekspor yang ingin Anda pelajari lebih lanjut?`;
    }

    // 25. Salam & Sapaan Ramah (Greetings)
    if (q === 'halo' || q === 'hai' || q === 'hi' || q === 'hello' || q.startsWith('halo ') || q.startsWith('hai ') || q.startsWith('hello ') || q.includes('selamat pagi') || q.includes('selamat siang') || q.includes('selamat sore') || q.includes('selamat malam') || q.includes('apa kabar') || q.includes('how are you')) {
      return `Halo! Senang menyapa Anda. Saya adalah **NusaBridge AI**, asisten cerdas yang siap membantu Anda dalam segala hal seputar perdagangan ekspor-impor dan teknologi kecerdasan buatan.

Ada yang bisa saya bantu hari ini? Anda dapat bertanya tentang:
• **Cara Kerja AI & Teknologi:** Bagaimana kecerdasan buatan dan model AI beroperasi
• **Kalkulasi Biaya Ekspor:** Hitung estimasi harga FOB, Ocean Freight, Asuransi, dan CIF dengan rekomendasi margin aman
• **Audit Legalitas & Regulasi:** Syarat izin NIB OSS, karantina fitosanitari, regulasi FDA Amerika, EUDR Eropa, dan JAS Jepang
• **Katalog Komoditas:** Spesifikasi dan harga acuan dari 120 komoditas unggulan (Kopi, Rempah, Mebel Rotan, Kriya, Tekstil)
• **Keamanan Transaksi:** Skema penguncian dan pencairan dana 4 tahap bertahap di Escrow Vault

Silakan ketik pertanyaan apa saja yang ingin Anda diskusikan!`;
    }

    // 26. Tentang NusaBridge & Pengembang Platform
    if (q.includes('nusabridge') || q.includes('pembuat') || q.includes('arjika') || q.includes('antartika') || q.includes('siapa kamu') || q.includes('kamu siapa') || q.includes('who are you') || q.includes('tentang platform') || q.includes('profil kamu')) {
      return `Halo! Saya adalah **NusaBridge AI**, asisten cerdas perdagangan ekspor-impor yang dibangun oleh **Tim Arjika Labs - SMK Antartika 1 Sidoarjo**.

NusaBridge dirancang untuk memberdayakan UMKM Indonesia agar mampu menembus pasar internasional secara mandiri dan aman melalui 4 Pilar Utama:
1. **AI Sales Assistant & RFQ Studio**: Menghitung estimasi Incoterms 2020 otomatis dan mengonversi pesan penawaran buyer asing menjadi kontrak formal.
2. **Auto-PDF Document Generator**: Menerbitkan draf Proforma Invoice dan Sales Contract berstandar ICC secara instan dan siap cetak.
3. **KYC Hub & Kepatuhan Global**: Memvalidasi NIB OSS, sertifikasi karantina fitosanitari, dan kepatuhan standar negara tujuan (FDA, EUDR, JAS).
4. **Escrow Vault**: Menjamin keamanan pembayaran bertahap 4 fase (30% DP $\\rightarrow$ 30% PEB $\\rightarrow$ 20% Bill of Lading $\\rightarrow$ 20% Tiba di Tujuan) agar UMKM terhindar dari risiko gagal bayar buyer luar negeri.

Ada yang ingin Anda ketahui lebih lanjut mengenai NusaBridge?`;
    }

    // 27. Pertanyaan Seputar Pemrograman, Komputer, & Teknologi
    if (q.includes('coding') || q.includes('koding') || q.includes('program') || q.includes('javascript') || q.includes('python') || q.includes('komputer') || q.includes('server') || q.includes('database') || q.includes('api') || q.includes('teknologi')) {
      return `Halo! Terkait topik teknologi dan pengembangan perangkat lunak:

Teknologi modern dan sistem berbasis AI dirancang untuk memecahkan masalah kompleks secara efisien:
• **Arsitektur Aplikasi:** NusaBridge sendiri dibangun dengan arsitektur web modern yang menggabungkan backend Express.js, sistem database cloud Supabase PostgreSQL, dan integrasi SDK Google GenAI (@google/genai).
• **Panggilan API & Interaksi Cerdas:** Sistem menggunakan REST API untuk menghubungkan antarmuka pengguna dengan mesin AI, sehingga analisis RFQ, kalkulasi Incoterms, dan verifikasi dokumen dapat dijalankan secara instan.
• **Otomatisasi Dokumen:** Menggunakan formatting berbasis CSS Print & PDF templating berstandar internasional untuk mencetak Proforma Invoice dan Sales Contract secara rapi.

Apakah ada aspek pemrograman, API, atau arsitektur teknologi tertentu yang ingin Anda tanyakan?`;
    }

    return `Saya belum menemukan jawaban yang cukup spesifik untuk **"${raw}"**. Saya bisa membantu menjelaskan katalog produk NusaBridge, RFQ, Incoterms, dokumen, dan persyaratan umum ekspor. Untuk kepastian harga atau aturan terbaru, konfirmasikan kepada pemasok dan instansi terkait.`;
  }

  // Rahasia AI hanya dibaca dari konfigurasi backend, tidak dari request browser.
  const activeKey = getStoredApiKey();
  const reqLang = String(req.body.lang || '').toLowerCase() === 'en' ? 'en' : 'id';

  // Use matching reference material to ground the AI, not replace the conversation.
  const reference = findReferenceAnswer(message, reqLang);
  if (!activeKey) {
    if (reference) {
      return res.json({
        success: true,
        reply: reference.answer,
        agent: 'NusaBridge AI',
        model: 'NusaBridge Knowledge Base',
      });
    }

    return res.status(503).json({
      success: false,
      message: reqLang === 'en'
        ? 'The AI service is not configured right now. Please try again later.'
        : 'Layanan AI belum dikonfigurasi. Silakan coba lagi nanti.',
    });
  }

  try {
        const history = Array.isArray(context?.history)
          ? context.history
            .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
            .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 2000) }))
            .filter((item) => item.content)
            .slice(-8)
          : [];
        const catalogQuery = [...history.filter((item) => item.role === 'user').map((item) => item.content), rawText].join(' ');
        const matchedProducts = findMatchingProducts(catalogQuery, allProducts);
        const asksForCatalog = /\b(?:products?|produk|catalog|katalog|commodities|komoditas|items?)\b/i.test(catalogQuery);
        const productsForPrompt = matchedProducts.length
          ? matchedProducts
          : asksForCatalog
            ? allProducts
            : [];
        const catalogLines = productsForPrompt.map((product) => JSON.stringify({
          name: product.name,
          origin: product.origin,
          price: product.price,
          unit: product.unit,
          moq: product.moq,
          hsCode: product.hsCode,
          description: product.desc,
          specifications: product.specs,
          certifications: product.certs,
          shipping: product.shipping,
        })).join('\n');

        const languageRule = reqLang === 'en'
          ? '2. Answer in the language of the latest user message; if it is unclear or mixed, use English.'
          : '2. Jawab dalam bahasa pada pesan terbaru pengguna; jika tidak jelas atau campuran, gunakan bahasa Indonesia.';
        const referenceContext = reference
          ? `\nINFORMASI RUJUKAN YANG MUNGKIN RELEVAN (gunakan hanya bila sesuai; jawab secara alami dan jangan menyebut sumber):\n${reference.answer}`
          : '';

        const sysInstruction = `Kamu adalah asisten untuk website NusaBridge, platform informasi dan simulasi alur ekspor UMKM Indonesia.
ATURAN:
1. Percakapan bersifat terbuka: jawab pertanyaan pengguna dengan langsung dan relevan, terutama tentang website NusaBridge, fitur, katalog produk, RFQ, dan alur ekspor. Pertanyaan lanjutan boleh memakai konteks chat sebelumnya.
2. Jawab langsung sesuai pertanyaan. Jangan melebar, mengulang pertanyaan, menambahkan topik yang tidak diminta, atau menampilkan sumber/link eksternal.
3. Jika pertanyaan tidak berkaitan dengan NusaBridge atau ekspor, jelaskan dengan singkat bahwa asisten ini fokus pada website NusaBridge, lalu tawarkan topik website yang bisa dibantu.
4. Jangan mengarang fitur, status transaksi, harga, stok, regulasi, atau data produk. Katalog di bawah adalah satu-satunya sumber fakta produk. Hanya sebutkan informasi yang tercantum persis di data katalog; jangan menyimpulkan kualitas, manfaat, target pasar, atau spesifikasi tambahan.
5. Escrow Vault, KYC, dan alur dokumen di website merupakan simulasi/panduan; jangan menyebutnya sebagai layanan pembayaran atau verifikasi resmi sungguhan.
6. Jika pertanyaan ambigu, minta satu klarifikasi singkat.
${languageRule}
7. Format jawaban dengan Markdown bersih, tanpa tag HTML mentah.
8. Saat membuat draf pesan atau promosi, jangan menambah klaim pemasaran atau fakta yang tidak ada di katalog (misalnya "premium", "handcrafted", atau kecocokan untuk pasar tertentu). Pakai placeholder seperti [spesifikasi produk] atau [harga] untuk informasi yang belum tersedia. Jangan menambahkan Incoterm pada harga kecuali tercantum pada field shipping.
9. NusaBridge adalah platform; jangan mengklaim NusaBridge sebagai penjual atau produsen. Dalam draf atas nama pengguna, gunakan placeholder [nama perusahaan] kecuali pengguna memberi nama usahanya.
10. Untuk pertanyaan tentang cara kerja fitur website, gunakan konteks alur website di bawah. Jangan menambahkan menu, fitur, atau langkah marketplace umum yang tidak tercantum.

DATA KATALOG YANG RELEVAN (${productsForPrompt.length} produk):
${catalogLines || '(tidak ada produk katalog yang cocok; jangan mengarang detail produk)'}
ALUR RFQ WEBSITE (FAKTA AKTUAL):
- Buka katalog produk, pilih produk, lalu klik "Ajukan RFQ".
- Pada formulir, produk sudah terpilih. Pengguna mengisi jumlah, memilih Incoterms (FOB, CIF, C&F, atau EXW), pelabuhan tujuan, dan email buyer/kontak, lalu klik "Kirim RFQ".
- Jika berhasil disimpan, website menampilkan bukti pengajuan dengan nomor RFQ, detail permintaan, status "Diajukan — menunggu peninjauan", dan tahapan proses. "Perbarui Status" mengambil status terbaru untuk nomor RFQ tersebut.
- Bukti RFQ bukan bukti pembayaran atau pesanan yang sudah disepakati. Website tidak otomatis mengirim permintaan ke pemasok, menerima penawaran, membandingkan penawaran, atau menyediakan dashboard/negosiasi RFQ.
${referenceContext}`;

      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + activeKey },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: sysInstruction },
            ...history,
            { role: 'user', content: message },
          ],
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await resp.json().catch(() => ({}));
      const generatedText = data?.choices?.[0]?.message?.content;
      if (!resp.ok || typeof generatedText !== 'string' || !generatedText.trim()) {
        console.warn('[Groq API]: request failed with status', resp.status, data?.error?.message || '');
        if (reference) {
          return res.json({
            success: true,
            reply: reference.answer,
            agent: 'NusaBridge AI',
            model: 'NusaBridge Knowledge Base',
          });
        }

        return res.status(503).json({
          success: false,
          message: reqLang === 'en'
            ? 'The AI could not answer right now. Please try again in a moment.'
            : 'AI belum dapat menjawab saat ini. Silakan coba lagi sebentar.',
        });
      }

      const aiReply = generatedText.replace(/<[^>]*>/g, '').trim();

  res.json({
    success: true,
    reply: aiReply,
    agent: 'NusaBridge AI',
    model: 'openai/gpt-oss-120b (Groq)',
    isOfficialGemini: false,
  });
  } catch (apiErr) {
    console.warn('[Groq API Call]:', apiErr.message);
    if (reference) {
      return res.json({
        success: true,
        reply: reference.answer,
        agent: 'NusaBridge AI',
        model: 'NusaBridge Knowledge Base',
      });
    }

    return res.status(503).json({
      success: false,
      message: reqLang === 'en'
        ? 'The AI could not answer right now. Please try again in a moment.'
        : 'AI belum dapat menjawab saat ini. Silakan coba lagi sebentar.',
    });
  }
});

// ==========================================================================
// 8. ESCROW TRANSACTIONS LIST
// ==========================================================================
app.get('/api/transactions', async (req, res) => {
  try {
    const list = await db.read('transactions');
    res.json({ success: true, count: list.length, transactions: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 NusaBridge Backend API Server Berjalan di Port: ${PORT}`);
  console.log(`📡 URL API: http://localhost:${PORT}/api/health`);
  console.log(`📦 Database: ${db.provider}`);
  console.log(`🩺 Periksa databaseReady pada endpoint /api/health untuk status katalog dan tabel.`);
  console.log(`=======================================================`);
});
