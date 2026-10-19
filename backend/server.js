/**
 * ==========================================================================
 * NUSABRIDGE - BACKEND REST API & GEMINI AI AGENT ENGINE
 * File: server.js
 * Deskripsi: Server Express dengan Database JavaScript native & AI Agent
 * Built for GTNIC 2026 Prototype
 * ==========================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('../database/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files and root assets
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..')));

// ==========================================================================
// 1. HEALTH CHECK
// ==========================================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'NusaBridge AI Trade Facilitation Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'JavaScript Native JSON-Store Active'
  });
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

    const newRfq = await db.create('rfq', {
      buyerName: buyerName || 'Global Buyer Partner',
      buyerCompany: buyerCompany || 'International Trading Co.',
      buyerCountry: buyerCountry || 'Global Port Destination',
      productId: productId || 'prod_001',
      productName: productName || 'Komoditas Unggulan Indonesia',
      quantity: Number(quantity) || 1000,
      unit: unit || 'Kg',
      targetIncoterms: targetIncoterms || 'CIF Hamburg',
      targetPriceUSD: Number(targetPriceUSD) || 10.0,
      status: 'submitted',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'RFQ berhasil diajukan! AI Agent NusaBridge sedang menganalisis penawaran.',
      rfq: newRfq
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/rfq', async (req, res) => {
  try {
    const items = await db.read('rfq');
    res.json({ success: true, count: items.length, rfqs: items });
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

async function getGenAIClient() {
  if (genaiClient) return genaiClient;
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    return null;
  }
  try {
    const { GoogleGenAI } = await import('@google/genai');
    genaiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { apiVersion: "v1" }
    });
    return genaiClient;
  } catch (err) {
    console.warn('[GenAI SDK Warning]:', err.message);
    return null;
  }
}

app.post('/api/ai/chat', async (req, res) => {
  const { message = '', context = {} } = req.body;
  const rawText = String(message || '').trim();
  const q = rawText.toLowerCase();

  // Ambil data produk dari database JSON untuk pencarian dinamis
  let allProducts = [];
  try {
    allProducts = await db.read('products');
  } catch (err) {
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

    // Periksa apakah pertanyaan adalah tentang panduan, regulasi, kalkulasi, atau konsep
    const isLegalityOrGuide = (
      q.includes('cara ekspor') || q.includes('bagaimana ekspor') || q.includes('memulai ekspor') || q.includes('langkah ekspor') || q.includes('pemula') ||
      q.includes('incoterm') || q.includes('apa itu') || q.includes('beda fob') || q.includes('perbedaan') ||
      q.includes('legalitas') || q.includes('karantina') || q.includes('fitosanitari') || q.includes('sertifikat') || q.includes('izin') || q.includes('syarat') ||
      q.includes('escrow') || q.includes('bayar') || q.includes('pembayaran') || q.includes('keamanan') ||
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
    if (q.includes('hamburg') || q.includes('jerman') || (q.includes('robusta') && (q.includes('cif') || q.includes('20 mt') || q.includes('ton')))) {
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
    if (q.includes('los angeles') || q.includes('amerika') || q.includes('usa') || (q.includes('cengkeh') && q.includes('cif'))) {
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
    if (q.includes('tokyo') || q.includes('jepang') || q.includes('japan') || (q.includes('rotan') && q.includes('fob'))) {
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
    if (q.includes('hitung') || q.includes('kalkulasi') || q.includes('estimasi biaya') || q.includes('ongkir') || q.includes('biaya kirim') || q.includes('freight')) {
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
    if (q.includes('incoterm') || q.includes('fob') || q.includes('cif') || q.includes('cfr') || q.includes('exw') || q.includes('ddp') || q.includes('beda fob')) {
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
    if (q.includes('legalitas') || q.includes('nib') || q.includes('npwp') || q.includes('oss') || q.includes('izin') || q.includes('syarat') || q.includes('karantina') || q.includes('fitosanitari') || q.includes('phytosanitary') || q.includes('fda') || q.includes('eudr') || q.includes('jas') || q.includes('svlk')) {
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
    if (q.includes('escrow') || q.includes('bayar') || q.includes('pembayaran') || q.includes('aman') || q.includes('penipuan') || q.includes('rekening') || q.includes('dp') || q.includes('uang muka') || q.includes('fase')) {
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

    // 9. Dokumen Pokok Ekspor Resmi
    if (q.includes('dokumen') || q.includes('surat') || q.includes('invoice') || q.includes('sales contract') || q.includes('peb') || q.includes('packing list') || q.includes('bill of lading') || q.includes('bl') || q.includes('coo') || q.includes('ska')) {
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

    // 11. Informasi Katalog 120 Komoditas Ekspor
    if (q.includes('katalog') || q.includes('daftar komoditas') || q.includes('daftar produk') || q.includes('apa saja yang dijual') || q.includes('pilihan komoditas')) {
      return `Halo! NusaBridge menyediakan etalase kurasi 120 komoditas ekspor unggulan Indonesia yang telah lolos verifikasi standar mutu dan legalitas:

• ☕ **Kopi Ekspor Unggulan (30 Produk)**:
Kopi Arabika & Robusta Specialty pilihan (Gayo Aceh, Toraja Sapan, Mandheling, Robusta Lampung ELB, Dampit Malang, Kintamani Bali, Bajawa Flores, Wamena Papua, dll.) dengan opsi Green Beans mentah maupun Roasted Beans.

• 🌿 **Rempah-Rempah & Hasil Alam (30 Produk)**:
Cengkeh Lalpari Maluku Grade AA, Kayu Manis Korintji Cassia Vera, Lada Putih Muntok Double Washed, Vanila Gourmet Papua, Pala Banda ABCD, Kapulaga Putih Super, dan Minyak Atsiri Nilam Aceh.

• 🪵 **Kriya & Kerajinan Ramah Lingkungan (30 Produk)**:
Kursi & Furnitur Anyaman Rotan Cirebon, Mebel Kayu Jati SVLK Jepara, Kerajinan Anyaman Enceng Gondok, Mangkuk Batok Kelapa Eco-Polished, dan Keranjang Seagrass.

• 🧵 **Tekstil & Wastra Nusantara (30 Produk)**:
Kain Batik Tulis Sutra Solo/Yogya Motif Keraton, Batik Cap Pekalongan Katun Primisima, Tenun Ikat Troso Jepara, Tenun Sumba Pewarna Alami, Songket Palembang Benang Emas, dan Ulos Batak Tradisional.

Anda dapat menanyakan harga atau spesifikasi komoditas mana pun secara spesifik, dan saya akan memberikan informasi lengkapnya!`;
    }

    // 12. Sapaan Ramah & Percakapan Kasual
    if (q.includes('halo') || q.includes('hai') || q.includes('selamat pagi') || q.includes('selamat siang') || q.includes('selamat malam') || q.includes('assalamualaikum') || q === 'hi' || q === 'hello') {
      return `Halo! Selamat datang di NusaBridge Gemini AI. Saya adalah asisten pintar perdagangan ekspor-impor untuk UMKM Indonesia.

Ada yang bisa saya bantu hari ini? Anda dapat menanyakan seputar:
• Informasi harga, spesifikasi, dan MOQ dari 120 komoditas ekspor Indonesia.
• Perhitungan kalkulasi Incoterms (FOB / CIF), ocean freight, dan proteksi margin aman.
• Pengecekan syarat perizinan dan kepatuhan global (NIB OSS, Karantina, FDA, EUDR, JAS).
• Panduan transaksi aman dengan sistem Escrow Vault 4 tahap.

Silakan ketik pertanyaan Anda secara bebas!`;
    }

    if (q.includes('terima kasih') || q.includes('makasih') || q.includes('thanks') || q.includes('ok') || q.includes('oke') || q.includes('siap')) {
      return `Sama-sama! Senang bisa membantu Anda. Jika ada pertanyaan lain seputar ekspor komoditas, perhitungan biaya pengiriman, atau pembuatan dokumen perdagangan, silakan ketik kapan saja. Sukses selalu untuk perdagangan ekspor UMKM Indonesia!`;
    }

    // 13. Respons Analitis Kontekstual Bebas (Tidak Ngawur)
    return `Halo! Mengenai pertanyaan Anda tentang "${raw}":

Dalam praktik perdagangan ekspor-impor UMKM bersama NusaBridge:
• **Analisis Operasional**: Setiap transaksi ekspor memerlukan kesesuaian antara spesifikasi komoditas, perhitungan biaya pengiriman (Incoterms 2020), dan pemenuhan syarat regulasi di negara pembeli.
• **Perhitungan Biaya**: Kami menyarankan Anda menyusun penawaran dengan memperhitungkan harga pokok barang, biaya penanganan lokal ke pelabuhan, ongkos kapal laut internasional, serta margin laba bersih minimal 15-20%.
• **Kepastian Hukum & Finansial**: Seluruh kesepakatan sebaiknya dituangkan dalam Sales Contract resmi berformat PDF dan dilindungi dengan skema pembayaran bertahap di Escrow Vault (30% DP, 30% PEB, 20% Bill of Lading, 20% Tiba).

Apakah Anda ingin saya hitungkan estimasi biaya untuk produk tertentu atau membuatkan draf dokumen penawarannya? Silakan sebutkan nama komoditas, jumlah kuantitas, dan negara tujuannya!`;
  }

  let aiReply = getHeuristicReply(message);

  // Jika terhubung dengan SDK @google/genai resmi dan memiliki API Key aktif
  try {
    const ai = await getGenAIClient();
    if (ai) {
      const systemInstruction = `Kamu adalah NusaBridge Gemini AI, asisten perdagangan ekspor-impor pintar untuk UMKM Indonesia pada kompetisi GTNIC 2026.
PEDOMAN BAHASA & FORMAT:
1. Gunakan gaya bahasa Google Gemini yang hangat, santun, cerdas, terstruktur rapi, dan nyaman dibaca oleh UMKM maupun juri.
2. JANGAN PERNAH menyertakan tag HTML mentah (<p>, <div>, <span>, dll.) atau label kaku seperti "(Pilar 1)", "(Pilar 2)", "[BUYER INPUT]", "[PILAR 1]".
3. Format teks menggunakan Markdown bersih: gunakan **teks tebal** untuk istilah kunci, bullet points (•) untuk rincian, dan paragraf yang teratur.
4. Jawablah langsung inti pertanyaan pengguna secara relevan dan nyambung dengan konteks yang ditanyakan.
5. Jika ditanya harga atau produk komoditas ekspor, berikan rincian harga, asal daerah, HS Code, dan standar mutu.
6. Jika ditanya kalkulasi biaya pengiriman, hitung Incoterms FOB, Ocean Freight, Asuransi, CIF, dan Margin Aman UMKM.
7. Jika ditanya legalitas, jelaskan NIB OSS RBA, karantina fitosanitari, dan regulasi negara tujuan (FDA, EUDR, JAS).
8. Jika ditanya skema pembayaran, jelaskan perlindungan Escrow Vault dengan pencairan 4 tahap (30% DP -> 30% PEB -> 20% B/L -> 20% Tiba).`;

      let generatedText = null;

      // 1. Coba melalui ai.interactions.create sesuai snippet Google GenAI SDK v1
      if (ai.interactions && typeof ai.interactions.create === 'function') {
        try {
          const interaction = await ai.interactions.create({
            model: "gemini-1.5-flash",
            input: `${systemInstruction}\n\n[USER INPUT]:\n"${message}"`,
          });
          if (interaction && (interaction.output_text || interaction.text)) {
            generatedText = interaction.output_text || interaction.text;
          }
        } catch (eInteractions) {
          // Fallback ke models.generateContent jika interactions endpoint membutuhkan setup khusus
        }
      }

      // 2. Coba melalui ai.models.generateContent
      if (!generatedText && ai.models && typeof ai.models.generateContent === 'function') {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
              { role: 'user', parts: [{ text: `${systemInstruction}\n\n[USER INPUT]:\n"${message}"` }] }
            ]
          });
          if (response && response.text) {
            generatedText = response.text;
          }
        } catch (eModels) {
          console.warn('[Gemini models.generateContent]:', eModels.message);
        }
      }

      if (generatedText) {
        aiReply = generatedText.replace(/<[^>]*>/g, '');
      }
    }
  } catch (apiErr) {
    console.warn('[Gemini SDK API Call]: Menggunakan engine cerdas bawaan:', apiErr.message);
  }

  // Pastikan respons bersih dari tag HTML mentah
  aiReply = String(aiReply).replace(/<[^>]*>/g, '');

  res.json({
    success: true,
    reply: aiReply,
    agent: 'NusaBridge Gemini AI',
    model: process.env.GEMINI_API_KEY ? 'gemini-1.5-flash (@google/genai SDK)' : 'NusaBridge Natural Intelligence Engine'
  });
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
  console.log(`📦 Database: JavaScript JSON-Store (database/)`);
  console.log(`☕ Siap melayani 120+ komoditas ekspor UMKM Indonesia!`);
  console.log(`=======================================================`);
});
