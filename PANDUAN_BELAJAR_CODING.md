# 🎓 MODUL BELAJAR CODING & ARSITEKTUR SISTEM NUSABRIDGE
**Panduan Komprehensif Persiapan Presentasi Lomba GTNIC 2026**

---

## 📑 DAFTAR ISI
1. [Arsitektur Keseluruhan Sistem](#1-arsitektur-keseluruhan-sistem)
2. [Pemisahan Folder & Tanggung Jawab (Separation of Concerns)](#2-pemisahan-folder--tanggung-jawab)
3. [Database Engine Berbasis JavaScript (`database/db.js`)](#3-database-engine-berbasis-javascript)
4. [Backend Node.js & REST API (`backend/server.js`)](#4-backend-nodejs--rest-api)
5. [Frontend & Interaktivitas Cerdas (`frontend/js/`)](#5-frontend--interaktivitas-cerdas)
   - [A. Logika Undian Hoki Diskon (`js/harga.js`)](#a-logika-undian-hoki-diskon)
   - [B. Katalog Produk & Fallback Gambar (`js/produk.js`)](#b-katalog-produk--fallback-gambar)
   - [C. Radar Maritim AIS & Trigonometri (`js/radar.js`)](#c-radar-maritim-ais--trigonometri)
   - [D. AI Agent Gemini & Dual-Mode Fallback (`js/solusi.js` & `server.js`)](#d-ai-agent-gemini--dual-mode-fallback)
6. [Trik Menjawab Pertanyaan Juri GTNIC 2026](#6-trik-menjawab-pertanyaan-juri-gtnic-2026)

---

## 1. ARSITEKTUR KESELURUHAN SISTEM

NusaBridge dirancang menggunakan pola **Modern Decoupled Full-Stack Web Architecture**:

```
+-------------------------------------------------------------+
|                 FRONTEND (Browser Klien)                    |
|   HTML5 Semantik + CSS3 Modern (Grid/Flex) + Vanilla JS     |
|   - index.html   : Landing Page & Live Document Sandbox     |
|   - produk.html  : Katalog 105 Komoditas Ekspor & Filter    |
|   - solusi.html  : AI Agent Gemini (Analisis HS & Regulasi)  |
|   - harga.html   : Undian Diskon, 4 Paket, Direct WA Admin  |
+-------------------------------------------------------------+
                              |
                     Fetch API / REST JSON
                              v
+-------------------------------------------------------------+
|                 BACKEND (Node.js & Express)                 |
|   Folder: backend/server.js (Port: 5000)                    |
|   - Routing REST API (/api/products, /api/auth, /api/ai)    |
|   - Gemini 1.5 Flash AI Engine & Heuristic Fallback         |
|   - Token Auth, Validasi Input, Rate Limiting               |
+-------------------------------------------------------------+
                              |
                    Native File I/O (async/await)
                              v
+-------------------------------------------------------------+
|                 DATABASE FOLDER TERPISAH                    |
|   Folder: database/                                         |
|   - db.js             : JavaScript Database Engine          |
|   - products.json     : 105 Komoditas Ekspor Lengkap        |
|   - users.json        : Akun Terdaftar (Eksportir & Buyer)  |
|   - rfq.json          : Request for Quotation Transaksi     |
|   - transactions.json : Rekam Jejak Escrow Vault            |
+-------------------------------------------------------------+
```

---

## 2. PEMISAHAN FOLDER & TANGGUNG JAWAB

| Folder / File | Fungsi & Peran | Mengapa Dibuat Terpisah? |
|---|---|---|
| `database/` | Tempat penyimpanan data permanen & mesin query JS | **Database tidak boleh terkunci di dalam backend.** Dengan folder terpisah, database bisa diakses oleh worker lain, script migrasi, atau backup tanpa mengganggu kode server. |
| `backend/` | Logika bisnis, server Express, dan integrasi API AI Gemini | Mengurus lalu lintas jaringan, keamanan, pemrosesan data sensitif, dan komunikasi ke Google AI. |
| `frontend/` & Root | Tampilan pengguna (User Interface & User Experience) | Menggunakan HTML, CSS, dan JS murni (Vanilla) agar super cepat di-load, responsif di HP/Laptop, dan ramah SEO. |
| `assets/` | File statis: Logo, icon, sertifikasi, & gambar produk | Menyimpan gambar 36 komoditas ekspor WebP berukuran ringan (di bawah 10KB/gambar). |

---

## 3. DATABASE ENGINE BERBASIS JAVASCRIPT (`database/db.js`)

### Mengapa Menggunakan JS JSON-Store, Bukan MySQL/MongoDB?
1. **Zero External Dependency**: Tidak perlu instalasi MySQL, XAMPP, atau MongoDB di komputer juri. Aplikasi langsung jalan seketika (`plug-and-play`).
2. **100% JavaScript Ecosystem**: Menunjukkan penguasaan mendalam atas konsep Asynchronous I/O di Node.js (`fs/promises`).
3. **Data Human-Readable**: Semua data tersimpan rapi dalam format JSON standar industri.

### Bedah Kode Penting di `database/db.js`:
```javascript
// 1. Membaca data secara asynchronous (non-blocking)
async read(table) {
  const filePath = path.join(DB_DIR, `${table}.json`);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content || '[]');
}

// 2. Menulis data baru ke file JSON
async write(table, data) {
  const filePath = path.join(DB_DIR, `${table}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 3. Query Canggih (Pencarian, Filter Kategori, Sorting, Paginasi)
async queryProducts({ category, search, page, limit, sort }) {
  let items = await this.read('products');
  if (category !== 'all') items = items.filter(p => p.category === category);
  if (search) items = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  // ... Paginasi slice array:
  const offset = (page - 1) * limit;
  return items.slice(offset, offset + limit);
}
```

---

## 4. BACKEND NODE.JS & REST API (`backend/server.js`)

### Cara Menjalankan Backend:
```bash
cd e:\nusa-bridge\backend
node server.js
```
Server akan aktif di: `http://localhost:5000`

### Daftar Endpoint API Utama:
1. `GET /api/health` : Cek status kesehatan server dan database.
2. `GET /api/products` : Mengambil daftar 105 produk (mendukung query parameter `?category=kopi&search=gayo&page=1&limit=12`).
3. `POST /api/auth/register` : Mendaftar akun eksportir baru dan otomatis login.
4. `POST /api/auth/login` : Autentikasi email dan kata sandi.
5. `POST /api/ai/ask` : Konsultasi HS Code, regulasi ekspor, dan kalkulasi tarif ke Gemini AI Agent.

---

## 5. FRONTEND & INTERAKTIVITAS CERDAS

### A. Logika Undian Hoki Diskon (`frontend/js/harga.js`)
Fitur ini mensimulasikan undian diskon hoki perusahaan dari 5% s/d 25%+:
- **Mekanisme Animasi Rolling**: Menggunakan `setInterval()` yang mengubah angka acak setiap 60 milidetik selama 1,8 detik sehingga tampak seperti mesin slot kasino digital.
- **Kalkulasi Pemotongan Harga**:
  $$\text{Diskon} = \text{Harga Dasar} \times \frac{\text{Persentase}}{100}$$
  $$\text{Harga Akhir} = \text{Harga Dasar} - \text{Diskon}$$
- **Persistensi Data**: Menggunakan `localStorage.setItem('nb_lucky_discount', ...)` sehingga ketika pengunjung merefresh halaman, diskonnya tetap tersimpan.
- **Opsi Langganan Panjang (> 1 Tahun)**: Menyediakan Card ke-4 dengan tombol direct WhatsApp Admin (`https://wa.me/...`) untuk negosiasi kontrak multi-tahun khusus koperasi.

### B. Katalog Produk & Fallback Gambar (`frontend/js/produk.js`)
- Mengelola 105 komoditas ekspor Indonesia (Kopi, Rempah, Kriya, Tekstil, Makanan Olahan, Perkebunan).
- **Penanganan Gambar Anti-Error**:
  ```html
  <img src="${prod.image}" onerror="this.onerror=null; this.src='assets/product-1.webp';">
  ```
  Jika ada jalur gambar yang terblokir atau belum diunduh, sistem otomatis beralih ke gambar default tanpa menampilkan icon gambar patah (*broken image*).

### C. Radar Maritim AIS & Trigonometri (`frontend/js/radar.js`)
- Menampilkan peta jalur perkapalan kargo ekspor (Tanjung Priok ke Rotterdam, Shanghai, Los Angeles, Dubai).
- Menggunakan perhitungan sudut arah (Bearing / Heading):
  $$\theta = \text{atan2}(\Delta \text{Lng}, \Delta \text{Lat}) \times \frac{180}{\pi}$$
  Ikon kapal berputar secara realistis menghadap arah pelayaran yang dituju.

### D. AI Agent Gemini & Dual-Mode Fallback (`js/solusi.js` & `server.js`)
NusaBridge mengimplementasikan **Gemini AI Agent** dengan arsitektur **4 Pilar Ekspor Cerdas**:
1. **Pilar 1 (AI Sales Assistant & RFQ Studio)**: Kalkulasi harga Incoterms 2020 (FOB, Ocean Freight, Asuransi maritim, CIF, dan rekomendasi margin aman UMKM).
2. **Pilar 2 (Otomatisasi Dokumen Legal)**: Penerbitan otomatis draf berkas resmi Proforma Invoice & Export Sales Contract PDF.
3. **Pilar 3 (KYC Hub & Kepatuhan Global)**: Audit otomatis legalitas NIB (OSS), NPWP, Phytosanitary, izin US FDA, sertifikasi JAS Jepang, atau EUDR Eropa dengan skor 100%.
4. **Pilar 4 (Escrow Vault Multivalas)**: Skema penguncian dana dan pencairan bertahap 4 fase (30% DP ➔ 30% PEB ➔ 20% Bill of Lading ➔ 20% Tiba di Pelabuhan Tujuan).

**Integrasi Resmi Google GenAI SDK (`@google/genai`)**:
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  httpOptions: { apiVersion: "v1" },
});

async function main() {
  const interaction = await ai.interactions.create({
    model: "gemini-1.5-flash",
    input: "Explain how AI works",
  });
  console.log(interaction.output_text);
}

await main();
```

- **Mode Online**: Terhubung langsung ke Google Generative AI Engine via `@google/genai`.
- **Mode Offline (Heuristic 4-Pillar Fallback)**: Jika komputer juri tidak ada internet atau tanpa API Key, antarmuka chat dan backend tetap memberikan jawaban cerdas dan terstruktur secara instan (termasuk skenario Hamburg Robusta, Los Angeles Cengkeh, Tokyo Rotan, Audit KYC, dan Simulasi Escrow).

---

## 6. TRIK MENJAWAB PERTANYAAN JURI GTNIC 2026

1. **Juri Tanya: "Di mana databasenya disimpan? Kok tidak pakai MySQL?"**
   > *Jawaban Juara*: "Kami merancang NusaBridge dengan arsitektur **Zero-Friction Deployment**. Database kami bangun 100% menggunakan native JavaScript Engine terpisah di folder `database/` (`database/db.js`) yang mengelola file JSON terstruktur dengan prinsip ACID-lightweight dan Asynchronous I/O. Ini membuat sistem sangat portabel, hemat memori server, dan siap dijalankan di perangkat manapun tanpa konfigurasi DBMS rumit."

2. **Juri Tanya: "Bagaimana integrasi AI Gemini bekerja di halaman Solusi AI?"**
   > *Jawaban Juara*: "Halaman Solusi AI kami rancang sebagai **Ruang Percakapan Interaktif (Interactive Conversational AI Room)** yang ditenagai oleh Google GenAI SDK (`@google/genai`). AI Agent kami bertindak sebagai konsultan ekspor 24/7 yang merangkul 4 pilar sekaligus: menghitung RFQ Incoterms 2020, menerbitkan draf kontrak PDF, memvalidasi NIB/kepatuhan global, dan memandu alur pencairan dana bertahap 4 fase di Escrow Vault. Jika koneksi offline saat penjurian, sistem otomatis menggunakan *deterministic rule engine* sehingga demo tidak pernah gagal."

3. **Juri Tanya: "Berapa banyak produk yang dikurasi dalam katalog NusaBridge?"**
   > *Jawaban Juara*: "Terdapat tepat **120 produk komoditas ekspor terkurasi** yang terbagi rata dalam 4 kategori unggulan Indonesia: 30 Kopi Nusantara (Green Beans & Roasted), 30 Rempah-Rempah Kering & Minyak Atsiri, 30 Kriya & Kerajinan Ramah Lingkungan, serta 30 Tekstil & Wastra Tradisional."

4. **Juri Tanya: "Bagaimana model bisnis SaaS dan harga NusaBridge?"**
   > *Jawaban Juara*: "NusaBridge menyediakan 3 paket fleksibel:
   > - **Paket Starter / Sandbox (Rp 0 / Gratis)**: Disediakan khusus untuk pengujian UMKM pemula dan evaluasi dewan juri GTNIC 2026.
   > - **Paket UMKM Eksportir / Professional (Rp 250.000 / Bulan)**: Akses tanpa batas ke RFQ Studio, kalkulator Incoterms, otomatisasi PDF, dan proteksi Escrow Vault.
   > - **Paket Enterprise (Kustom / Hubungi Kami)**: Ditujukan untuk koperasi ekspor besar atau asosiasi dagang dengan integrasi multi-user dan tombol langsung ke WhatsApp Admin."
