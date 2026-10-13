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
├── assets/                       # Aset gambar, ikon, dan ilustrasi (Format WebP & SVG)
│   ├── icons/                    # Kumpulan ikon fitur dan alur kerja ekspor
│   ├── favicon-192.png           # Favicon untuk PWA / mobile browser
│   ├── favicon-512.png           # High-res app icon
│   ├── logo.webp                 # Logo utama NusaBridge
│   ├── logo-transparent.webp     # Logo transparan untuk header
│   ├── og-preview.png            # Gambar preview Open Graph untuk medsos (1200x630)
│   ├── og-preview.webp           # Versi WebP OG Preview
│   ├── visual-1.webp             # Artwork utama hero section
│   └── wave-top.svg              # Divider gelombang SVG
├── favicon.ico                   # Root favicon untuk browser
├── index.html                    # Halaman utama landing page & semantic SEO
├── script.js                     # Logika interaktivitas, alur demo, & kamus bahasa (ID/EN)
├── styles.css                    # Design system, styling vanilla CSS, & media queries
└── README.md                     # Dokumentasi proyek
```

---

## 🚀 Cara Menjalankan Secara Lokal

Website ini dibangun menggunakan teknologi **Vanilla Web** murni (HTML5, CSS3, JS), sehingga tidak memerlukan instalasi dependensi rumit seperti Node.js atau bundler.

### 1. Clone Repositori
```bash
git clone https://github.com/smartonesda/nusa-bridge.git
cd nusa-bridge
```

### 2. Jalankan Local Server

Anda dapat menjalankan local server dengan salah satu cara berikut:

- **Menggunakan Python (Rekomendasi)**:
  ```bash
  python -m http.server 3000
  ```
  Lalu buka browser di: [http://localhost:3000](http://localhost:3000)

- **Menggunakan VS Code Live Server**:
  Klik kanan pada file `index.html` lalu pilih **"Open with Live Server"**.

- **Menggunakan Node.js `serve`**:
  ```bash
  npx serve .
  ```

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
