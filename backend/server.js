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
const {
  authenticate,
  requireAuth,
  createToken,
  hashPassword,
  verifyPassword,
  normalizeAccountRole,
} = require('./auth');
const { publicUser, isAdmin, ownsProduct, writeAudit } = require('./authorization');
const rbacRouter = require('./routes/rbac');
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

// Autentikasi opsional dijalankan untuk SEMUA /api. Token yang valid memuat
// ulang user dari database, sehingga role/status selalu berasal dari server.
app.use(authenticate);

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
// 2. AUTHENTICATION (REGISTER, LOGIN, SESSION)
// ==========================================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      company,
      role = 'seller',
      nib,
      npwp,
      plan = 'Free Trial',
    } = req.body || {};

    const requestedRole = normalizeAccountRole(role);
    if (requestedRole === 'admin') {
      return res.status(400).json({
        success: false,
        code: 'ADMIN_ROLE_FORBIDDEN',
        message: 'Akun admin tidak dapat didaftarkan sendiri melalui API publik.',
      });
    }
    if (!['seller', 'buyer'].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE',
        message: 'Role harus seller (eksportir) atau buyer (importir).',
      });
    }

    const cleanName = String(name || '').trim().slice(0, 160);
    const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 240);
    if (!cleanName) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_NAME',
        message: 'Nama wajib diisi.',
      });
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EMAIL',
        message: 'Email wajib diisi dengan format yang valid.',
      });
    }

    const existing = await db.findOne(
      'users',
      (user) => !user.deletedAt && String(user.email || '').toLowerCase() === cleanEmail
    );
    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Email ini sudah terdaftar. Silakan masuk menggunakan email tersebut.',
      });
    }

    // Akun baru wajib memiliki password. Akun lama tanpa password tetap bisa
    // login dengan email saja (kompatibilitas), tetapi begitu password diatur,
    // password tersebut wajib diverifikasi pada setiap login.
    const passwordValue = password === undefined || password === null ? '' : String(password);
    if (passwordValue.length < 8) {
      return res.status(400).json({
        success: false,
        code: 'WEAK_PASSWORD',
        message: 'Password wajib diisi dan minimal 8 karakter.',
      });
    }

    const newUser = await db.create('users', {
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashPassword(passwordValue),
      company: String(company || cleanName).trim().slice(0, 200),
      role: requestedRole,
      nib: String(nib || '').trim().slice(0, 40) || `12${Math.floor(10000000000 + Math.random() * 90000000000)}`,
      npwp: String(npwp || '').trim().slice(0, 40) || `01.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}.0-012.000`,
      status: 'verified',
      plan: String(plan || 'Free Trial').trim().slice(0, 120),
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    await writeAudit(req, {
      action: 'auth.register',
      tableName: 'users',
      recordId: newUser.id,
      newData: publicUser(newUser),
    });

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Akun Anda aktif dan otomatis login.',
      user: publicUser(newUser),
      token: createToken(newUser),
    });
  } catch (err) {
    console.error('[Register]:', err.message);
    res.status(500).json({
      success: false,
      code: 'REGISTER_FAILED',
      message: 'Gagal memproses registrasi: ' + err.message,
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 240);

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EMAIL',
        message: 'Email wajib diisi dengan format yang valid.',
      });
    }

    let user = await db.findOne(
      'users',
      (row) => !row.deletedAt && String(row.email || '').toLowerCase() === cleanEmail
    );

    // Akun harus terdaftar. Jangan membuat akun otomatis dari email yang belum
    // terdaftar, karena itu memungkinkan siapa pun membuat sesi tanpa mendaftar
    // dan tanpa password.
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Email atau password salah. Jika belum punya akun, silakan daftar terlebih dahulu.',
      });
    }

    if (String(user.status || '').toLowerCase() === 'suspended') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Akun ini sedang ditangguhkan. Hubungi admin NusaBridge.',
      });
    }

    const role = normalizeAccountRole(user.role);

    // Jika akun sudah memiliki password, password wajib benar untuk SEMUA
    // role. Hanya akun lama yang belum pernah mengatur password yang masih
    // dapat login dengan email saja. Admin tanpa password tidak boleh masuk.
    if (user.passwordHash) {
      if (!password || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: role === 'admin'
            ? 'Email atau password admin salah.'
            : 'Email atau password salah.',
        });
      }
    } else if (role === 'admin') {
      return res.status(403).json({
        success: false,
        code: 'ADMIN_PASSWORD_NOT_SET',
        message: 'Akun admin belum memiliki password. Atur password admin melalui script admin:create.',
      });
    }

    const updatedUser = await db.update('users', user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Login berhasil! Selamat datang kembali.',
      user: publicUser(updatedUser || user),
      token: createToken(updatedUser || user),
    });
  } catch (err) {
    console.error('[Login]:', err.message);
    res.status(500).json({
      success: false,
      code: 'LOGIN_FAILED',
      message: 'Gagal memproses login: ' + err.message,
    });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.auth) });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  // Token stateless: logout cukup menghapus token di sisi klien. Endpoint ini
  // disediakan agar klien punya jalur eksplisit dan tidak menganggap logout
  // memalsukan data server.
  res.json({ success: true, message: 'Sesi berhasil diakhiri di perangkat ini.' });
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
    if (!product || product.deletedAt) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    // Produk draft/arsip tidak boleh bocor ke publik. Pemilik dan admin tetap
    // dapat melihatnya untuk keperluan pengelolaan.
    const published = !product.status || product.status === 'published';
    const privileged = Boolean(req.auth && (isAdmin(req.auth) || ownsProduct(req.auth, product)));
    if (!published && !privileged) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================================
// 4. RFQ / PESANAN
// Ditangani oleh routes/rbac.js agar validasi idempotency, kepemilikan, dan
// RBAC berada di satu tempat. Guest tetap dapat mengirim RFQ dan menerima
// token akses untuk mengecek status.
// ==========================================================================

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
// 8. RBAC, RFQ, PRODUCT MANAGEMENT, & ESCROW TRANSACTIONS
// ==========================================================================
app.use('/api', rbacRouter);

// API fallback: jangan biarkan request /api yang tidak dikenal jatuh ke SPA.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'API_NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

// Error handler terpusat untuk route async maupun middleware.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_JSON',
      message: 'Body request bukan JSON yang valid.',
    });
  }

  const status = Number(err && err.status) >= 400 ? Number(err.status) : 500;
  const code = (err && err.code) || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED');

  if (status >= 500) {
    console.error('[API Error]:', err && err.stack ? err.stack : err);
  }

  res.status(status).json({
    success: false,
    code,
    message:
      status >= 500
        ? 'Terjadi kesalahan pada server. Silakan coba lagi.'
        : (err && err.message) || 'Permintaan tidak dapat diproses.',
    ...((err && err.extra) || {}),
  });
});

// Jalankan Server hanya saat file ini dieksekusi langsung, bukan saat di-require
// oleh test otomatis.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 NusaBridge Backend API Server Berjalan di Port: ${PORT}`);
    console.log(`📡 URL API: http://localhost:${PORT}/api/health`);
    console.log(`📦 Database: ${db.provider}`);
    console.log(`🩺 Periksa databaseReady pada endpoint /api/health untuk status katalog dan tabel.`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
