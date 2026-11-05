# Cara Memasang Database NusaBridge V2

## Pilih file yang sesuai

| Kondisi database | File yang dijalankan |
|---|---|
| Sudah ada 4 tabel inti (`users`, `products`, `rfqs`, `transactions`) | **`lanjutan.sql`** |
| Database masih kosong / ingin mulai dari nol | `reset-supabase.sql` |

### Kalau sudah punya 4 tabel inti

Buka **`backend/database/lanjutan.sql`**, copy seluruh isinya, lalu jalankan di
Supabase **SQL Editor**. File ini:

- **tidak menghapus** tabel yang sudah ada;
- menambahkan 24 tabel pendukung;
- melengkapi index, trigger, dan RLS;
- mengisi data contoh (50 produk, 3 akun, 2 RFQ, 1 transaksi, escrow, dll.);
- aman dijalankan ulang.

Lanjut ke **bagian 3** di bawah untuk mengecek hasilnya.

### Kalau ingin reset total

File utama: **`reset-supabase.sql`**

> ⚠️ File ini menghapus semua tabel aplikasi lama di schema `public`, lalu
> membuat ulang 28 tabel baru beserta relasi, index, trigger, RLS, dan data
> contoh. Jalankan hanya jika kamu siap mengganti database lama.

## 1. Backup (disarankan)

Di Supabase Dashboard:

1. Buka **Database** → **Backups**.
2. Pastikan ada backup terbaru, atau unduh data lama lewat **Table Editor** →
   **Export CSV** untuk tabel `login`, `products`, `orderan`, dan
   `transactions`.

## 2. Jalankan SQL

1. Buka project Supabase kamu.
2. Masuk ke **SQL Editor** → **New query**.
3. Buka file `backend/database/reset-supabase.sql`.
4. Copy **seluruh** isinya, tempel ke SQL Editor.
5. Klik **Run**.
6. Tunggu sampai muncul pesan `Success. No rows returned`.

Kalau ingin menjalankan per bagian:

- `schema.sql` → membuat semua tabel (tanpa data contoh).
- `seed.sql` → mengisi data contoh (jalankan setelah `schema.sql`).
- `setup.sql` → sama dengan `reset-supabase.sql` (lengkap).

## 2b. Migrasi RBAC & idempotency (wajib untuk produksi)

Setelah schema utama berhasil, jalankan **`backend/database/rbac-idempotency.sql`**
di Supabase SQL Editor. Migrasi ini menambahkan:

- kolom `idempotency_key` dan `request_hash` pada `rfqs`;
- tabel `idempotency_keys` untuk klaim request secara atomik;
- unique index yang mencegah dua RFQ dengan pembeli + idempotency key sama.

Tanpa migrasi ini backend tetap berjalan dengan penjagaan idempotency di level
proses, tetapi perlindungan setelah restart / multi-instance hanya aktif
setelah migrasi dijalankan.

## 2c. Buat akun admin

Akun admin tidak dibuat otomatis dan tidak bisa didaftarkan lewat API publik.
Dari folder `backend`:

```bash
npm run admin:create -- admin@perusahaan.id 'PasswordKuat123' 'Nama Admin'
```

Script ini membuat akun admin baru atau mempromosikan akun yang sudah ada,
lalu menyimpan password sebagai hash scrypt. Login admin memerlukan email dan
password.

## 3. Cek hasilnya

Di **Table Editor**, pastikan tabel berikut ada:

`users`, `products`, `rfqs`, `transactions`, `plans`, `vouchers`,
`voucher_claims`, `subscriptions`, `payments`, `kyc_verifications`,
`documents`, `shipments`, `shipment_segments`, `shipment_events`,
`transport_options`, `transport_quotes`, `notifications`,
`ai_chat_sessions`, `ai_chat_messages`, `audit_logs`, `idempotency_keys`,
`sessions`, `password_resets`, `email_verifications`, `rfq_messages`,
`escrow_events`, `app_settings`, `exchange_rates`, `product_categories`.

Cek juga:

- `products` berisi **50 baris**.
- `users` berisi **3 baris**.
- `rfqs` berisi **2 baris**.
- `transactions` berisi **1 baris**.

## 4. Isi kredensial backend

Buat file `backend/.env`:

```env
SUPABASE_URL=https://PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key-dari-supabase
AUTH_SECRET=string-acak-panjang-untuk-menandatangani-token
```

Buat `AUTH_SECRET` dengan:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Ambil dari Supabase: **Project Settings** → **API**.

Gunakan **service_role key** (bukan anon key), karena backend melakukan
operasi tulis dan melewati RLS.

## 5. Cek koneksi

```bash
cd backend
npm install
npm run db:check
```

Kalau berhasil, semua tabel akan muncul dengan status `OK`.

## 6. Jalankan website

```bash
cd backend
npm start
```

Lalu buka frontend seperti biasa.

## Yang berubah dari database lama

| Lama | Baru |
|------|------|
| `login` | `users` |
| `orderan` | `rfqs` |
| `id` teks (mis. `prod_kopi_001`) | `id` bigint identity + `code` teks unik |

Backend sudah disesuaikan:

- Dari sisi aplikasi, field `id` tetap berisi kode bisnis
  (`prod_kopi_001`, `rfq_001`, `use_...`, `tx_...`).
- `code` disimpan sebagai kolom unik di database.
- Relasi antar tabel memakai `id` bigint internal.

## Kalau ada error

- **`relation "login" does not exist`** → backend lama masih dipakai, atau
  `reset-supabase.sql` belum dijalankan. Jalankan ulang SQL, lalu restart
  server.
- **`new row violates row-level security policy`** → `SUPABASE_SERVICE_ROLE_KEY`
  belum diisi / masih memakai anon key.
- **`column ... does not exist`** → SQL belum lengkap dijalankan. Copy ulang
  seluruh isi `reset-supabase.sql`.
- **`npm run db:check` gagal di tabel tertentu** → jalankan ulang
  `reset-supabase.sql`, lalu cek lagi.
