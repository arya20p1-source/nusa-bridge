# Panduan Belajar Kode NusaBridge

Dokumen ini membantu memahami **bagaimana kode proyek bekerja**, bukan hanya menghafal nama file. Gunakan kode yang sedang ada di repository sebagai sumber kebenaran: sebagian fitur NusaBridge adalah simulasi untuk prototipe, bukan layanan ekspor, pembayaran, atau pelacakan kapal sungguhan.

## 1. Gambaran besar

NusaBridge adalah situs multi-halaman untuk memperkenalkan produk ekspor dan mendemonstrasikan alur layanan bagi UMKM.

```text
Browser
  ├─ HTML: struktur halaman dan elemen yang dilihat pengguna
  ├─ CSS: tata letak, warna, responsivitas, animasi
  └─ JavaScript: interaksi, data halaman, dan permintaan ke API
               │ HTTP / JSON
               ▼
        Node.js + Express
          ├─ memproses endpoint /api/...
          ├─ membaca/menulis file JSON
          └─ dapat mencoba memakai Gemini jika API key tersedia
               │
               ▼
        database/*.json
```

Contoh hubungan saat pengguna mengirim pertanyaan:

1. Pengguna mengetik di halaman Solusi AI.
2. `js/solusi.js` membaca input dan mengirim `fetch('/api/ai/chat', ...)`.
3. `backend/server.js` menerima request pada endpoint `/api/ai/chat`.
4. Backend memilih jawaban dari Gemini bila tersedia, atau mesin aturan lokal untuk demo.
5. Backend mengirim respons JSON.
6. JavaScript browser membaca respons dan menampilkan gelembung chat.

Hal penting: browser dan server adalah dua program berbeda. JavaScript browser mengurus tampilan; JavaScript backend mengurus HTTP, data, dan rahasia seperti API key.

## 2. Peta file: mulai dari mana?

| Bagian | File penting | Tugas utama |
|---|---|---|
| Beranda | `index.html`, `css/styles.css`, `js/script.js` | Struktur beranda, gaya bersama, navigasi, bahasa, modal dan interaksi umum |
| Katalog | `produk.html`, `css/produk.css`, `js/produk.js`, `js/products-data.js` | Daftar produk, pencarian, kategori, pengurutan, halaman produk, form RFQ |
| Solusi AI | `solusi.html`, `css/solusi.css`, `js/solusi.js` | Chat, demo analisis, dokumen dan verifikasi simulasi; sebagian alur memanggil API backend |
| Harga | `harga.html`, `css/harga.css`, `js/harga.js` | Paket, simulasi kupon diskon, kalkulator, dan FAQ |
| Radar | `css/radar.css`, `js/radar.js` | Animasi kapal dan tampilan telemetri simulasi pada beranda |
| Server | `backend/server.js`, `backend/package.json` | Server Express, endpoint API, penyajian halaman, integrasi AI |
| Data | `database/db.js`, `database/*.json` | Fungsi baca/tulis dan data contoh berbasis JSON |
| Gambar dan ikon | `assets/` | Aset visual yang dipakai halaman |

### Ada folder `frontend/` dan file HTML di root

Ada salinan halaman dan aset JavaScript/CSS di root dan `frontend/`. Server Express menyajikan `frontend/` lebih dahulu, sedangkan beberapa perintah server statis bisa menyajikan file root. Karena itu, jika perubahan tidak terlihat, periksa **halaman dan skrip mana yang benar-benar dimuat** melalui URL dan tag `<script src="...">`/`<link href="...">` di HTML. Hindari mengedit banyak salinan sekaligus tanpa membandingkannya; perubahan pada satu salinan belum tentu mengubah halaman yang sedang dibuka.

## 3. Fondasi web yang perlu dipahami

### HTML: struktur dan kontrak elemen

HTML menentukan elemen yang tersedia, misalnya tombol, input, navigasi, kartu, dan modal. JavaScript mencari elemen berdasarkan `id` atau selector CSS.

```html
<input id="productSearchInput" type="search">
<button id="searchButton" type="button">Cari</button>
<div id="productsCatalogGrid"></div>
```

```js
const searchInput = document.getElementById('productSearchInput');
const grid = document.getElementById('productsCatalogGrid');
```

Nama `id` adalah penghubung antara HTML dan JavaScript. Jika diganti di satu tempat saja, fitur yang mengandalkannya bisa berhenti. Atribut `alt` pada gambar dan elemen HTML semantik juga membantu aksesibilitas dan mesin pencari.

### CSS: tampilan dan tata letak

CSS memilih elemen dengan selector (contoh `.nav-link`, `#navMenu`) lalu menetapkan tampilannya. Berkas `css/styles.css` berisi gaya umum; berkas seperti `css/produk.css` menambahkan gaya khusus halaman. Cari aturan `@media` untuk melihat bagaimana tata letak berubah pada layar kecil.

Konsep yang perlu dikenali:

- **class** (`.card`) biasanya dipakai bersama oleh banyak elemen.
- **id** (`#navMenu`) biasanya menandai satu elemen tertentu.
- **Flexbox/Grid** mengatur susunan elemen.
- **media query** menerapkan aturan berdasarkan lebar layar.
- **CSS custom properties** (`var(--...)`) menyimpan nilai desain yang bisa dipakai ulang.

### JavaScript browser: event, state, dan DOM

Sebagian besar skrip halaman menunggu `DOMContentLoaded`, agar elemen HTML sudah siap sebelum dicari.

```js
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('searchButton');
  button?.addEventListener('click', () => {
    console.log('Tombol diklik');
  });
});
```

Urutan berpikir yang berguna:

1. **Event** terjadi (klik, ketik, submit).
2. Baca nilai dari form atau elemen.
3. Perbarui **state** (nilai yang mewakili keadaan aplikasi).
4. Hitung hasil atau minta data.
5. Perbarui DOM agar pengguna melihat hasilnya.

Operator `?.` (optional chaining) mencegah pemanggilan properti pada nilai `null`. Gunakan guard ini bila elemen memang tidak ada pada halaman tertentu; jangan gunakan untuk menyembunyikan kesalahan nama `id`.

## 4. Belajar dengan contoh nyata di proyek

### A. Katalog produk: filter dan pagination

`js/products-data.js` menyediakan data pada `window.NUSA_PRODUCTS_DATA`. `js/produk.js` mengambilnya, menyimpan kategori/halaman aktif sebagai state, memfilter dan mengurutkan data, kemudian merender kartu produk ke dalam grid.

Rumus pagination yang muncul dalam kode:

```text
jumlah halaman = ceil(jumlah hasil / item per halaman)
indeks awal    = (halaman aktif - 1) × item per halaman
```

Fungsi `renderProducts()` menampilkan potongan array untuk halaman aktif. `applyFilterAndSort()` menggabungkan kata pencarian, kategori, dan pilihan urutan, lalu menggambar ulang hasilnya. Ini contoh penting pola **data → transformasi → tampilan**.

Saat gambar produk gagal dimuat, event `onerror` mengganti gambar dengan aset fallback. Fallback menjaga tampilan tetap utuh, tetapi tidak memperbaiki sumber gambar yang salah.

### B. Form RFQ: browser memanggil backend

RFQ (*Request for Quotation*) adalah permintaan penawaran. Dalam `js/produk.js`, submit form mencegah reload halaman, membaca input, lalu mengirim data ke `POST /api/rfq`. Backend menerima body JSON dan menyimpan objek RFQ ke file `database/rfq.json`.

Contoh sederhana bentuk request:

```js
const response = await fetch('/api/rfq', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productName: 'Kopi Gayo', quantity: 1000 })
});
const result = await response.json();
```

Pahami tiga bagian penting: **URL dan method**, **headers**, lalu **body**. `await` menunggu operasi jaringan selesai. Request bisa gagal karena server mati, URL salah, data tidak valid, atau respons bukan JSON; aplikasi yang baik harus menampilkan kegagalan itu kepada pengguna.

### C. Harga: kalkulasi dan penyimpanan browser

`js/harga.js` menghitung potongan harga dengan pola:

```text
nilai diskon = harga dasar × persentase / 100
harga akhir  = harga dasar − nilai diskon
```

Hasil kupon demo disimpan dengan `localStorage`, sehingga tetap ada setelah halaman dimuat ulang pada browser yang sama. `localStorage` bukan database server: data hanya tersedia di browser/perangkat itu, dapat diubah pengguna, dan tidak cocok untuk menyimpan rahasia.

`setInterval()` dipakai untuk membuat animasi angka berganti selama undian demo. Interval harus dihentikan ketika animasi selesai, agar callback tidak berjalan terus.

### D. Radar: animasi bukan data kapal sungguhan

`js/radar.js` memiliki objek kapal contoh, state seperti kapal aktif/kecepatan/jeda, dan timer yang memperbarui posisi. Fungsi SVG seperti `getPointAtLength()` dapat mengambil titik pada jalur gambar. `Math.atan2(dy, dx)` membantu menghitung sudut agar ikon menghadap arah jalur.

Walaupun tampilan menyebut AIS/telemetri dan rute nyata, kode yang dipelajari di sini menggerakkan **data simulasi lokal**. Tidak ada koneksi AIS langsung dalam alur ini. Ini contoh bagus membedakan animasi visual dari integrasi data eksternal.

### E. Halaman Solusi AI: UI dan backend

`js/solusi.js` mengelola input percakapan, menambahkan bubble ke DOM, lalu mengirim pesan ke `/api/ai/chat`. Backend mencoba menggunakan paket `@google/genai` apabila `GEMINI_API_KEY` disetel. Tanpa key atau ketika akses AI gagal, ada logika respons lokal berbasis aturan/kata kunci untuk demo.

Jawaban lokal berbasis aturan bukan model AI dan tidak setara dengan sumber hukum/perdagangan resmi. Verifikasi regulasi, tarif, dokumen, NIB, atau sertifikasi dengan sumber berwenang sebelum mengambil keputusan bisnis.

Bagian antarmuka juga mendemonstrasikan dokumen, pemeriksaan format NIB, dan alur escrow. Periksa endpoint dan kode sebelum menyebutnya sebagai layanan nyata: validasi KYC di proyek ini adalah simulasi, generator mengembalikan data contoh, dan escrow tidak memindahkan atau menahan uang sungguhan.

## 5. Backend dan data

### Express: menerima request HTTP

`backend/server.js` membuat aplikasi Express. Middleware seperti `express.json()` membaca body JSON, `cors()` mengatur akses lintas origin, dan `express.static()` menyajikan file situs. Endpoint menghubungkan method dan path dengan fungsi:

| Method dan path | Kegunaan dalam prototipe |
|---|---|
| `GET /api/health` | Mengembalikan status server |
| `GET /api/products` | Mencari/filter produk dengan query seperti `category`, `search`, `page`, `limit`, `sort` |
| `GET /api/products/:id` | Mengambil satu produk |
| `POST /api/auth/register` | Membuat akun demo |
| `POST /api/auth/login` | Alur login demo |
| `GET` / `POST /api/rfq` | Membaca dan mengirim permintaan penawaran |
| `POST /api/kyc/verify` | Memeriksa format dan memberikan hasil KYC simulasi |
| `POST /api/documents/generate` | Menghasilkan payload dokumen contoh |
| `POST /api/ai/chat` | Memproses pertanyaan dengan Gemini atau fallback |
| `GET /api/transactions` | Membaca data transaksi demo |

Pada Express, `req` berisi informasi request (misalnya `req.body`, `req.query`, `req.params`) dan `res` dipakai untuk mengirim status/konten ke browser. `GET` umumnya membaca data, sedangkan `POST` mengirim atau membuat data.

### JSON store: belajar file I/O asynchronous

`database/db.js` menggunakan `fs/promises` untuk membaca dan menulis file. Fungsi seperti `read`, `create`, `update`, `delete`, dan `queryProducts` memperlihatkan konsep CRUD (Create, Read, Update, Delete), pencarian, sorting, dan pagination. `async`/`await` membuat kode asynchronous lebih mudah dibaca.

File di `database/` adalah penyimpanan JSON sederhana, bukan MySQL/PostgreSQL. Cocok untuk prototipe dan belajar, tetapi bukan database produksi: belum ada transaksi/locking yang kuat, query serentak bisa saling menimpa, file dapat rusak, dan tidak ada sistem hak akses/backup otomatis seperti layanan database. Periksa hasil `write()` juga sebelum menganggap data pasti tersimpan.

### Batasan keamanan dan validitas demo

Endpoint autentikasi dalam kode ini membuat token sederhana dan login demo; tidak ada alur autentikasi produksi dengan pemeriksaan password yang aman dan sesi/token tervalidasi. Nomor NIB dan status terverifikasi pada data tertentu dibuat untuk simulasi, bukan pemeriksaan langsung ke OSS. Jangan gunakan data pribadi sungguhan pada demo ini.

API key Gemini harus berada di environment backend, misalnya dalam `backend/.env`:

```text
GEMINI_API_KEY=isi_api_key_di_lingkungan_lokal
```

Jangan menaruh key di JavaScript browser, HTML, atau commit Git. Jangan pernah mengirim key ke chat, screenshot, atau repository publik. Jika key pernah terpublikasi, cabut dan buat key baru.

## 6. Menjalankan dan menguji secara lokal

Prasyarat: Node.js sudah terpasang. Perintah berikut dijalankan di PowerShell dari folder repository:

```powershell
Set-Location E:\nusa-bridge\backend
npm install
npm start
```

Server secara default menggunakan port `5000`. Buka `http://localhost:5000` untuk situs yang disajikan server. Cek `http://localhost:5000/api/health` untuk memastikan API merespons. Jika port sudah dipakai, atur `PORT` ke port yang kosong di lingkungan proses sebelum memulai server.

Urutan debug saat fitur tidak berjalan:

1. Buka Developer Tools browser → tab **Console**; cari error JavaScript.
2. Buka tab **Network**; periksa URL, method, status HTTP, request body, dan response.
3. Lihat terminal tempat server berjalan untuk error backend.
4. Pastikan endpoint menggunakan port server yang benar dan file JSON dapat dibaca/ditulis.
5. Periksa nama `id` HTML dan urutan `<script>`: data yang dipakai skrip lain harus dimuat lebih dahulu.

## 7. Cara membaca satu fitur sampai paham

Gunakan urutan ini pada fitur apa pun:

1. Cari elemen HTML-nya (`id`, `class`, form, tombol).
2. Lihat CSS yang menata elemen itu.
3. Cari selector dan event handler-nya di JavaScript.
4. Ikuti fungsi yang dipanggil, serta data/state yang dibaca dan diubah.
5. Jika ada `fetch`, catat endpoint, method, body, dan bentuk JSON respons.
6. Temukan endpoint di `backend/server.js`.
7. Ikuti pemanggilan `db.*` sampai ke file JSON yang dibaca/ditulis.
8. Coba skenario normal, input kosong, hasil kosong, dan server mati.

Contoh latihan: telusuri form RFQ dari tombol “Kirim” hingga objek baru muncul di `database/rfq.json`. Sebutkan data mana yang berasal dari form, nilai default yang ditambahkan server, status HTTP sukses, dan pesan yang ditampilkan jika request gagal.

## 8. Rencana belajar bertahap

1. **HTML** — ubah teks/judul, cari tag yang membentuk satu kartu; pahami `id`, `class`, atribut, dan form.
2. **CSS** — ubah satu warna atau jarak; lihat efeknya di desktop dan lebar mobile.
3. **JavaScript DOM** — tambahkan `console.log`, ikuti event klik, lalu ubah teks dengan `textContent`.
4. **Data array** — pahami `filter`, `sort`, `map`, `slice`, dan cara katalog memakainya.
5. **Async dan fetch** — amati request API di tab Network dan pahami `await` serta JSON.
6. **Express** — buat diagram request masuk → validasi → proses → response.
7. **File JSON** — telusuri operasi CRUD dan pikirkan apa yang terjadi jika dua penulisan terjadi bersamaan.
8. **Perbaikan kecil** — tambahkan validasi input dan pesan error yang jelas pada satu form; uji input valid/tidak valid.

Jangan mulai dengan mengubah banyak file sekaligus. Buat satu perubahan kecil, jalankan, amati hasilnya, lalu jelaskan kembali sebab dan akibatnya dengan kata-kata sendiri.

## 9. Glosarium singkat

- **DOM**: representasi elemen HTML yang dapat dibaca dan diubah JavaScript.
- **State**: nilai yang menggambarkan keadaan aplikasi saat ini.
- **Event listener**: fungsi yang dijalankan saat terjadi klik, ketikan, submit, dan sebagainya.
- **API**: aturan dan endpoint yang memungkinkan program berkomunikasi.
- **Endpoint**: kombinasi HTTP method dan path, misalnya `GET /api/products`.
- **JSON**: format teks untuk bertukar/menyimpan objek dan array.
- **CRUD**: operasi dasar Create, Read, Update, Delete.
- **Pagination**: membagi daftar panjang menjadi beberapa halaman.
- **Fallback**: jalur alternatif ketika sumber utama tidak tersedia.
- **Prototype/sandbox**: implementasi demonstrasi; jangan diasumsikan siap untuk transaksi atau keputusan produksi.

## 10. Pertanyaan cek pemahaman

1. Apa bedanya `js/produk.js` dengan `backend/server.js`?
2. Mengapa `DOMContentLoaded` dipakai sebelum mencari elemen HTML?
3. Apa perbedaan `req.body`, `req.query`, dan `req.params`?
4. Bagaimana filter kategori memengaruhi jumlah halaman katalog?
5. Apa yang terjadi jika server mati saat browser mengirim RFQ?
6. Mengapa `localStorage` bukan pengganti database akun?
7. Bagian radar mana yang membuat kapal bergerak, dan apakah datanya berasal dari AIS sungguhan?
8. Apa yang harus dipastikan sebelum menyebut hasil KYC/dokumen sebagai data resmi?

Jika bisa menjawab dengan menunjuk alur kode, bukan sekadar menghafal istilah, berarti pemahaman mulai terbentuk.
