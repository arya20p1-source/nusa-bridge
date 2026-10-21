# 🌐 NusaBridge

> **Platform Intermediasi Ekspor-Impor UMKM Indonesia Berbasis AI Agent**  
> *Membantu produk lokal menembus pasar global dengan mudah, aman, dan efisien.*

[![Website](https://img.shields.io/badge/Live%20Demo-nusa--bridge--rpl.vercel.app-1b68f8?style=for-the-badge&logo=vercel)](https://nusa-bridge-rpl.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebP Optimized](https://img.shields.io/badge/Assets-WebP%20Optimized-00c853?style=for-the-badge)](https://developers.google.com/speed/webp)

---

## 📌 Tentang NusaBridge

**NusaBridge** adalah platform inovasi digital yang dirancang untuk mengatasi berbagai hambatan regulasi, legalitas, serta rantai pasok yang selama ini dihadapi oleh pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia saat ingin melakukan ekspor ke luar negeri.

Dengan mengintegrasikan teknologi **AI Agent**, NusaBridge secara otomatis memfasilitasi:
1. **Verifikasi Legalitas Cepat**: Pengecekan otomatis Nomor Induk Berusaha (NIB), NPWP, serta kepatuhan standar ekspor negara tujuan.
2. **Otomasi Dokumen Perdagangan**: Pembuatan dokumen ekspor resmi (Invoice Ekspor, Packing List, COO/SKA, PEB) dalam hitungan menit tanpa ribet.
3. **Kalkulator Tarif & Bea Cukai**: Simulasi estimasi biaya pengiriman, asuransi, dan tarif bea masuk secara akurat dan transparan.
4. **Pelacakan Logistik Terpadu**: Monitoring kargo internasional secara *real-time* dari pelabuhan asal hingga diterima pembeli di luar negeri.

---

## ✨ Fitur Utama

- 🇮🇩 / 🇬🇧 **Dukungan Multi-Bahasa (Bilingual)**: Dilengkapi dengan *interactive language switcher* (Bahasa Indonesia & English) yang langsung menerjemahkan seluruh konten halaman secara instan tanpa reload halaman (*client-side dictionary*).
- 🤖 **Simulasi Interaktif AI Agent**: Pengunjung dapat mencoba alur verifikasi dokumen dan demo analisis pasar global secara langsung melalui modal interaktif.
- 🎨 **Desain Modern & Responsif**: Tampilan visual bertema cat air Nusantara kontemporer dengan tipografi *Plus Jakarta Sans* & *Caveat*, *glassmorphism*, efek gelombang halus (*waves*), serta animasi mikro (*micro-interactions*).
- 📱 **Mobile-First & Cross-Browser**: Tata letak responsif sempurna di perangkat desktop, laptop, tablet, hingga smartphone berbagai ukuran layar.
- ⚡ **Performa Super Cepat (WebP Optimized)**: Semua aset grafis dikompresi ke format generasi terbaru `.webp`, memangkas ukuran total halaman sebesar **88.1%** agar waktu muat (*page load*) sangat instan.
- 🔍 **SEO & Social Media Preview Lengkap**: Mendukung Open Graph (OG), Twitter Cards, Canonical URL, Favicons, serta Schema.org JSON-LD *Structured Data*.

---

## 🗂️ Struktur Direktori

```text
nusa-bridge/
├── public/                       # File statis yang disajikan apa adanya
│   ├── assets/                   # Gambar, ikon, dan ilustrasi (WebP & SVG)
│   │   ├── icons/                # Ikon fitur dan alur kerja ekspor
│   │   ├── products/             # Foto produk katalog
│   │   └── slices/               # Potongan ilustrasi landing page
│   └── favicon.ico
├── src/                          # Kode aplikasi (layout ala React)
│   ├── pages/                    # Entry HTML per halaman
│   │   ├── index.html            # Landing page & semantic SEO
│   │   ├── produk.html           # Katalog & RFQ
│   │   ├── solusi.html           # Studio AI & dokumen ekspor
│   │   └── harga.html            # Paket, kalkulator, FAQ
│   ├── scripts/                  # Logika per halaman + modul bersama
│   │   ├── app.js                # Navigasi, i18n ID/EN, modal, sesi, chat AI
│   │   ├── produk.js
│   │   ├── solusi.js
│   │   ├── harga.js
│   │   └── radar.js              # Widget radar kapal kargo
│   ├── styles/                   # Design system + CSS per halaman
│   │   ├── styles.css
│   │   ├── produk.css
│   │   ├── solusi.css
│   │   ├── harga.css
│   │   └── radar.css
│   └── data/
│       └── products.js           # Dataset 120 produk untuk katalog
├── server/                       # Express API + static server
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── database/                     # JSON-store (db.js + data contoh)
├── gemini.js                     # Skrip uji koneksi Google Gemini
├── vercel.json                   # Rewrites deploy statis Vercel
├── .env.example                  # Template environment
└── package.json
```

Pemetaan URL: `src/pages/*.html` disajikan di root (`/`, `/produk.html`, `/solusi.html`, `/harga.html`), `src/styles` di `/styles`, `src/scripts` di `/scripts`, `src/data` di `/data`, dan `public/assets` di `/assets`.

---

## 🚀 Cara Menjalankan Secara Lokal

Frontend tetap **Vanilla Web** (HTML5, CSS3, JS) tanpa bundler, tetapi kini memakai struktur folder ala React (`src/pages`, `src/scripts`, `src/styles`, `src/data`, `public`). Backend Express menyajikan halaman sekaligus API, jadi jalankan lewat Node.js agar path `/styles`, `/scripts`, `/data`, dan `/assets` ter-resolve.

### 1. Clone Repositori
```bash
git clone https://github.com/smartonesda/nusa-bridge.git
cd nusa-bridge
```

### 2. Jalankan Server

```bash
npm install
npm start
```

Buka [http://localhost:5000](http://localhost:5000). Cek API di [http://localhost:5000/api/health](http://localhost:5000/api/health).

> Catatan: `python -m http.server` atau Live Server saja tidak cukup karena halaman memakai path absolut (`/styles`, `/scripts`, `/data`, `/assets`) yang dilayani oleh Express.

---

## 🌐 Panduan Deployment ke Vercel

Proyek ini telah dikonfigurasi agar dapat langsung di-*deploy* ke [Vercel](https://vercel.com) secara instan:

1. Pastikan seluruh perubahan kode telah di-*push* ke repositori GitHub:
   ```bash
   git add .
   git commit -m "feat: complete seo and webp optimization"
   git push origin master
   ```
2. Buka dashboard [Vercel](https://vercel.com) dan pilih **Add New Project**.
3. Hubungkan repositori GitHub `smartonesda/nusa-bridge`.
4. Pada bagian **Framework Preset**, biarkan pilihan default (**Other**).
5. Klik **Deploy**. Website akan langsung aktif di domain seperti:
   👉 **`https://nusa-bridge-rpl.vercel.app/`**

---

## 🛠️ Teknologi yang Digunakan

| Kategori | Teknologi |
|---|---|
| **Struktur & SEO** | HTML5 Semantik, Schema.org JSON-LD, Open Graph, Twitter Cards |
| **Styling** | Vanilla CSS3, CSS Custom Properties (Variables), Flexbox, CSS Grid |
| **Tipografi** | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans), [Caveat](https://fonts.google.com/specimen/Caveat) |
| **Interaktivitas** | Vanilla JavaScript (ES6+), LocalStorage, DOM Events, Web APIs |
| **Optimalisasi Aset** | WebP Images (~88% compression savings), SVG Vectors |
| **Hosting & CI/CD** | GitHub, Vercel |

---

## 👥 Tim Pengembang

Dibuat dengan dedikasi untuk inovasi digital ekspor UMKM Indonesia:
- **Tim**: Tim Arya
- **Kategori**: Lomba Inovasi Aplikasi / Web Development
- **Organisasi/Sekolah**: SmartOne SDA

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi **MIT**. Bebas digunakan dan dikembangkan untuk kepentingan edukasi dan inovasi UMKM.
