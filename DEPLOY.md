# 🚀 Panduan Deploy NusaBridge

Project ini punya dua bagian:

```
nusa-bridge/
├── frontend/   -> website React + Vite (yang dilihat pengunjung)
└── backend/    -> API Express (AI chat, RFQ, registrasi, transaksi)
```

Website tetap bisa dibuka walau backend belum jalan. Fitur AI/RFQ akan
otomatis memakai jawaban cadangan lokal.

---

## 1. Jalankan di localhost

Buka **dua** terminal PowerShell.

**Terminal 1 — backend**

```powershell
cd "E:\nusa-bridge\backend"
node server.js
```

Cek: buka http://localhost:5000/api/health — harus muncul `status: online`.

**Terminal 2 — frontend**

```powershell
cd "E:\nusa-bridge\frontend"
npm.cmd run dev
```

Buka **http://localhost:3000**.

> Jika `npm` diblokir PowerShell, selalu pakai `npm.cmd`.

---

## 2. Deploy frontend ke Vercel (paling mudah)

Repo ini sudah punya `vercel.json` di root, jadi Vercel bisa build dari
folder root repo tanpa pengaturan tambahan.

1. Buka https://vercel.com → **Add New Project**.
2. Import repo GitHub `arya20p1-source/nusa-bridge`.
3. Biarkan **Root Directory** kosong (root repo).
4. Klik **Deploy**.

Vercel akan otomatis menjalankan:

```bash
npm --prefix frontend install
npm --prefix frontend run build
```

dan mempublikasikan folder `frontend/dist`.

**Kalau ingin Root Directory diisi `frontend`:**

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

File `frontend/vercel.json` sudah menyiapkan rewrites SPA, jadi halaman
seperti `/produk`, `/solusi`, dan `/harga` tidak akan 404 saat di-refresh.

### Kalau deploy lewat Netlify

File `netlify.toml` sudah disiapkan. Import repo, lalu biarkan pengaturan
default. Netlify akan build dari folder `frontend` dan publish `dist`.

---

## 3. Deploy backend (opsional, untuk fitur AI)

Frontend dan backend sebaiknya di-deploy terpisah:

- **Frontend** → Vercel (static)
- **Backend** → Render / Railway / VPS (Node.js Express)

Di Render/Railway:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variable: `GROQ_API_KEY` (opsional)

Setelah backend punya URL publik, misalnya
`https://nusabridge-api.onrender.com`, buka project Vercel → **Settings →
Environment Variables**, tambahkan:

```
VITE_API_URL = https://nusabridge-api.onrender.com
```

Lalu **Redeploy**. Semua request `/api/...` akan diarahkan ke backend
tersebut.

---

## 4. Checklist kalau website kosong / tidak bisa dibuka

1. **Pastikan build berhasil.** Di localhost jalankan:
   ```powershell
   cd "E:\nusa-bridge\frontend"
   npm.cmd run build
   ```
   Harus muncul `✓ built in ...` dan folder `frontend/dist` terisi.
2. **Pastikan Root Directory benar.**
   - Root repo → pakai `vercel.json` di root.
   - Root `frontend` → pakai `frontend/vercel.json`.
   Jangan mencampur: root `frontend` tetapi build command menunjuk ke
   `frontend/dist` (jalur jadi dobel).
3. **Jangan upload folder `node_modules` atau `dist`.** Vercel/Netlify
   membangun sendiri dari source.
4. **Cek Console browser (F12)** kalau halaman putih. Error pertama yang
   muncul biasanya menunjukkan file yang bermasalah.
5. **Refresh halaman `/produk` langsung.** Kalau 404, berarti rewrites SPA
   belum aktif — pastikan `vercel.json` / `netlify.toml` ikut ter-commit.

---

## 5. Perubahan terbaru yang perlu diketahui

- Login/daftar sekarang punya **pilihan logo usaha** (PNG/JPG/WebP/SVG,
  maks 5 MB). Logo disimpan di `localStorage` dan tampil di lingkaran
  profil navbar.
- Klik avatar di navbar setelah login untuk **mengganti logo**.
- Kalau belum memilih logo, profil menampilkan **inisial nama usaha**.
- Semua teks GTNIC sudah dihapus dari tampilan website.
