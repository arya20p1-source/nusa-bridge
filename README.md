# NusaBridge

NusaBridge adalah platform web untuk membantu UMKM Indonesia mempelajari dan
menyiapkan alur perdagangan ekspor-impor. Katalog produk, RFQ, dokumen,
transportasi, pelacakan, dan beberapa alur operasional menggunakan simulasi;
platform ini bukan penjual, bank, atau otoritas verifikasi resmi.

## Pengguna dan fitur

Website ditujukan untuk eksportir Indonesia, importir, dan pengunjung yang
ingin mengenal proses perdagangan. Fitur utamanya:

- Katalog produk ekspor dan formulir permintaan penawaran (RFQ).
- Perdagangan domestik UMKM: jual-beli antarkota dan antarpulau dalam Rupiah,
  dengan escrow 4 fase dan dokumen domestik (PO, invoice, surat jalan, BAST).
- Chat bantuan website untuk pertanyaan seputar NusaBridge dan ekspor-impor.
- Draf dokumen, pemeriksaan KYC, dan simulasi Escrow.
- Estimasi transportasi multimoda dan pelacakan berbasis data demo.
- Antarmuka bahasa Indonesia dan Inggris.

## Teknologi dan struktur

- **Frontend:** React, React Router, dan Vite.
- **Backend:** Node.js dan Express.
- **Database:** Supabase opsional; backend memakai database memori untuk demo
  jika Supabase belum dikonfigurasi.

```text
.
├── frontend/       # Aplikasi React dan aset website
├── backend/        # API Express, tes, skrip, dan database backend
│   └── database/   # Adaptor database, SQL, dan panduan pemasangan
├── shared/         # Data rujukan yang digunakan frontend dan backend
├── docs/           # Indeks dokumentasi proyek
├── README.md
├── LICENSE
└── .gitignore
```

Folder `backend/database` dipertahankan karena kode backend dan perintah
database menggunakannya secara langsung.

## Menjalankan secara lokal

Gunakan Node.js versi 20 atau lebih baru. Dari root repository:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi konfigurasi yang
dibutuhkan. Untuk demo lokal, backend dapat berjalan tanpa Supabase; perubahan
data di database memori akan hilang saat server dimulai ulang.

Jalankan backend dan frontend di dua terminal:

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

Buka `http://localhost:3000`. Frontend meneruskan permintaan `/api` ke backend
di `http://localhost:5000`.

## Konfigurasi

- `backend/.env.example` memuat templat `PORT`, `AUTH_SECRET`, konfigurasi
  Supabase, dan kunci AI opsional.
- `frontend/.env.example` memuat `VITE_API_URL` untuk deployment frontend dan
  backend yang terpisah.
- Jangan commit file `.env` atau kredensial. `SUPABASE_SERVICE_ROLE_KEY`
  hanya boleh disimpan di lingkungan backend.

## Database dan dokumentasi

Mulai dari [indeks dokumentasi](docs/README.md). Petunjuk setup Supabase,
pilihan SQL migrasi, pembuatan admin, dan pemeriksaan koneksi tersedia di
[panduan database](backend/database/CARA-PASANG.md). Untuk mengaktifkan
perdagangan domestik dan skema ekspor-impor terpadu, jalankan
`backend/database/domestic-trade.sql` setelah schema utama.

**Perhatian:** `backend/database/reset-supabase.sql` menghapus tabel aplikasi
yang ada sebelum membuat ulang schema. Jangan jalankan jika ingin
mempertahankan data lama. Untuk database yang sudah memiliki tabel inti,
ikuti petunjuk pemilihan migrasi di panduan database.

## Tes dan build

```bash
npm --prefix backend test
npm --prefix frontend run build
```

## Lisensi

Lihat [LICENSE](LICENSE).
