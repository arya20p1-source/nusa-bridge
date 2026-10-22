# ☕ MATERI BELAJAR CODING — NusaBridge
### Belajar dari project nyata, tanpa terus bergantung pada AI

Dokumen ini dibuat khusus untuk kamu. Isinya: bagaimana project NusaBridge ini
dibangun, konsep-konsep yang dipakai, dan **latihan-latihan praktik** supaya kamu
bisa mengubah kode sendiri di kemudian hari.

> **Aturan emas belajar coding:**
> 1. Baca kodenya dulu, jangan langsung minta diganti.
> 2. Ubah satu hal kecil → jalankan → lihat hasilnya. Itu cara tercepat paham.
> 3. Kalau error, **baca tulisan merahnya** — error adalah guru terbaik.

---

## BAB 1 — Peta Project

```
nusa-bridge/
├── backend/                 ← "dapur" (server, database, AI)
│   ├── server.js            ← Express server, port 5000
│   ├── database/            ← data disimpan sebagai file .json
│   └── .env                 ← kunci rahasia (jangan dibagikan!)
│
└── frontend/                ← "toko" (yang dilihat pengunjung)
    ├── index.html           ← pintu masuk halaman
    ├── vite.config.js       ← konfigurasi tool build
    └── src/
        ├── main.jsx         ← awal mula React dijalankan
        ├── App.jsx          ← daftar rute (URL → halaman mana)
        ├── pages/           ← 4 halaman utama
        │   ├── HomePage.jsx        (Beranda)
        │   ├── ProductsPage.jsx    (Produk)
        │   ├── SolutionsPage.jsx   (Solusi AI)
        │   └── PricingPage.jsx     (Harga)
        ├── components/      ← potongan UI kecil (Navbar, Footer, Modal...)
        ├── context/         ← data bersama antar komponen (login, bahasa)
        ├── i18n/            ← kamus terjemahan ID/EN
        ├── data/            ← products.js = katalog 50 produk
        ├── hooks/           ← useHashScroll (logika scroll)
        ├── utils/           ← fungsi bantu (aiText, solusiReply, dll)
        └── styles/          ← semua CSS
```

**Cara menjalankan (ingat: di PowerShell pakai `npm.cmd`):**

```powershell
# Terminal 1 — backend
cd "E:\nusa-bridge - Copy (2)\backend"
node server.js

# Terminal 2 — frontend (development, ada hot-reload)
cd "E:\nusa-bridge - Copy (2)\frontend"
npm.cmd run dev
```
Buka **http://localhost:3000**.

---

## BAB 2 — Dasar React yang Dipakai di Project Ini

React = membangun halaman dari **komponen** (potongan kecil) seperti Lego.

### 2.1 Komponen = fungsi yang mengembalikan "JSX" (HTML-di-dalam-JavaScript)

Lihat `frontend/src/components/Footer.jsx` — strukturnya kira-kira:

```jsx
export default function Footer() {
  return (
    <footer className="site-footer">
      <p>© 2026 NusaBridge</p>
    </footer>
  );
}
```

- `export default` = "ini bagian utama file ini, boleh diimpor file lain".
- `className` (bukan `class`) — nama khusus React.
- Satu komponen wajib punya **satu** elemen induk (bungkus dengan `<div>` kalau perlu).

### 2.2 Props = parameter untuk komponen

```jsx
// Komponen
function Greeting({ nama, kota }) {
  return <p>Halo {nama} dari {kota}!</p>;
}

// Pemakaian
<Greeting nama="Budi" kota="Aceh" />
```

### 2.3 State = data yang kalau berubah, tampilan ikut berubah

`useState` adalah hook paling sering dipakai. Contoh nyata dari
`ProductsPage.jsx` (disederhanakan):

```jsx
const [query, setQuery] = useState('');   // [nilai sekarang, cara mengubah]

<input
  value={query}
  onChange={(e) => setQuery(e.target.value)}   // setiap ketikan → state baru
/>
```

Setiap kali `setQuery(...)` dipanggil, React **render ulang** tampilan.
Itulah sebabnya produk di halaman langsung tersaring saat kamu mengetik —
karena `filtered` dihitung ulang dari `query` setiap render.

### 2.4 useEffect = "lakukan sesuatu saat komponen muncul / nilai berubah"

Dari `ProductsPage.jsx`:
```jsx
useEffect(() => {
  window.scrollTo(0, 0);   // pindah halaman → kembali ke atas
}, []);
```
Angka kedua `[]` = daftar "pemicu". Kosong = sekali saja saat muncul.
`[query]` = jalankan ulang tiap `query` berubah.

### 2.5 useMemo = hasil hitung yang di-cache

Dari `ProductsPage.jsx`:
```jsx
const filtered = useMemo(() => {
  // logika filter & urutkan produk
}, [query, sortBy, category]);
```
Isi hanya dihitung ulang kalau `query`, `sortBy`, atau `category` berubah.

---

## BAB 3 — Bedah Halaman Produk (baca kodenya sambil membaca bab ini!)

Buka `frontend/src/pages/ProductsPage.jsx`. Alurnya:

```
products.js (data)  →  useMemo filtered  →  grid kartu  →  pagination
      ↑                       ↑
  search + sort + category (state)
```

Tiga hal yang wajib kamu pahami di file ini:

**1) Sumber data** — bagian paling atas:
```jsx
import { PRODUCTS_DATA } from '../data/products.js';
```
`products.js` hanyalah `export const PRODUCTS_DATA = [ {...}, {...}, ... ]` —
50 objek, tiap objek satu produk (semua dengan gambar unik).

**2) Filter + sort** (inti logika):
```jsx
const filtered = useMemo(() => {
  const q = query.toLowerCase().trim();
  let list = PRODUCTS_DATA.filter((p) => {
    const matchCat = category === 'all' || p.category === category;
    const matchQuery = !q || p.name.toLowerCase().includes(q) || ...;
    return matchCat && matchQuery;
  });
  if (sortBy === 'price-low') list = [...list].sort((a, b) => a.price - b.price);
  // ...
  return list;
}, [query, sortBy, category]);
```
- `.filter(...)` = ambil yang true saja
- `.sort(...)` = urutkan
- `[...list]` = salinan dulu, supaya array asli tidak berubah (penting di React!)

**3) Pagination** — membagi `filtered` per 12:
```jsx
const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
```

---

## BAB 4 — Latihan Praktik (KERJAKAN! Ini kuncinya)

> Kerjakan berurutan. Setiap latihan kecil dan terukur.
> Hasilnya bisa langsung dilihat dengan `npm.cmd run dev`.

### Latihan 1 — Tambah 1 produk baru (15 menit)

Buka `frontend/src/data/products.js`. Salin satu objek (misal produk kopi
pertama), tempel di **akhir array**, lalu ubah isinya:

```js
{
  "id": "prod_kopi_999",              // id harus unik!
  "name": "Kopi Uji Coba Milikku",
  "category": "kopi",                 // kopi | rempah | kriya | tekstil | makanan | lainnya
  "price": 12.5,                      // USD per unit
  "unit": "Kg",
  "moq": 100,
  "origin": "Kotaku, Provinsiku",
  "hsCode": "0901.11.10",
  "image": "/assets/products/kopi-11.webp",
  "desc": "Deskripsi singkat produk...",
  "specs": [ { "k": "Tipe Proses", "v": "Green Beans" } ],
  "certs": ["Halal BPJPH"],
  "shipping": "FOB Pelabuhan Belawan",
  "verifiedExporter": true
}
```

Simpan → buka http://localhost:3000/produk → cari "Uji Coba".
Kalau muncul, **kamu sudah bisa menambah produk sendiri!**

### Latihan 2 — Ubah jumlah produk per halaman (10 menit)

Di `ProductsPage.jsx` cari `const ITEMS_PER_PAGE = 12;`
Ubah jadi `8`. Simpan. Perhatikan halaman katalog sekarang lebih banyak
halaman & tombol pagination bertambah. Kembalikan ke 12 kalau selesai.

### Latihan 3 — Tambah kategori baru (20 menit)

1. Di `ProductsPage.jsx`, tambah chip di `CAT_CHIPS`:
   ```js
   { key: 'teh', label: '🍵 Teh & Herbal' },
   ```
2. Tambahkan 1 produk di `products.js` dengan `"category": "teh"`.
3. Selesai — chip baru otomatis menampilkan hitungan (1) dan memfilter.

### Latihan 4 — Buat tombol "Kopi termurah" (25 menit)

Di bagian filter, tambahkan tombol sederhana:
```jsx
<button onClick={() => applyFilter('sort', 'price-low')}>
  Lihat yang Termurah
</button>
```
Pahami: tombol itu hanya memanggil fungsi yang sudah ada — itulah kekuatan
state bersama.

### Latihan 5 — Pahami backend (30 menit)

Buka `backend/server.js`. Cari endpoint `/api/rfq`. Ubah pesan suksesnya
(kata-kata alert), simpan, jalankan `node server.js`, lalu isi form RFQ di
halaman produk. Kamu mengubah "dapur" dan hasilnya terlihat dari "toko".

### Latihan 6 — Tambah terjemahan (20 menit)

Buka `frontend/src/i18n/translations.js`. Tambahkan kunci baru di bagian ID
dan EN:
```js
"id": { ..., "latihan_ku": "Ini latihan saya" }
"en": { ..., "latihan_ku": "This is my exercise" }
```
Pakai di komponen mana pun:
```jsx
import T from '../components/T.jsx';
<T k="latihan_ku" />
```

---

## BAB 5 — Konsep Backend Singkat

`backend/server.js` memakai **Express** (pustaka server web Node.js):

```js
app.post('/api/rfq', (req, res) => {
  const data = req.body;              // data dari frontend
  // ... proses ...
  res.json({ success: true });        // balasan ke frontend
});
```

Di frontend, pemanggilannya (lihat `ProductsPage.jsx` → `RfqModal`):
```js
fetch('/api/rfq', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productName: '...', quantity: '...' }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```
`fetch` = "kirim surat ke server, tunggu balasan".

Database di sini sengaja dibuat sederhana: file `.json` di `backend/database/`
bisa kamu buka dengan Notepad dan lihat isinya.

---

## BAB 6 — Cheat Sheet Error Umum

| Tulisan error | Penyebab paling umum | Solusi |
|---|---|---|
| `Unexpected token }` | Kurung kuraw/`}` tidak seimbang | Hitung kurung buka vs tutup |
| `X is not defined` | Lupa `import` atau typo nama variabel | Cek ejaan & impor |
| `Each child in a list should have a unique "key"` | Lupa `key={...}` saat `.map()` | Tambah `key={p.id}` |
| Halaman kosong / error di browser | Salah di mana pun di chain | Baca console (F12) baris pertama merah |
| `npm : cannot be recognized` di PowerShell | `npm` diblokir kebijakan | Pakai `npm.cmd` |

---

## BAB 7 — Rencana Belajar 2 Minggu

| Hari | Aktivitas |
|---|---|
| 1-2 | Jalankan project, kerjakan Latihan 1-2 |
| 3-4 | Baca `ProductsPage.jsx` penuh, kerjakan Latihan 3-4 |
| 5-6 | Baca `AppContext.jsx` (login & bahasa), coba logout/login |
| 7 | Rehat — coba fitur RFQ/AI di aplikasi, tebak alur datanya |
| 8-9 | Kerjakan Latihan 5 (backend) |
| 10-11 | Kerjakan Latihan 6 (terjemahan), lalu buat halaman "Tentang" baru di `App.jsx` |
| 12-13 | Baca `SolutionsPage.jsx` (paling besar) — pahami tab & state |
| 14 | Buat fitur kecil milikmu sendiri dari nol (mis. tombol favorit produk) |

**Setelah 2 minggu ini:** kamu paham data → state → tampilan → server.
Itu jalur lengkap aplikasi web modern. AI tinggal jadi "papan tulis" yang
kamu tanyai konsepnya, bukan orang yang mengerjakan tugasmu.

---

## Lampiran A — Daftar Script Bantuan (frontend/scripts/)

Folder `scripts/` berisi tool sekali-pakai yang bisa kamu pelajari:

- `add-coffee-products.cjs` — cara program menambah banyak produk sekaligus (contoh manipulasi array & file)
- `dedupe-products.cjs` — membuang produk yang memakai gambar kembar (hasil: 50 produk unik)
- `generate-product-images.cjs` — variasi gambar dengan `sharp`
- `fetch-coffee-images.cjs` — mengambil data dari API (Wikipedia) lalu mengolahnya

Jalankan dengan: `node scripts/nama-script.cjs` (dari folder `frontend/`).

## Lampiran B — Referensi Belajar Lanjutan

- **MDN Web Docs** (mdn.web.id / developer.mozilla.org) — referensi resmi HTML/CSS/JS
- **react.dev** — dokumentasi resmi React (bagian "Learn" sangat cocok untuk pemula)
- **javascript.info** — tutorial JS paling terstruktur
- Latihan gratis: frontendmentor.io, codewars.com

Selamat belajar! Setiap developer hebat pernah mulai dari membaca kode orang
lain dan mengubahnya sedikit demi sedikit. 🚀
