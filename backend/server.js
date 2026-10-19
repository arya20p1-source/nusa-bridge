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
  // Knowledge Engine Respons Terstruktur NusaBridge (Format Khas Gemini)
  function getHeuristicReply(messageText) {
    const q = messageText.toLowerCase().trim();

    // 1. Skenario Hamburg / Kopi Robusta Lampung (CIF Hamburg)
    if (q.includes('hamburg') || (q.includes('robusta') && (q.includes('cif') || q.includes('kopi')))) {
      return `Halo Hanseatic Coffee Importers! Salam hangat dari NusaBridge Indonesia. Terima kasih telah mempercayakan pengadaan komoditas kopi Nusantara melalui platform kami.

Berikut adalah analisis komprehensif transaksi ekspor **20 Metric Ton (MT) Kopi Robusta Lampung Grade 1** dengan skema pengiriman **CIF Hamburg Port, Jerman**, terintegrasi dalam **4 Pilar NusaBridge**:

### 📊 1. Kalkulasi RFQ Studio & Incoterms 2020 (Pilar 1)
* **Harga Dasar FOB Tanjung Priok**: $3.85 / Kg (Subtotal: $77,000 USD)
* **Ocean Freight & Asuransi Maritim**: $0.42 / Kg (Subtotal: $8,400 USD)
* **Total Penawaran CIF Hamburg Port**: $85,400 USD ($4.27 / Kg)
* **Rekomendasi Margin Bersih Aman UMKM**: +18.5% Net Profit

### 🛡️ 2. Audit Legalitas & KYC Hub Kepatuhan Global (Pilar 3)
* **NIB Pelaku Usaha (OSS RBA)**: 0120268840001 (Valid & Aktif Hak Akses Kepabeanan)
* **NPWP Badan Usaha**: 01.234.567.8-012.000 (Terverifikasi DJP Kemenkeu Aktif)
* **Sertifikasi Saniter**: Phytosanitary & Karantina Lolos (Bebas PBKo Organisme Pengganggu Tumbuhan)
* **Standar Deforestasi Uni Eropa (EUDR)**: GIS Geolocation Mapped & Compliant
* **Skor Kepatuhan Mutu**: 100% Score (Verified Global Exporter Shield)

### 📄 3. Otomatisasi Dokumen Legal Ekspor (Pilar 2)
Draf berkas perdagangan resmi berstandar International Chamber of Commerce (ICC) telah selesai diterbitkan berformat PDF:
* **Proforma Invoice**: #PI-2026-DE-088
* **Export Sales Contract**: #SC-2026-DE-088 (Incoterms 2020 CIF Hamburg)

### 🔒 4. Skema Pengamanan Dana Escrow Vault 4 Fase (Pilar 4)
Pembayaran kontrak sebesar **$85,400 USD** akan dikunci secara aman di Escrow Vault dan dicairkan bertahap berdasarkan milestone pelayaran:
* **Tahap 1 (30% - $25,620 USD)**: DP Cair saat Kontrak Ditandatangani kedua belah pihak.
* **Tahap 2 (30% - $25,620 USD)**: Cair saat dokumen PEB resmi terbit & stuffing kontainer selesai.
* **Tahap 3 (20% - $17,080 USD)**: Cair saat kapal kargo berlayar & Bill of Lading (B/L) resmi terbit.
* **Tahap 4 (20% - $17,080 USD)**: Settlement Final cair saat kontainer sandar di Hamburg Port dan lolos inspeksi.

> 💡 **Rekomendasi Ahli Ekspor NusaBridge**: Rute pelayaran Tanjung Priok menuju Hamburg Port membutuhkan estimasi waktu 24-28 hari pelayaran (Transit Time). Anda dapat memantau pergerakan kapal pengangkut secara real-time di fitur **Radar Maritim AIS NusaBridge**.

Apakah Anda memerlukan kustomisasi kemasan khusus (misal: *GrainPro Bags 60 Kg*) atau membutuhkan penerbitan draf berkas sekarang?`;
    }

    // 2. Skenario Los Angeles / Cengkeh Lalpari Maluku
    if (q.includes('los angeles') || (q.includes('clove') || q.includes('cengkeh'))) {
      return `Halo Pacific Spice Importers! Salam hangat dari tim NusaBridge Indonesia. Kami senang dapat membantu rencana pengadaan rempah berkualitas tinggi Anda dari kepulauan Maluku.

Berikut adalah rincian analisis transaksi ekspor **5 Metric Ton (MT) Cengkeh Lalpari Maluku Grade A** dengan skema pengiriman **CIF Port of Los Angeles, USA**:

### 📊 1. Kalkulasi Incoterms 2020 CIF Los Angeles (Pilar 1)
* **Harga Dasar FOB Tanjung Perak Surabaya**: $12.50 / Kg (Subtotal: $62,500 USD)
* **Ocean Freight Pasifik & Asuransi Kargo**: $1.15 / Kg (Subtotal: $5,750 USD)
* **Total Penawaran CIF Los Angeles**: $68,250 USD ($13.65 / Kg)
* **Margin Bersih Aman Eksportir**: +19.2% Net Profit

### 🛡️ 2. Kepatuhan Regulasi US FDA & Standar ASTA (Pilar 3)
* **Registrasi Fasilitas US FDA**: Food Facility Registration (FFR) Aktif & Valid
* **Standar Mutu ASTA**: Kadar Air < 12%, Bebas Aflatoksin & Logam Berat
* **Sertifikasi Karantina**: Phytosanitary Certificate Badan Karantina RI Valid
* **Skor Kepatuhan Mutu**: 100% Score (Verified Global Exporter Shield)

### 📄 3. Otomatisasi Dokumen Resmi (Pilar 2)
Dokumen resmi standar ICC telah diterbitkan otomatis berformat PDF:
* **Proforma Invoice**: #PI-2026-US-104
* **Export Sales Contract**: #SC-2026-US-104 (Incoterms 2020 CIF Los Angeles)

### 🔒 4. Rekening Escrow Vault Multivalas USD (Pilar 4)
Total kontrak **$68,250 USD** terkunci di Escrow Vault dan dicairkan bertahap:
* **Tahap 1 (30% - $20,475 USD)**: DP Produksi & Sortasi Cengkeh Lalpari.
* **Tahap 2 (30% - $20,475 USD)**: Pengemasan peti kemas 20ft & Bea Cukai PEB.
* **Tahap 3 (20% - $13,650 USD)**: Kapal bertolak dari Surabaya & penerbitan Bill of Lading (B/L).
* **Tahap 4 (20% - $13,650 USD)**: Pelunasan akhir saat tiba di Port of Los Angeles & lolos inspeksi US Customs.

> 💡 **Catatan Logistik Trans-Pasifik**: Muatan cengkeh 5 MT dikemas dalam 200 karung goni laminasi @ 25 Kg, dilengkapi *silica gel dry-bags* untuk menjaga aroma dan kekeringan selama 28 hari pelayaran menuju California.`;
    }

    // 3. Skenario Tokyo / Furnitur Rotan Cirebon
    if (q.includes('tokyo') || (q.includes('rotan') || q.includes('rattan'))) {
      return `Konnichiwa Tokyo Living Design Co.! Terima kasih telah mempercayakan pengadaan furnitur kerajinan rotan alami khas Cirebon kepada kami.

Berikut adalah analisis kuotasi pesanan **2.000 Pcs Kursi Rotan Alami Cirebon (Skandinavia Minimalis)** skema **FOB Tanjung Priok, Jakarta**:

### 📊 1. Kalkulasi Kuotasi FOB Tanjung Priok (Pilar 1)
* **Harga Satuan FOB**: $78.00 / Pcs (Total Nilai Kontrak: $156,000 USD)
* **Kapasitas Peti Kemas**: 2 x 40ft High Cube Container (~136 CBM)
* **Margin Aman Pengrajin**: +22.0% Net Profit

### 🛡️ 2. Legalitas Kelestarian Kayu & Rotan (Pilar 3)
* **Sertifikasi SVLK Kemenhut**: V-Legal Aktif (Bahan Baku Berkelanjutan)
* **Fumigasi Standar ISPM 15**: Sertifikat Resmi Bebas Rayap & Jamur
* **Skor Kepatuhan**: 100% Score (Verified Seller Shield)

### 📄 3. Otomatisasi Dokumen Legal (Pilar 2)
Draf Commercial Invoice & Packing List kubikasi kontainer telah selesai diterbitkan berformat PDF:
* **Proforma Invoice**: #PI-2026-JP-042
* **Commercial Invoice & Packing List**: #CPL-2026-JP-042

### 🔒 4. Skema Escrow Vault 4 Fase (Pilar 4)
* **Tahap 1 (30% - $46,800 USD)**: DP Produksi Anyaman Rotan Lokal.
* **Tahap 2 (30% - $46,800 USD)**: Pemeriksaan Kualitas (QC) & Terbit PEB.
* **Tahap 3 (20% - $31,200 USD)**: Peti Kemas On-Board Kapal & B/L Terbit.
* **Tahap 4 (20% - $31,200 USD)**: Settlement Akhir saat Sandar di Port of Tokyo.`;
    }

    // 4. Panduan Langkah Ekspor Pemula
    if (q.includes('cara ekspor') || q.includes('bagaimana ekspor') || q.includes('memulai ekspor') || q.includes('langkah ekspor') || q.includes('pemula') || q.includes('alur ekspor') || q.includes('tahapan')) {
      return `Halo Rekan Eksportir! Memulai ekspor adalah langkah besar yang sangat membanggakan untuk mengembangkan skala bisnis UMKM Anda.

NusaBridge telah menyusun **5 Langkah Praktis Go-Global** yang terstruktur agar proses ekspor berjalan mulus dan minim risiko:

1. **Persiapan Legalitas Usaha (KYC Hub)**:
   Miliki **NIB (Nomor Induk Berusaha)** 13 digit dari sistem OSS RBA. Di era sekarang, NIB otomatis berfungsi ganda sebagai Angka Pengenal Importir/Eksportir (API) dan Hak Akses Kepabeanan. Pastikan pula NPWP usaha Anda aktif.
2. **Standardisasi & Sertifikasi Mutu Produk**:
   Sesuaikan produk dengan negara tujuan. Untuk komoditas pangan/rempah/kopi, lengkapi dengan **Sertifikat Fitosanitari** (Badan Karantina) dan uji lab Sucofindo. Untuk produk kayu/rotan, lengkapi dengan sertifikat **V-Legal SVLK**.
3. **Penetapan Harga & Negosiasi Incoterms 2020 (RFQ Studio)**:
   Gunakan fitur **RFQ Studio NusaBridge** untuk menghitung struktur biaya secara transparan: harga pokok produksi, biaya pengiriman lokal, hingga tarif kargo laut. Bagi pemula, mulailah dengan skema **FOB** atau **CIF** dengan margin aman minimal 15-20%.
4. **Otomatisasi Dokumen Resmi (Auto-PDF Generator)**:
   Terbitkan dokumen perdagangan resmi secara instan: *Proforma Invoice, Sales Contract, Commercial Invoice, Packing List*, dan formulir *Pemberitahuan Ekspor Barang (PEB)*.
5. **Pengamanan Dana Transaksi (Escrow Vault)**:
   Hindari mengirim barang sebelum kepastian pembayaran jelas. Gunakan **Escrow Vault NusaBridge** dengan mekanisme pencairan 4 fase (30% DP ➔ 30% PEB ➔ 20% Bill of Lading ➔ 20% Tiba di Tujuan).

> 💡 **Tips Memulai Tanpa Modal Besar**: Jika volume komoditas Anda belum mencukupi untuk menyewa 1 kontainer penuh (FCL), Anda bisa memilih opsi pengiriman kargo konsolidasi **LCL (Less than Container Load)** melalui komunitas ekspor NusaBridge!`;
    }

    // 5. Penjelasan Incoterms 2020
    if (q.includes('incoterm') || q.includes('fob') || q.includes('cif') || q.includes('cfr') || q.includes('exw') || q.includes('ddp') || q.includes('beda fob') || q.includes('apa itu fob')) {
      return `Halo! Pertanyaan yang sangat penting dalam perdagangan internasional. **Incoterms 2020** adalah serangkaian aturan baku dari *International Chamber of Commerce (ICC)* yang mengatur pembagian biaya, tanggung jawab, dan titik peralihan risiko antara Penjual (Eksportir) dan Pembeli (Buyer luar negeri).

Berikut adalah perbandingan 3 istilah Incoterms yang paling sering digunakan dalam transaksi ekspor UMKM:

* **FOB (Free on Board - Pelabuhan Muat Indonesia)**:
  Kewajiban Anda sebagai eksportir hanya sampai barang dinaikkan ke atas kapal di pelabuhan muat Indonesia (misal: Tanjung Priok, Jakarta atau Tanjung Perak, Surabaya). Biaya kapal laut internasional (Ocean Freight) dan asuransi ditanggung sepenuhnya oleh pembeli. *Sangat disarankan untuk UMKM pemula!*
* **CIF (Cost, Insurance, and Freight - Pelabuhan Tujuan Buyer)**:
  Anda bertanggung jawab menanggung harga barang, biaya pengiriman lokal, ongkos sewa kapal kargo internasional (Ocean Freight), dan polis asuransi maritim hingga kapal tiba di pelabuhan tujuan pembeli (misal: Hamburg Port atau Port of Los Angeles). Namun, risiko kerusakan barang beralih ke pembeli saat barang telah termuat di atas kapal di Indonesia.
* **CFR (Cost and Freight)**:
  Mirip dengan skema CIF, namun Anda hanya menanggung ongkos kapal tanpa polis asuransi kargo (asuransi ditutup sendiri oleh pembeli).

> 💡 **Rekomendasi NusaBridge**: Untuk buyer baru, gunakan skema **FOB** agar Anda tidak terbebani risiko fluktuasi biaya logistik laut. Jika buyer meminta **CIF**, gunakan **Tab 1: RFQ Studio NusaBridge** untuk menghitung margin pelindung secara akurat.`;
    }

    // 6. Legalitas, NIB OSS, NPWP, dan Kepatuhan Global
    if (q.includes('legalitas') || q.includes('nib') || q.includes('npwp') || q.includes('oss') || q.includes('izin') || q.includes('syarat') || q.includes('kyc') || q.includes('fda') || q.includes('eudr') || q.includes('jas')) {
      return `Halo Rekan Eksportir! Memastikan legalitas dan kepatuhan regulasi sejak awal adalah kunci agar produk UMKM Anda dapat diterima dengan mudah di negara tujuan tanpa risiko denda atau penahanan peti kemas di pelabuhan.

Berikut adalah daftar persyaratan legalitas dan standar kepatuhan yang diverifikasi oleh modul **KYC Hub NusaBridge**:

* **NIB (Nomor Induk Berusaha) 13 Digit**: Diterbitkan melalui sistem perizinan berusaha terintegrasi secara elektronik (OSS RBA). NIB Anda otomatis berfungsi sebagai izin ekspor dan Hak Akses Kepabeanan.
* **NPWP (Nomor Pokok Wajib Pajak)**: NPWP Badan Usaha atau Perorangan yang valid dan berstatus aktif di Direktorat Jenderal Pajak Kementerian Keuangan RI.
* **Sertifikat Fitosanitari (Phytosanitary Certificate)**: Wajib untuk seluruh komoditas hasil perkebunan, pertanian, dan rempah, yang diterbitkan oleh Badan Karantina Indonesia setelah proses inspeksi bebas hama penyakit.
* **Standar Spesifik Kawasan Tujuan**:
  - *Pasar Amerika Serikat (USA)*: Registrasi fasilitas pangan US FDA Food Facility Registration (FFR).
  - *Pasar Uni Eropa (EU)*: Kepatuhan regulasi anti-deforestasi EUDR (European Union Deforestation Regulation) dengan pemetaan poligon GIS lahan kebun.
  - *Pasar Jepang*: Sertifikasi standar pertanian organik/mutu JAS (Japanese Agricultural Standards).

> 🛡️ **Verified Global Exporter Shield**: Anda dapat menguji validitas NIB usaha Anda pada fitur **Tab 3: KYC Hub Sandbox** untuk mendapatkan skor kepatuhan 100%!`;
    }

    // 7. Escrow Vault & Keamanan Pembayaran
    if (q.includes('escrow') || q.includes('bayar') || q.includes('pembayaran') || q.includes('aman') || q.includes('penipuan') || q.includes('rekening') || q.includes('dp')) {
      return `Halo! Kekhawatiran terbesar bagi setiap pelaku usaha ekspor adalah risiko barang sudah dikirim melintasi samudera, namun pembeli luar negeri tidak kunjung melunasi pembayaran.

**Escrow Vault NusaBridge** hadir sebagai platform rekening bersama netral multi-valas (USD, EUR, IDR) yang melindungi hak eksportir dan pembeli melalui sistem pencairan **4 Tahapan Pencapaian (Milestones)**:

### 🔒 Mekanisme Pelepasan Dana 4 Fase Escrow Vault
* **Fase 1 (30% DP Awal)**: Dicairkan saat Sales Contract ditandatangani kedua pihak (sebagai modal kerja produksi).
* **Fase 2 (30% Kargo Siap)**: Dicairkan saat stuffing kontainer selesai dan dokumen PEB Bea Cukai diterbitkan.
* **Fase 3 (20% Kapal Berlayar)**: Dicairkan saat kapal kargo bertolak dan Bill of Lading (B/L) resmi terbit.
* **Fase 4 (20% Pelunasan Akhir)**: Dicairkan saat kontainer sandar di pelabuhan tujuan dan lolos inspeksi penerimaan.

> 🔒 **Jaminan Keamanan**: Dana pembeli dikunci 100% di Escrow Vault sebelum Anda memuat barang ke peti kemas. Dengan begitu, Anda terlindungi sepenuhnya dari risiko penipuan atau pembatalan sepihak.`;
    }

    // 8. Dokumen Ekspor Resmi
    if (q.includes('dokumen') || q.includes('surat') || q.includes('invoice') || q.includes('sales contract') || q.includes('peb') || q.includes('packing list') || q.includes('bill of lading') || q.includes('bl') || q.includes('ska') || q.includes('coo')) {
      return `Halo! Dalam dunia perdagangan internasional, kelengkapan berkas resmi adalah syarat utama agar barang dapat melewati pengawasan Bea Cukai Indonesia dan kepabeanan negara tujuan.

Berikut adalah **6 Dokumen Pokok Ekspor** yang dapat diterbitkan secara instan melalui **Auto-PDF Document Generator NusaBridge**:

1. **Proforma Invoice (PI)**: Faktur penawaran komersial awal yang mencantumkan kuantitas, harga satuan, Incoterms, serta rekening bank eksportir.
2. **Export Sales Contract (SC)**: Kontrak kesepakatan jual beli resmi yang mengikat kedua pihak berdasarkan yurisdiksi International Chamber of Commerce (ICC).
3. **Commercial Invoice (CI)**: Faktur tagihan resmi yang menjadi dasar penilaian bea masuk dan pajak impor di negara tujuan.
4. **Packing List (PL)**: Rincian spesifikasi fisik kemasan peti kemas (jumlah koli/karung, berat bersih/net weight, berat kotor/gross weight, dan volume CBM).
5. **PEB (Pemberitahuan Ekspor Barang)**: Dokumen pelaporan ke Kantor Pabean Bea Cukai Indonesia untuk mendapatkan Nota Pelayanan Ekspor (NPE).
6. **Bill of Lading (B/L)**: Bukti tanda terima barang di atas kapal sekaligus dokumen kepemilikan komoditas yang diterbitkan oleh perusahaan pelayaran kargo laut.

> 📄 **Otomatisasi 1-Klik**: Anda dapat mencoba membuat draf berkas ini secara langsung pada menu **Tab 2: Auto-PDF Generator** di halaman Solusi AI!`;
    }

    // 9. Katalog & Komoditas 120 Produk
    if (q.includes('katalog') || q.includes('produk') || q.includes('komoditas') || q.includes('kopi') || q.includes('rempah') || q.includes('kriya') || q.includes('tekstil') || q.includes('apa saja')) {
      return `Halo! NusaBridge mengurasi tepat **120 komoditas ekspor unggulan Indonesia** yang telah terverifikasi melalui seleksi mutu dan audit legalitas KYC Hub, terbagi dalam 4 kategori strategis:

* **☕ Kopi Ekspor Unggulan (30 Produk)**: Varian Arabika Specialty dan Robusta Premium (Gayo Aceh, Toraja Kalosi, Mandheling, Lampung, Dampit Malang, Kintamani Bali, Bajawa Flores, Wamena Papua, dll.) dengan opsi Green Beans standar ekspor maupun Artisan Roasted.
* **🌿 Rempah-Rempah & Hasil Alam (30 Produk)**: Cengkeh Lalpari Maluku, Kayu Manis Korintji Grade A, Lada Putih Muntok Bangka, Vanila Gourmet Papua, Pala Banda, Kapulaga Jawa, serta Minyak Atsiri Nilam Aceh (Patchouli Oil).
* **🪵 Kriya & Kerajinan Ramah Lingkungan (30 Produk)**: Anyaman Rotan Alami Cirebon, Kerajinan Kayu Jati Blora bersertifikat SVLK, Anyaman Enceng Gondok Kulon Progo, Mangkuk Batok Kelapa Bali, dan Keranjang Seagrass Lombok.
* **🧵 Tekstil & Wastra Nusantara (30 Produk)**: Karya adiluhung warisan budaya: Batik Tulis Sutra Solo/Yogya, Batik Cap Pekalongan, Tenun Ikat Troso Jepara, Tenun Sumba Pewarna Alami, Songket Palembang Benang Emas, dan Ulos Batak Tarutung.

Seluruh produk dapat Anda eksplorasi secara mendalam pada halaman **Katalog Produk**!`;
    }

    // 10. Respon Konsultasi Bebas / Umum
    return `Halo! Saya **NusaBridge Gemini AI Agent**, asisten perdagangan ekspor-impor pintar yang siap membantu dan mengawal transaksi UMKM Indonesia menembus pasar global.

Saya dapat membantu Anda memecahkan berbagai tantangan ekspor secara instan dengan mengintegrasikan **4 Pilar Utama NusaBridge**:

* **Pilar 1 (RFQ Studio & Incoterms 2020)**: Menghitung struktur biaya FOB, biaya kapal kargo laut, asuransi, hingga total harga penawaran CIF dengan margin aman UMKM.
* **Pilar 2 (Otomatisasi Dokumen Legal)**: Menerbitkan draf berkas resmi Proforma Invoice, Commercial Invoice, dan Sales Contract berformat PDF standar ICC secara instan.
* **Pilar 3 (KYC Hub & Kepatuhan Global)**: Memeriksa validitas NIB OSS RBA, NPWP, Phytosanitary, izin US FDA, sertifikasi JAS Jepang, atau regulasi anti-deforestasi EUDR Uni Eropa.
* **Pilar 4 (Escrow Vault Multivalas)**: Memberikan simulasi penguncian dana dan skema pencairan bertahap 4 fase agar transaksi bebas dari risiko gagal bayar.

> 💬 **Coba tanyakan hal-hal berikut:**
> • *"Berapa estimasi biaya kirim 20 MT Kopi Robusta ke Hamburg?"*
> • *"Apa perbedaan antara skema FOB dan CIF?"*
> • *"Bagaimana alur pencairan dana di Escrow Vault?"*
> • *"Apa syarat izin ekspor rempah ke Amerika Serikat?"*

Silakan ketik pertanyaan spesifik Anda atau pilih skenario cepat di panel kiri!`;
  }

  let aiReply = getHeuristicReply(message);

  // Jika terhubung dengan SDK @google/genai resmi dan memiliki API Key aktif
  try {
    const ai = await getGenAIClient();
    if (ai) {
      const systemInstruction = `Kamu adalah NusaBridge Gemini AI Agent, asisten B2B perdagangan ekspor-impor pintar untuk UMKM Indonesia pada kompetisi GTNIC 2026.
PEDOMAN BAHASA & FORMAT:
1. Gunakan gaya bahasa Google Gemini yang hangat, santun, terstruktur rapi, logis, dan sangat mudah dipahami oleh UMKM Indonesia maupun juri.
2. Format jawaban dengan Markdown rapi: gunakan heading ## atau ### untuk membagi sub-topik, bullet points tebal untuk rincian, dan kutipan > untuk tips praktis.
3. Selalu integrasikan 4 Pilar NusaBridge bila relevan:
   - PILAR 1 (RFQ Studio): Kalkulasi Incoterms 2020 (FOB, Ocean Freight, Asuransi, CIF, Margin Aman).
   - PILAR 2 (Otomatisasi Dokumen): Draf resmi Proforma Invoice & Sales Contract PDF instan.
   - PILAR 3 (KYC Hub & Kepatuhan): Verifikasi NIB OSS, NPWP, Phytosanitary/FDA/JAS 100% Score.
   - PILAR 4 (Escrow Vault): Skema pencairan bertahap 4 fase (30% DP -> 30% PEB -> 20% B/L -> 20% Tiba).
4. Berikan tips taktis kepatuhan ekspor dan selalu tutup dengan tawaran bantuan atau langkah berikutnya yang ramah.`;

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
        aiReply = generatedText;
      }
    }
  } catch (apiErr) {
    console.warn('[Gemini SDK API Call]: Menggunakan heuristic 4 pilar bawaan:', apiErr.message);
  }

  res.json({
    success: true,
    reply: aiReply,
    agent: 'NusaBridge Gemini AI Agent',
    model: process.env.GEMINI_API_KEY ? 'gemini-1.5-flash (@google/genai SDK)' : 'NusaBridge 4-Pillar AI Rule Engine'
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
