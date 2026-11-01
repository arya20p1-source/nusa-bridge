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
const db = require('./database/db');
const { findReferenceAnswer } = require('./reference-answers');
const {
  FALLBACK_PRODUCTS,
  detectOffTopic,
  detectIntent,
  findMatchingProducts,
  buildFallbackReply,
  buildSystemPrompt,
  normalizeRole,
  offTopicReply,
} = require('./chat-engine');

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
    const requestedRole = String(role).trim().toLowerCase();
    const accountRole = requestedRole === 'importer' ? 'buyer' : requestedRole;

    if (!['seller', 'buyer'].includes(accountRole)) {
      return res.status(400).json({ success: false, message: 'Role harus seller (eksportir) atau buyer (importir).' });
    }

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
      role: accountRole,
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
// 3. PRODUCTS CATALOG (50 KOMODITAS EKSPOR INDONESIA)
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
  const reqLang = String(req.body.lang || '').toLowerCase() === 'en' ? 'en' : 'id';
  const role = normalizeRole(context?.role || req.body.role);
  const page = String(context?.page || req.body.page || '').trim().slice(0, 40);

  if (!rawText) {
    return res.json({
      success: true,
      reply: buildFallbackReply({ message: '', lang: reqLang, role, page }),
      agent: 'NusaBridge AI',
      model: 'NusaBridge Knowledge Base',
    });
  }

  // Katalog dari database; jika kosong/tidak tersedia, pakai katalog fallback
  // yang sama dengan data frontend supaya jawaban produk tetap faktual.
  let allProducts = [];
  try {
    allProducts = await db.read('products');
  } catch (err) {
    console.warn('[AI Chat catalog]:', err.message);
  }
  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    allProducts = FALLBACK_PRODUCTS;
  }

  const history = Array.isArray(context?.history)
    ? context.history
      .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
      .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 2000) }))
      .filter((item) => item.content)
      .slice(-8)
    : [];

  const reference = findReferenceAnswer(rawText, reqLang);
  const fallbackReply = () => buildFallbackReply({
    message: rawText,
    lang: reqLang,
    role,
    page,
    products: allProducts,
    reference,
  });

  // Pertanyaan di luar cakupan ditolak secara deterministik. Jangan pernah
  // meneruskan pertanyaan off-topic ke model, meskipun API key tersedia.
  if (detectOffTopic(rawText)) {
    return res.json({
      success: true,
      reply: offTopicReply(reqLang),
      agent: 'NusaBridge AI',
      model: 'NusaBridge Knowledge Base',
      offTopic: true,
    });
  }

  const intent = detectIntent(rawText, allProducts);

  // Pertanyaan daftar katalog dijawab dari data katalog, bukan dari model,
  // agar jumlah dan nama produk tidak pernah dikarang.
  if (intent === 'catalog-list') {
    return res.json({
      success: true,
      reply: fallbackReply(),
      agent: 'NusaBridge AI',
      model: 'NusaBridge Knowledge Base',
    });
  }

  const activeKey = getStoredApiKey();
  if (!activeKey) {
    return res.json({
      success: true,
      reply: fallbackReply(),
      agent: 'NusaBridge AI',
      model: 'NusaBridge Knowledge Base',
    });
  }

  try {
    const catalogQuery = [
      ...history.filter((item) => item.role === 'user').map((item) => item.content),
      rawText,
    ].join(' ');
    const matchedProducts = findMatchingProducts(catalogQuery, allProducts);
    const asksForCatalog = /\b(?:products?|produk|catalog|katalog|commodities|komoditas|items?)\b/i.test(catalogQuery);
    const productsForPrompt = matchedProducts.length
      ? matchedProducts
      : asksForCatalog
        ? allProducts.slice(0, 12)
        : [];

    const sysInstruction = buildSystemPrompt({
      lang: reqLang,
      role,
      page,
      products: productsForPrompt,
      referenceAnswer: reference?.answer || '',
    });

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + activeKey },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: sysInstruction },
          ...history,
          { role: 'user', content: rawText },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await resp.json().catch(() => ({}));
    const generatedText = data?.choices?.[0]?.message?.content;
    if (!resp.ok || typeof generatedText !== 'string' || !generatedText.trim()) {
      console.warn('[Groq API]: request failed with status', resp.status, data?.error?.message || '');
      return res.json({
        success: true,
        reply: fallbackReply(),
        agent: 'NusaBridge AI',
        model: 'NusaBridge Knowledge Base',
      });
    }

    return res.json({
      success: true,
      reply: generatedText.replace(/<[^>]*>/g, '').trim(),
      agent: 'NusaBridge AI',
      model: 'llama-3.3-70b-versatile (Groq)',
      isOfficialGemini: false,
    });
  } catch (apiErr) {
    console.warn('[Groq API Call]:', apiErr.message);
    return res.json({
      success: true,
      reply: fallbackReply(),
      agent: 'NusaBridge AI',
      model: 'NusaBridge Knowledge Base',
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
