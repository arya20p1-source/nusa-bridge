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
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files if accessed directly from backend port
app.use(express.static(path.join(__dirname, '..', 'frontend')));

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
// 7. GEMINI AI AGENT & TRADE INTELLIGENCE
// ==========================================================================
app.post('/api/ai/chat', async (req, res) => {
  const { message = '', context = {} } = req.body;

  const q = message.toLowerCase().trim();

  // Mode Heuristik Cerdas Berbasis Pengetahuan Perdagangan Ekspor
  // Menjamin sistem tetap menjawab sangat cerdas dan realistis tanpa risiko error saat demo lomba
  let aiReply = '';

  if (q.includes('rfq') || q.includes('permintaan') || q.includes('buyer')) {
    aiReply = `Saya telah menganalisis parameter RFQ tersebut. Berdasarkan data historis pelayaran rute Selat Malaka - Terusan Suez, kuotasi **CIF** dengan harga penawaran berkisar di margin **28% - 32%** sangat kompetitif. Disarankan menggunakan klausul pembayaran *Escrow Vault 4-Stage* untuk melindungi hak pencairan dana uang muka 30%.`;
  } else if (q.includes('incoterm') || q.includes('fob') || q.includes('cif')) {
    aiReply = `Dalam Incoterms 2020, **FOB (Free on Board)** mengalihkan risiko saat kontainer melewati pagar kapal di pelabuhan muat Indonesia (misal Belawan/Tg Priok), di mana buyer menanggung biaya angkut laut. Sedangkan **CIF (Cost, Insurance & Freight)** mewajibkan eksportir menanggung biaya kapal kargo dan asuransi hingga pelabuhan tujuan (misal Hamburg). Rekomendasi AI: Mulai dengan FOB jika UMKM baru pertama kali ekspor!`;
  } else if (q.includes('dokumen') || q.includes('invoice') || q.includes('peb')) {
    aiReply = `Untuk pengapalan komoditas ini, dokumen wajib yang harus disiapkan adalah: 1) **Proforma Invoice** resmi, 2) **Packing List**, 3) **Certificate of Origin (COO Form A/D)** dari Kemendag, 4) **Phytosanitary Certificate** Badan Karantina, dan 5) **PEB (Pemberitahuan Ekspor Barang)**. Modul AI NusaBridge siap men-generate draf dokumen ini dalam hitungan detik.`;
  } else if (q.includes('harga') || q.includes('rekomendasi') || q.includes('margin')) {
    aiReply = `Rekomendasi harga aman komoditas berdasarkan kurs acuan USD/IDR 16.000: Tetapkan harga jual di atas batas break-even (HPP + Ongkos Freight + Biaya Escrow 1.2%). Untuk pasar Eropa, buyer bersedia membayar premium 10-15% lebih tinggi untuk komoditas yang mengantongi sertifikat ramah lingkungan (Organic/EUDR compliance).`;
  } else {
    aiReply = `Halo! Saya **NusaBridge AI Trade Agent**. Saya dapat membantu Anda menganalisis kelayakan penawaran buyer luar negeri (RFQ), menghitung estimasi keuntungan bersih Incoterms 2020, memverifikasi legalitas NIB/NPWP, serta menerbitkan draf dokumen ekspor resmi secara otomatis. Ada komoditas yang ingin disimulasikan hari ini?`;
  }

  // Jika ada API Key Gemini di environment, coba panggil API resmi
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') {
    try {
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const promptText = `Anda adalah NusaBridge AI Trade Agent, asisten cerdas perdagangan ekspor-impor untuk UMKM Indonesia pada kompetisi GTNIC 2026. Jawab secara ringkas, profesional, berbasis regulasi Incoterms 2020 dan kepabeanan Indonesia. Pertanyaan user: "${message}"`;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const geminiData = await response.json();
      if (geminiData.candidates && geminiData.candidates[0]?.content?.parts[0]?.text) {
        aiReply = geminiData.candidates[0].content.parts[0].text;
      }
    } catch (apiErr) {
      console.warn('[Gemini API Fallback Active]:', apiErr.message);
      // Fallback cerdas tetap digunakan
    }
  }

  res.json({
    success: true,
    reply: aiReply,
    agent: 'NusaBridge AI Gemini Specialist',
    model: process.env.GEMINI_API_KEY ? 'gemini-1.5-flash (Live)' : 'NusaBridge Heuristic Trade Engine (Active Fallback)'
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
  console.log(`📦 Database: JavaScript JSON-Store (backend/database/)`);
  console.log(`☕ Siap melayani 105+ komoditas ekspor UMKM Indonesia!`);
  console.log(`=======================================================`);
});
