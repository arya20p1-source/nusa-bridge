/**
 * NusaBridge Solusi AI — Knowledge Engine fallback offline.
 * Ported from solusi.js generateSmartAgentReply (backend AI offline/timeout).
 */
import { PRODUCTS_DATA } from '../data/products.js';

/** Helper pencari produk cerdas dari katalog 120 komoditas ekspor */
function findMatchingProducts(query) {
  const list = PRODUCTS_DATA || [];
  if (!list.length) return [];
  const qLower = (query || '').toLowerCase().trim();

  const stopwords = ['dan', 'yang', 'untuk', 'dengan', 'dari', 'bisa', 'tolong', 'halo', 'info', 'harga', 'berapa', 'apakah', 'jual', 'kami', 'saya', 'ekspor', 'mau', 'ingin', 'kirim', 'buatkan', 'spesifikasi', 'spek', 'ada', 'cari', 'tentang', 'produk'];
  const keywords = qLower
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopwords.includes(w));

  if (!keywords.length && qLower.length < 3) return [];

  const scored = list
    .map((item) => {
      let score = 0;
      const name = item.name.toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const origin = (item.origin || '').toLowerCase();
      const desc = (item.desc || '').toLowerCase();

      if (name.includes(qLower)) score += 60;
      if (cat.includes(qLower)) score += 30;

      keywords.forEach((kw) => {
        if (name.includes(kw)) score += 15;
        if (cat.includes(kw)) score += 8;
        if (origin.includes(kw)) score += 8;
        if (desc.includes(kw)) score += 3;
      });

      return { item, score };
    })
    .filter((r) => r.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((r) => r.item);
}

export function generateSmartAgentReply(userMessage) {
  const raw = (userMessage || '').trim();
  const q = raw.toLowerCase();

  // 0. Pertanyaan seputar AI / Gemini / kecerdasan buatan
  const isAiQuery =
    /\b(ai|gemini|kecerdasan buatan|machine learning|deep learning|llm|transformer|neural network|bot)\b/i.test(q) ||
    q.includes('cara kerja ai') || q.includes('apa itu ai') || q.includes('bagaimana ai') ||
    q.includes('explain how ai works') || q.includes('how does ai work') || q.includes('what is ai');
  if (isAiQuery) {
    return `Halo! Kecerdasan Buatan (Artificial Intelligence / AI) seperti Google Gemini bekerja dengan prinsip-prinsip komputasi modern berikut:

**1. Pelatihan Skala Besar (Deep Learning & Arsitektur Transformer)**
Model AI dilatih menggunakan miliaran data teks, buku, artikel, dan kode program menggunakan arsitektur jaringan saraf tiruan (neural network) bernama *Transformer*. Model mempelajari hubungan semantik antarkata, struktur bahasa, logika penalaran, dan konteks informasi global.

**2. Pemrosesan Bahasa Alami (Natural Language Processing / NLP)**
Ketika Anda mengetikkan pertanyaan:
• **Tokenisasi**: Pertanyaan dipecah menjadi unit-unit kata atau suku kata (token).
• **Self-Attention Mechanism**: Model menganalisis kata mana yang paling penting dan bagaimana keterkaitannya dalam kalimat Anda.
• **Generasi Prediktif**: Model memprediksi kata demi kata selanjutnya dengan probabilitas tertinggi yang paling akurat, relevan, dan terstruktur.

**3. Implementasi Gemini AI di NusaBridge**
Di platform NusaBridge, AI bertindak sebagai asisten cerdas perdagangan ekspor-impor yang:
• Mengonversi pesan penawaran buyer asing menjadi dokumen RFQ Incoterms 2020.
• Mengaudit legalitas NIB OSS & mendeteksi regulasi negara tujuan (FDA, EUDR, JAS).
• Menghitung kalkulasi biaya ekspor transparan (FOB, ocean freight, asuransi, CIF).
• Memandu alur pencairan dana bertahap secara aman via Escrow Vault.

Ada bagian dari cara kerja AI atau ekspor yang ingin Anda ketahui lebih mendalam?`;
  }

  // 0b. Sapaan ramah
  const isGreeting =
    q.includes('sapaan') || q.includes('sapa') || (q.includes('salam') && !q.includes('salamander')) ||
    /^(halo|hai|hi|hello|selamat pagi|selamat siang|selamat sore|selamat malam|assalamualaikum)[\s!.,?]*$/i.test(q) ||
    ((q.startsWith('halo') || q.startsWith('hai') || q.startsWith('selamat')) && (q.length < 50 || q.includes('singkat')) && !q.includes('fob') && !q.includes('cif') && !q.includes('kontrak'));
  if (isGreeting) {
    return 'Halo! Selamat datang di NusaBridge AI. Senang sekali bisa menyapa Anda! Saya adalah asisten cerdas yang ramah dan siap membantu kebutuhan perdagangan ekspor-impor UMKM Anda maupun diskusi teknologi. Ada yang bisa saya bantu hari ini?';
  }

  const isLegalityOrGuide =
    q.includes('cara ekspor') || q.includes('bagaimana ekspor') || q.includes('memulai ekspor') || q.includes('langkah ekspor') || q.includes('pemula') ||
    q.includes('incoterm') || q.includes('beda fob') || q.includes('perbedaan') ||
    q.includes('legalitas') || q.includes('karantina') || q.includes('fitosanitari') || q.includes('sertifikat') || q.includes('izin') || q.includes('syarat') ||
    q.includes('escrow') || q.includes('keamanan') ||
    q.includes('dokumen') || q.includes('surat ekspor') || q.includes('berkas') ||
    q.includes('hamburg') || q.includes('los angeles') || q.includes('tokyo') || q.includes('hitung') || q.includes('kalkulasi');

  // 1. Pencarian produk dari katalog
  const matchedProducts = findMatchingProducts(raw);
  const isAskingProduct =
    q.includes('harga') || q.includes('produk') || q.includes('kopi') || q.includes('rempah') ||
    q.includes('cengkeh') || q.includes('kayu') || q.includes('rotan') || q.includes('batik') ||
    q.includes('tenun') || q.includes('songket') || q.includes('ulos') || q.includes('vanila') ||
    q.includes('lada') || q.includes('pala') || q.includes('nilam') || q.includes('atsiri') ||
    q.includes('kapulaga') || q.includes('jahe') || q.includes('kunyit') || q.includes('gayo') ||
    q.includes('toraja') || q.includes('mandheling') || q.includes('lampung') || q.includes('dampit') ||
    q.includes('kintamani') || q.includes('bajawa') || q.includes('wamena') || q.includes('spek') ||
    q.includes('spesifikasi') || q.includes('moq') || q.includes('minimal order') || q.includes('jual');

  if (!isLegalityOrGuide && matchedProducts.length > 0 && isAskingProduct) {
    const p = matchedProducts[0];
    const idrEst = Math.round(p.price * 16250).toLocaleString('id-ID');
    const specsText = Array.isArray(p.specs) ? p.specs.map((s) => `${s.k}: ${s.v}`).join(' | ') : 'Standar Ekspor';
    const certsText = Array.isArray(p.certs) ? p.certs.join(', ') : 'Tersertifikasi Ekspor';

    return `Halo! Berikut adalah informasi komoditas ekspor yang Anda tanyakan:

📦 **${p.name}**
• **Kategori Komoditas**: ${p.category ? p.category.toUpperCase() : 'Unggulan Ekspor'}
• **Harga Acuan Ekspor**: $${p.price.toFixed(2)} USD / ${p.unit} (sekitar Rp ${idrEst} / ${p.unit})
• **Minimum Pemesanan (MOQ)**: ${p.moq} ${p.unit}
• **Asal Daerah**: ${p.origin}
• **Kode HS**: ${p.hsCode || '-'}
• **Sertifikasi & Kepatuhan**: ${certsText}
• **Standar Pengiriman**: ${p.shipping || 'FOB Pelabuhan Indonesia'}
• **Spesifikasi Utama**: ${specsText}

${p.desc}

🚀 **Langkah Selanjutnya**:
Apakah Anda ingin saya buatkan kalkulasi estimasi pengiriman (Incoterms FOB atau CIF), rincian ocean freight, asuransi, dan margin aman untuk produk ini? Cukup sebutkan jumlah kuantitas dan negara/pelabuhan tujuannya!`;
  }

  // 2. Rute Hamburg / Jerman
  if (q.includes('hamburg') || q.includes('jerman') || (q.includes('robusta') && (q.includes('cif') || q.includes('20 mt') || q.includes('ton')))) {
    return `Halo! Terima kasih atas pertanyaannya. Berikut adalah analisis menyeluruh untuk pengiriman ekspor Kopi Robusta Lampung ke Hamburg Port, Jerman:

**1. Perhitungan Biaya & Incoterms 2020 (CIF Hamburg)**
• Volume Pengiriman: 20 Metric Ton (20.000 Kg) / 1 Kontainer 20ft FCL
• Harga Dasar FOB Pelabuhan Tanjung Priok: $3.85 / Kg (Total: $77.000 USD)
• Ocean Freight & Asuransi Kargo Laut: $0.42 / Kg ($8.400 USD)
• Total Nilai CIF Hamburg Port: $85.400 USD ($4.27 / Kg)
• Rekomendasi Margin Aman UMKM: +18.5% Net Profit

**2. Audit Legalitas & Regulasi Uni Eropa (EUDR)**
• Legalitas Eksportir: NIB OSS RBA aktif dengan Hak Akses Kepabeanan & Angka Pengenal Eksportir
• Sertifikat Saniter: Phytosanitary Certificate resmi dari Karantina Tumbuhan Indonesia
• Kepatuhan EUDR: Peta poligon geolokasi kebun terdaftar bebas deforestasi
• Skor Kepatuhan: 100% Lolos Verifikasi Ekspor

**3. Dokumen Legal yang Diterbitkan**
Draf Commercial Invoice #INV-2026-DE-088 dan Sales Contract berstandar ICC Incoterms 2020 otomatis diterbitkan dalam format PDF.

**4. Skema Pembayaran Aman via Escrow Vault**
Dana pembayaran buyer sebesar $85.400 USD dikunci di Escrow Vault dan dicairkan dalam 4 tahap:
• Tahap 1 (30% - $25.620): Down Payment (DP) cair saat kontrak ditandatangani untuk modal kerja.
• Tahap 2 (30% - $25.620): Cair saat pemeriksaan stuffing kontainer selesai dan PEB Bea Cukai terbit.
• Tahap 3 (20% - $17.080): Cair saat peti kemas naik ke kapal kargo dan Bill of Lading (B/L) terbit.
• Tahap 4 (20% - $17.080): Pelunasan final saat kapal sandar di Hamburg Port dan kontainer diterima.

Waktu pelayaran laut dari Tanjung Priok ke Hamburg Port berkisar antara 24 hingga 28 hari via Jalur Terusan Suez.`;
  }

  // 3. Rute Los Angeles / USA
  if (q.includes('los angeles') || q.includes('amerika') || q.includes('usa') || (q.includes('cengkeh') && q.includes('cif'))) {
    return `Halo! Berikut adalah analisis kalkulasi ekspor Cengkeh Lalpari Maluku menuju Port of Los Angeles, Amerika Serikat:

**1. Perhitungan Biaya & Incoterms 2020 (CIF Los Angeles)**
• Volume: 5 Metric Ton (5.000 Kg) dalam 200 karung goni laminasi @ 25 Kg
• Harga Dasar FOB Pelabuhan Tanjung Perak: $12.50 / Kg (Total: $62.500 USD)
• Ocean Freight & Asuransi Rute Pasifik: $1.15 / Kg ($5.750 USD)
• Total Nilai Penawaran CIF Los Angeles: $68.250 USD ($13.65 / Kg)
• Rekomendasi Margin Aman: +19.2% Net Profit

**2. Kepatuhan Regulasi US FDA**
• Registrasi US FDA Food Facility Registration terverifikasi aktif
• Prior Notice of Imported Food dikirim sebelum kontainer tiba
• Bebas cemaran aflatoksin dan kadar air terkontrol ketat (<12%)
• Sertifikat Uji Lab & Karantina Indonesia terlampir lengkap

**3. Dokumen Ekspor Resmi**
Proforma Invoice #PI-2026-US-104, Sales Contract, Packing List CBM, dan formulir PEB siap diterbitkan otomatis.

**4. Pencairan Dana Escrow Vault 4 Tahap**
Total nilai transaksi $68.250 USD dikunci secara aman:
• Tahap 1 (30% - $20.475): DP cair saat kontrak disepakati.
• Tahap 2 (30% - $20.475): Cair saat selesai stuffing kontainer dan PEB Bea Cukai terbit.
• Tahap 3 (20% - $13.650): Cair saat kapal bertolak dan On-Board Bill of Lading terbit.
• Tahap 4 (20% - $13.650): Settlement akhir saat kontainer tiba di Los Angeles Port.

Estimasi transit pelayaran laut dari Surabaya ke Los Angeles Port adalah 22-26 hari.`;
  }

  // 4. Rute Tokyo / Jepang
  if (q.includes('tokyo') || q.includes('jepang') || q.includes('japan') || (q.includes('rotan') && q.includes('fob'))) {
    return `Halo! Berikut analisis penawaran ekspor Furnitur Kursi Rotan Alami Cirebon ke Port of Tokyo, Jepang:

**1. Perhitungan Biaya & Incoterms 2020 (FOB Tanjung Priok)**
• Kuantitas: 2.000 Pcs Kursi Rotan Alami (Muatan 2 x 40ft High Cube Container ~136 CBM)
• Harga Satuan FOB Tanjung Priok: $78.00 / Pcs (Total: $156.000 USD)
• Biaya Ocean Freight: Ditanggung oleh buyer dari Tokyo (skema FOB)
• Margin Aman Pengrajin UMKM: +22.0% Net Profit

**2. Audit Legalitas & Standar Mutu Jepang**
• Dokumen V-Legal SVLK Kementerian Lingkungan Hidup & Kehutanan RI aktif
• Perlakuan Fumigasi Standar Internasional ISPM 15 (Bebas Rayap & Jamur Kayu)
• Penggunaan silica gel kargo di setiap kemasan untuk mencegah kelembapan laut

**3. Skema Pencairan Dana Escrow Vault**
Pembayaran senilai $156.000 USD dikunci di awal dan dicairkan bertahap:
• Tahap 1 (30% - $46.800): DP modal pengrajin dan anyaman rotan.
• Tahap 2 (30% - $46.800): Pemeriksaan QC lolos dan dokumen PEB terbit.
• Tahap 3 (20% - $31.200): Kontainer termuat di kapal dan Bill of Lading terbit.
• Tahap 4 (20% - $31.200): Pelunasan saat kontainer tiba di Port of Tokyo.

Estimasi waktu pelayaran Tanjung Priok menuju Tokyo Port berkisar antara 10 hingga 14 hari.`;
  }

  // 5. Kalkulator biaya umum
  if (q.includes('hitung') || q.includes('kalkulasi') || q.includes('estimasi biaya') || q.includes('ongkir') || q.includes('biaya kirim') || q.includes('freight')) {
    return `Halo! Untuk menghitung estimasi biaya ekspor secara akurat, sistem NusaBridge membagi komponen biaya ke dalam 4 pos utama:

**1. Biaya Dasar Modal & FOB (Free on Board)**
• Harga pokok produksi komoditas di tingkat petani/pengrajin
• Biaya kemasan standar ekspor (karung goni laminasi / box karton 5-ply / pallet ISPM 15)
• Biaya transportasi darat (trucking) dari gudang ke pelabuhan muat
• Biaya penanganan pelabuhan (THC - Terminal Handling Charges) & pembuatan dokumen PEB

**2. Ocean Freight (Ongkos Kapal Internasional)**
• Kontainer 20ft FCL (kapasitas s/d 28 CBM / 20 ton): berkisar $1.200 - $3.500 USD tergantung jarak negara tujuan
• Kontainer 40ft High Cube (kapasitas s/d 68 CBM): berkisar $2.200 - $5.500 USD
• Muatan LCL (kubikasi kecil): dihitung per CBM (sekitar $80 - $180 USD/CBM)

**3. Marine Cargo Insurance (Asuransi Pengangkutan Laut)**
• Premi asuransi biasanya berkisar 0,3% - 0,5% dari total nilai barang (Invoice + Freight).

**4. Rekomendasi Margin Aman UMKM**
• NusaBridge merekomendasikan margin laba bersih 15% - 22% setelah seluruh biaya tertutupi.

Jika Anda ingin saya hitungkan untuk komoditas tertentu, cukup sebutkan nama produk, estimasi jumlah kuantitas, dan negara/pelabuhan tujuannya!`;
  }

  // 6. Incoterms 2020
  if (q.includes('incoterm') || q.includes('fob') || q.includes('cif') || q.includes('cfr') || q.includes('exw') || q.includes('ddp') || q.includes('beda fob')) {
    return `Halo! Incoterms 2020 adalah aturan resmi dari ICC (International Chamber of Commerce) yang mengatur pembagian biaya, risiko, dan tanggung jawab antara penjual (eksportir) dan pembeli (buyer luar negeri).

Berikut penjelasan skema yang paling sering digunakan:

✅ **FOB (Free on Board - Pelabuhan Indonesia)**
Tanggung jawab Anda selesai setelah barang termuat di atas kapal di pelabuhan muat Indonesia (misal: Tanjung Priok atau Tanjung Perak). Ongkos kapal laut internasional dan asuransi kargo ditanggung penuh oleh pembeli. Skema ini sangat direkomendasikan untuk eksportir pemula karena minim risiko fluktuasi biaya kapal!

✅ **CIF (Cost, Insurance, and Freight - Pelabuhan Tujuan Buyer)**
Anda menanggung harga barang, ongkos kapal laut internasional, dan premi asuransi hingga kapal tiba di pelabuhan tujuan pembeli (misal: Hamburg, Tokyo, atau Los Angeles). Namun peralihan risiko kerusakan barang tetap beralih ke pembeli begitu barang termuat di kapal di Indonesia.

✅ **CFR (Cost and Freight)**
Mirip dengan skema CIF, tetapi tanpa asuransi. Biaya asuransi diurus dan ditanggung oleh pembeli sendiri.

✅ **EXW (Ex Works - Gudang Penjual)**
Pembeli mengambil barang langsung di pintu pabrik atau gudang Anda. Seluruh biaya pengangkutan lokal, perizinan ekspor, dan kapal ditanggung pembeli.

Saran terbaik bagi UMKM adalah menawarkan skema FOB terlebih dahulu, atau CIF jika pembeli meminta penawaran lengkap terima di pelabuhan tujuan.`;
  }

  // 7. Legalitas / NIB / karantina
  if (q.includes('legalitas') || q.includes('nib') || q.includes('npwp') || q.includes('oss') || q.includes('izin') || q.includes('syarat') || q.includes('karantina') || q.includes('fitosanitari') || q.includes('phytosanitary') || q.includes('fda') || q.includes('eudr') || q.includes('jas') || q.includes('svlk')) {
    return `Halo! Memiliki legalitas yang lengkap adalah kunci utama agar komoditas ekspor Anda tidak tertahan di Bea Cukai maupun pelabuhan negara tujuan.

Berikut adalah persyaratan legalitas pokok untuk ekspor:

✅ **NIB (Nomor Induk Berusaha) 13 Digit OSS RBA**
Saat ini NIB berbasis risiko otomatis berfungsi sebagai identitas berusaha, Hak Akses Kepabeanan di Ditjen Bea Cukai, serta Angka Pengenal Eksportir/Importir (API).

✅ **NPWP Usaha Aktif**
NPWP badan usaha (PT, CV, Koperasi) atau perorangan yang telah berstatus valid di Direktorat Jenderal Pajak.

✅ **Sertifikat Fitosanitari (Phytosanitary Certificate)**
Wajib untuk seluruh komoditas hasil perkebunan, pertanian, kopi, dan rempah. Diterbitkan oleh Badan Karantina Indonesia setelah melalui uji laboratorium untuk memastikan bebas dari organisme pengganggu tumbuhan.

✅ **Sertifikasi Khusus Komoditas & Negara Tujuan**:
- **Produk Kayu & Rotan**: Wajib memiliki dokumen sertifikasi kelestarian V-Legal SVLK dari Kemenhut.
- **Tujuan Amerika Serikat**: Wajib mendaftarkan fasilitas produksi ke US FDA (Food Facility Registration).
- **Tujuan Uni Eropa**: Wajib mematuhi regulasi bebas deforestasi EUDR dilengkapi koordinat lokasi kebun.
- **Tujuan Jepang**: Memenuhi standar batas residu pestisida JAS (Japanese Agricultural Standards).

Anda dapat menguji validitas NIB usaha Anda pada tab menu KYC Hub di bawah untuk mendapatkan badge Verified Global Exporter.`;
  }

  // 8. Escrow
  if (q.includes('escrow') || q.includes('bayar') || q.includes('pembayaran') || q.includes('aman') || q.includes('penipuan') || q.includes('rekening') || q.includes('dp') || q.includes('uang muka') || q.includes('fase')) {
    return `Halo! Kekhawatiran terbesar eksportir UMKM adalah risiko pembeli luar negeri yang tidak membayar setelah barang dikirim. Fitur Escrow Vault NusaBridge hadir untuk meniadakan risiko tersebut secara tuntas.

**Bagaimana Cara Kerjanya?**
Sebelum proses produksi atau pengiriman dilakukan, buyer wajib menyetorkan 100% nilai transaksi ke rekening penampung aman Escrow Vault (multivalas USD/EUR).

Dana tersebut kemudian dicairkan kepada rekening eksportir dalam **4 Tahap Transparan**:
• **Tahap 1 (30% Down Payment)**: Cair seketika setelah Sales Contract ditandatangani oleh kedua pihak untuk dijadikan modal kerja dan persiapan stok.
• **Tahap 2 (30% Stuffing & PEB)**: Cair saat barang selesai dimuat ke kontainer dan dokumen Pemberitahuan Ekspor Barang (PEB) terbit dari Bea Cukai.
• **Tahap 3 (20% Kapal Bertolak)**: Cair saat kontainer sudah berada di atas kapal dan On-Board Bill of Lading (B/L) resmi diterbitkan maskapai pelayaran.
• **Tahap 4 (20% Settlement Final)**: Cair saat kapal sandar di pelabuhan tujuan dan kontainer lolos pemeriksaan kepabeanan setempat.

Dengan sistem ini, eksportir mendapat kepastian dana sudah tersedia, dan buyer mendapatkan jaminan bahwa barang benar-benar dikirim sesuai standar.`;
  }

  // 9. Dokumen ekspor
  const isDocQuery =
    /\b(dokumen|berkas ekspor|invoice|proforma|sales contract|packing list|bill of lading|surat jalan|surat ekspor)\b/i.test(q) ||
    /\bpeb\b/i.test(q) || /\bcoo\b/i.test(q) ||
    (/\bska\b/i.test(q) && !q.includes('jelas') && !q.includes('skala')) ||
    /\bb\/l\b/i.test(q);
  if (isDocQuery) {
    return `Halo! Dalam perdagangan internasional, dokumen resmi adalah bukti legalitas kepemilikan dan dasar penagihan pembayaran. Berikut 6 dokumen pokok ekspor:

1. **Proforma Invoice**: Penawaran harga resmi di awal yang memuat kuantitas, harga per unit, spesifikasi produk, dan termin pembayaran.
2. **Sales Contract (Kontrak Penjualan)**: Perjanjian jual-beli yang mengikat hak dan kewajiban hukum antara eksportir dan buyer.
3. **Commercial Invoice**: Faktur tagihan resmi yang digunakan untuk proses kepabeanan (clearance) serta dasar penghitungan bea masuk di negara tujuan.
4. **Packing List**: Rincian fisik muatan seperti jenis kemasan, jumlah koli/karung, berat bersih (net weight), berat kotor (gross weight), dan volume CBM.
5. **PEB (Pemberitahuan Ekspor Barang)**: Dokumen pemberitahuan kepabeanan ke Kantor Bea Cukai untuk memperoleh Nota Pelayanan Ekspor (NPE).
6. **Bill of Lading (B/L)**: Bukti tanda terima muatan dan surat kepemilikan barang yang diterbitkan oleh perusahaan pelayaran pengangkut.

Di NusaBridge, Anda dapat menerbitkan draf Proforma Invoice dan Sales Contract berstandar ICC secara otomatis berformat PDF pada fitur Auto-PDF Generator!`;
  }

  // 10. Panduan pemula
  if (q.includes('cara ekspor') || q.includes('bagaimana ekspor') || q.includes('memulai ekspor') || q.includes('langkah ekspor') || q.includes('pemula') || q.includes('panduan') || q.includes('alur ekspor')) {
    return `Halo Rekan Eksportir! Menembus pasar global sebenarnya sangat bisa dilakukan oleh UMKM jika mengikuti tahapan yang terstruktur. Berikut 5 langkah praktis untuk memulai:

**1. Persiapan Legalitas Dasar**
Pastikan Anda memiliki NIB (Nomor Induk Berusaha) dari sistem OSS RBA dan NPWP aktif. NIB kini otomatis berfungsi ganda sebagai izin ekspor dan Hak Akses Kepabeanan.

**2. Standarisasi Mutu & Kemasan**
Riset standar komoditas Anda. Untuk kopi dan rempah, pastikan kadar air terkontrol (<12%) dan siapkan kemasan ekspor berkualitas (seperti karung goni berlaminasi GrainPro).

**3. Penentuan Harga Penawaran**
Hitung harga modal dasar, biaya antar ke pelabuhan, dan gunakan skema penawaran FOB (Free on Board) terlebih dahulu agar Anda tidak terbebani risiko fluktuasi biaya kapal laut internasional.

**4. Terbitkan Dokumen Penawaran Resmi**
Saat ada calon buyer yang berminat, kirimkan Proforma Invoice dan Sales Contract resmi berformat PDF yang mencantumkan spesifikasi jelas, nomor rekening, dan klausul pengiriman.

**5. Gunakan Pembayaran Aman Escrow**
Hindari mengirim barang tanpa uang muka. Selalu gunakan sistem Escrow Vault agar dana buyer sudah terkunci 100% dan dicairkan bertahap (30% DP, 30% PEB, 20% B/L, 20% Tiba).

Jika barang Anda belum mencapai kuantitas 1 kontainer penuh (FCL), Anda bisa memulai dengan skema kargo LCL (konsolidasi muatan) bersama eksportir lain.`;
  }

  // 11. Katalog 120 komoditas
  if (q.includes('katalog') || q.includes('daftar komoditas') || q.includes('daftar produk') || q.includes('apa saja yang dijual') || q.includes('pilihan komoditas')) {
    return `Halo! NusaBridge menyediakan etalase kurasi 120 komoditas ekspor unggulan Indonesia yang telah lolos verifikasi standar mutu dan legalitas:

☕ **Kopi Ekspor Unggulan (30 Produk)**:
Kopi Arabika & Robusta Specialty pilihan (Gayo Aceh, Toraja Sapan, Mandheling, Robusta Lampung ELB, Dampit Malang, Kintamani Bali, Bajawa Flores, Wamena Papua, dll.) dengan opsi Green Beans mentah maupun Roasted Beans.

🌿 **Rempah-Rempah & Hasil Alam (30 Produk)**:
Cengkeh Lalpari Maluku Grade AA, Kayu Manis Korintji Cassia Vera, Lada Putih Muntok Double Washed, Vanila Gourmet Papua, Pala Banda ABCD, Kapulaga Putih Super, dan Minyak Atsiri Nilam Aceh.

🪑 **Kriya & Kerajinan Ramah Lingkungan (30 Produk)**:
Kursi & Furnitur Anyaman Rotan Cirebon, Mebel Kayu Jati SVLK Jepara, Kerajinan Anyaman Enceng Gondok, Mangkuk Batok Kelapa Eco-Polished, dan Keranjang Seagrass.

🧵 **Tekstil & Wastra Nusantara (30 Produk)**:
Kain Batik Tulis Sutra Solo/Yogya Motif Keraton, Batik Cap Pekalongan Katun Primisima, Tenun Ikat Troso Jepara, Tenun Sumba Pewarna Alami, Songket Palembang Benang Emas, dan Ulos Batak Tradisional.

Anda dapat menanyakan harga atau spesifikasi komoditas mana pun secara spesifik, dan saya akan memberikan informasi lengkapnya!`;
  }

  if (q.includes('terima kasih') || q.includes('makasih') || q.includes('thanks') || q.includes('ok') || q.includes('oke') || q.includes('siap')) {
    return 'Sama-sama! Senang bisa membantu Anda. Jika ada pertanyaan lain seputar ekspor komoditas, perhitungan biaya pengiriman, atau pembuatan dokumen perdagangan, silakan ketik kapan saja. Sukses selalu untuk perdagangan ekspor UMKM Indonesia!';
  }

  // 14. Arabika vs Robusta
  if ((q.includes('arabika') && q.includes('robusta')) || q.includes('beda arabika') || q.includes('perbedaan kopi')) {
    return `Halo! Biji kopi Arabika dan Robusta adalah dua komoditas ekspor utama Indonesia dengan perbedaan mendasar:

**1. Profil Cita Rasa (Flavor Profile):**
• **Arabika**: Memiliki rasa kompleks, keasaman (acidity) cerah dan menyegarkan, aroma buah (fruity) atau bunga (floral), dan kadar gula alami lebih tinggi (~6-9%).
• **Robusta**: Cita rasa cenderung earthy, tebal (heavy body), aroma nutty atau dark chocolate, dengan rasa pahit khas yang lebih dominan.

**2. Kandungan Kafein:**
• **Arabika**: Mengandung 1,2% - 1,5% kafein.
• **Robusta**: Mengandung 2,2% - 2,7% kafein (hampir 2 kali lebih pekat).

**3. Ketinggian Kebun (Elevasi):**
• **Arabika**: Tumbuh optimal di dataran tinggi 1.000 - 2.100 mdpl (Gayo, Toraja, Kintamani).
• **Robusta**: Tumbuh baik di dataran rendah hingga sedang 400 - 900 mdpl (Lampung, Dampit Malang).

**4. Nilai Pasar & Minat Buyer Dunia:**
• Arabika bernilai tinggi ($8.50 - $16.50 USD/Kg) untuk specialty coffee shop di Eropa, AS, dan Jepang.
• Robusta ($3.50 - $5.50 USD/Kg) sangat diminati industri kopi instan, roastery komersial, dan espresso blend di Eropa Barat dan Timur Tengah.`;
  }

  // 15. Mencari buyer
  if (q.includes('cari buyer') || q.includes('mencari buyer') || q.includes('mencari pembeli') || q.includes('dapat buyer') || q.includes('buyer luar negeri')) {
    return `Halo! Menemukan buyer luar negeri yang kredibel dapat dilakukan melalui 5 strategi terbukti berikut:

**1. Manfaatkan Perwakilan Dagang RI di Luar Negeri:**
• Hubungi **ITPC (Indonesian Trade Promotion Center)** dan Atase Perdagangan (Atdag) Kemendag di kota tujuan (Hamburg, Los Angeles, Tokyo, Dubai, dll.). Mereka menyediakan daftar kontak importir resmi (*market intelligence*).
• Daftarkan produk Anda di portal resmi **inaexport.id** binaan Kemendag.

**2. Pameran Dagang Internasional:**
• Ikuti pameran B2B seperti **Trade Expo Indonesia (TEI)** di ICE BSD, Gulfood Dubai, atau SIAL Paris. Ini tempat berkumpulnya ribuan *sourcing manager* dari berbagai negara.

**3. Digital B2B Outreach via LinkedIn:**
• Buat profil perusahaan berbahasa Inggris profesional. Cari jabatan *Sourcing Manager*, *Procurement Specialist*, atau *Commodity Importer*.
• Kirimkan pesan singkat sopan berisi *Product Specification Sheet* dan foto laboratorium komoditas Anda.

**4. Kerjasama dengan Asosiasi Eksportir:**
• Bergabunglah dengan asosiasi resmi (seperti AEKI untuk kopi atau Dewan Rempah) untuk mendapatkan informasi kuota atau *buyer inquiry*.

**5. Manfaatkan NusaBridge:**
• Gunakan RFQ Studio untuk menerbitkan penawaran Incoterms resmi berstandar PDF dan tawarkan pembayaran aman via Escrow Vault agar buyer percaya bertransaksi dengan Anda!`;
  }

  // 16. Ekspor tanpa PT
  if (q.includes('tanpa pt') || q.includes('perorangan') || q.includes('badan usaha') || q.includes('harus pt') || q.includes('apakah bisa ekspor')) {
    return `Halo! Jawabannya adalah: **BISA!** Pelaku UMKM di Indonesia kini sangat dimudahkan untuk melakukan ekspor bahkan tanpa harus memiliki PT:

**1. NIB Perorangan (OSS RBA):**
Melalui sistem OSS RBA (oss.go.id), usaha perorangan (Usaha Mikro dan Kecil) dapat mendaftar dan memperoleh NIB 13 digit secara gratis hanya bermodalkan KTP dan NPWP pribadi. NIB ini otomatis berlaku sebagai Angka Pengenal Eksportir dan Hak Akses Kepabeanan Bea Cukai!

**2. Skema Undername (Sewa Izin Ekspor):**
Jika perizinan Anda belum siap, Anda bisa menggunakan jasa freight forwarder dengan skema undername resmi atau konsolidator kargo LCL. Forwarder yang mengurus dokumen kepabeanan atas nama mereka, sementara produk dan hasil pembayaran tetap menjadi hak Anda.

Jadi ketiadaan PT bukan lagi halangan bagi UMKM untuk menembus pasar dunia!`;
  }

  // 17. Cara daftar NIB
  if (q.includes('daftar oss') || q.includes('buat nib') || q.includes('cara nib') || q.includes('daftar nib') || q.includes('bikin nib')) {
    return `Halo! Pendaftaran NIB (Nomor Induk Berusaha) dapat dilakukan dalam hitungan menit secara online dan gratis di portal **oss.go.id**:

**Tahapan Pendaftaran:**
1. Kunjungi website resmi oss.go.id lalu klik **Daftar**.
2. Pilih skala usaha **Usaha Mikro & Kecil (UMK)**.
3. Masukkan NIK KTP, alamat email aktif, dan nomor WhatsApp untuk verifikasi OTP.
4. Isi data profil usaha Anda, alamat gudang, serta pilih kode **KBLI Ekspor**:
   • **46311**: Perdagangan Besar Kopi, Teh, dan Rempah-Rempah.
   • **46499**: Perdagangan Besar Kerajinan & Dekorasi Rumah.
   • **46411**: Perdagangan Besar Tekstil & Pakaian Jadi.
5. Klik simpan dan cetak draf. Dokumen NIB 13 digit berformat PDF akan langsung terbit beserta Hak Akses Kepabeanan Ditjen Bea Cukai.`;
  }

  // 18. HS Code
  if (q.includes('hs code') || q.includes('kode hs') || q.includes('harmonized system')) {
    return `Halo! **HS Code (Harmonized System Code)** adalah kode identifikasi klasifikasi barang standar internasional yang digunakan oleh bea cukai di seluruh dunia:

**Fungsi Utama HS Code:**
• Menentukan besaran tarif bea masuk dan pajak di negara importir.
• Menentukan persyaratan dokumen wajib (seperti uji lab atau sertifikat karantina fitosanitari).
• Standarisasi dokumen ekspor (PEB, Invoice, Packing List, Certificate of Origin).

**Contoh HS Code Komoditas Unggulan:**
• \`0901.11.10\`: Kopi Arabika mentah (Green Beans)
• \`0901.21.10\`: Kopi Sangrai / Roasted Beans
• \`0907.10.00\`: Cengkeh Utuh
• \`0905.10.00\`: Biji Vanila
• \`9401.52.00\`: Kursi / Furnitur Anyaman Rotan
• \`5208.51.00\`: Kain Batik Tradisional Katun

Anda dapat mengecek kode HS komoditas spesifik melalui portal INSW (insw.go.id).`;
  }

  // 19. LCL vs FCL
  if (q.includes('lcl') || q.includes('fcl') || q.includes('beda kontainer') || q.includes('kubikasi')) {
    return `Halo! Dalam logistik pengiriman kargo laut internasional, ada 2 metode pengangkutan kontainer:

✅ **FCL (Full Container Load):** Satu kontainer penuh disewa khusus untuk muatan Anda sendiri.
  - Kontainer 20ft: Kapasitas ~28 CBM / muatan s/d 20-22 ton komoditas curah.
  - Kontainer 40ft High Cube: Kapasitas ~68 CBM / muatan kriya & mebel.
  - Kelebihan: Cepat, segel kontainer utuh dari pabrik sampai pelabuhan tujuan, minim risiko kerusakan.

✅ **LCL (Less than Container Load):** Muatan Anda digabungkan bersama eksportir lain dalam 1 kontainer bersama (konsolidasi).
  - Biaya dihitung per meter kubik (**per CBM**) atau per ton.
  - Kelebihan: Sangat hemat bagi UMKM yang baru mulai mengirim dalam volume kecil (misal: 1 - 5 CBM).`;
  }

  // 20. Demurrage & Detention
  if (q.includes('demurrage') || q.includes('detention') || q.includes('denda kontainer')) {
    return `Halo! **Demurrage** dan **Detention** adalah biaya denda sewa kontainer dari perusahaan pelayaran (shipping line):

• **Demurrage:** Denda yang muncul jika kontainer berisi barang masih menumpuk di terminal pelabuhan melebihi batas waktu gratis (*free time*, biasanya 5-7 hari). Biasanya terjadi karena keterlambatan pengurusan izin bea cukai.
• **Detention:** Denda saat kontainer kosong belum dikembalikan ke depo pelayaran setelah selesai dibongkar di gudang pembeli.

💡 Gunakan NusaBridge Escrow Vault agar seluruh dokumen release kontainer (Bill of Lading, PEB) diserahkan secara digital tepat waktu untuk mencegah denda demurrage!`;
  }

  // 21. Waktu tempuh pelayaran
  if (q.includes('berapa hari') || q.includes('waktu tempuh') || q.includes('lama kirim') || q.includes('durasi kapal') || q.includes('estimasi tiba')) {
    return `Halo! Estimasi waktu tempuh kapal kargo (*transit time*) dari pelabuhan muat Indonesia (Tanjung Priok / Tanjung Perak / Belawan) ke pelabuhan tujuan internasional:

• **Singapura / Malaysia:** 2 - 4 Hari
• **Tokyo (Jepang) / Shanghai (Tiongkok):** 10 - 14 Hari
• **Jebel Ali Dubai (Timur Tengah):** 14 - 18 Hari
• **Melbourne / Sydney (Australia):** 12 - 16 Hari
• **Hamburg Port (Jerman / Eropa):** 24 - 28 Hari (via Terusan Suez)
• **Los Angeles Port (Amerika Serikat):** 22 - 26 Hari (via Rute Samudra Pasifik)

Pergerakan kapal pengangkut dapat Anda pantau secara langsung melalui fitur Radar Maritim NusaBridge!`;
  }

  // 22. Pajak & bea keluar
  if (q.includes('pajak ekspor') || q.includes('bea keluar') || q.includes('ppn ekspor')) {
    return `Halo! Kebijakan perpajakan ekspor di Indonesia sangat mendukung UMKM:

• **PPN Ekspor: 0% (Nol Persen):** Seluruh ekspor barang kena pajak dikenakan tarif PPN 0%.
• **Bea Keluar 0% (Gratis) untuk Produk Olahan UMKM:** Mayoritas produk hilir UMKM (kopi sangrai, rempah kering, mebel kayu ber-SVLK, kerajinan rotan, dan batik) tidak dikenakan Bea Keluar.
• **PPh Final UMKM:** Pajak penghasilan usaha tetap mengikuti tarif PPh Final UMKM 0,5% sesuai PP 55/2022.`;
  }

  // 23. Sampel
  if (q.includes('kirim sampel') || q.includes('sampel') || q.includes('sample') || q.includes('contoh barang')) {
    return `Halo! Mengirimkan sampel produk berkualitas adalah langkah awal mendapatkan kontrak ekspor:

1. **Jasa Kurir Internasional:** Gunakan kurir ekspres seperti DHL, FedEx, atau EMS Pos Indonesia.
2. **Dokumen Sampel:** Sertakan *Proforma Invoice for Sample Purpose* dengan keterangan *"Sample of No Commercial Value for Testing Purpose Only"* berharga nominal rendah agar buyer tidak terkena pajak masuk tinggi.
3. **Sertifikat Saniter:** Untuk produk pertanian mentah (kopi mentah atau rempah), sertakan Sertifikat Fitosanitari Karantina agar paket tidak disita di bandara tujuan.
4. **Kesepakatan Biaya:** Lazimnya eksportir memberikan sampel gratis, sedangkan ongkos kirim ditanggung oleh calon buyer (*Freight Collect* atau transfer dimuka).`;
  }

  // 25. Sapaan
  if (q === 'halo' || q === 'hai' || q === 'hi' || q === 'hello' || q.startsWith('halo ') || q.startsWith('hai ') || q.startsWith('hello ') || q.includes('selamat pagi') || q.includes('selamat siang') || q.includes('selamat sore') || q.includes('selamat malam') || q.includes('apa kabar') || q.includes('how are you')) {
    return `Halo! Senang menyapa Anda. Saya adalah **NusaBridge AI**, asisten cerdas yang siap membantu Anda dalam segala hal seputar perdagangan ekspor-impor dan teknologi kecerdasan buatan.

Ada yang bisa saya bantu hari ini? Anda dapat bertanya tentang:
• **Cara Kerja AI & Teknologi:** Bagaimana kecerdasan buatan dan Google Gemini beroperasi
• **Kalkulasi Biaya Ekspor:** Hitung estimasi harga FOB, Ocean Freight, Asuransi, dan CIF dengan rekomendasi margin aman
• **Audit Legalitas & Regulasi:** Syarat izin NIB OSS, karantina fitosanitari, regulasi FDA Amerika, EUDR Eropa, dan JAS Jepang
• **Katalog Komoditas:** Spesifikasi dan harga acuan dari 120 komoditas unggulan (Kopi, Rempah, Mebel Rotan, Kriya, Tekstil)
• **Keamanan Transaksi:** Skema penguncian dan pencairan dana 4 tahap bertahap di Escrow Vault

Silakan ketik pertanyaan apa saja yang ingin Anda diskusikan!`;
  }

  // 26. Tentang NusaBridge
  if (q.includes('nusabridge') || q.includes('pembuat') || q.includes('arjika') || q.includes('antartika') || q.includes('siapa kamu') || q.includes('kamu siapa') || q.includes('who are you') || q.includes('tentang platform') || q.includes('profil kamu')) {
    return `Halo! Saya adalah **NusaBridge AI**, asisten cerdas perdagangan ekspor-impor yang dibangun oleh **Tim Arjika Labs - SMK Antartika 1 Sidoarjo** untuk kompetisi **GTNIC 2026**.

NusaBridge dirancang untuk memberdayakan UMKM Indonesia melalui 4 Pilar Solusi:
1. **AI Sales Assistant & RFQ Studio**: Menghitung kalkulasi Incoterms 2020 otomatis dan mengonversi pesan penawaran buyer asing menjadi kontrak formal.
2. **Auto-PDF Document Generator**: Menerbitkan draf Proforma Invoice dan Sales Contract berstandar ICC secara instan dan siap cetak.
3. **KYC Hub & Kepatuhan Global**: Memvalidasi NIB OSS, sertifikasi karantina fitosanitari, dan regulasi negara tujuan (FDA, EUDR, JAS).
4. **Escrow Vault & AI Chat**: Menjamin keamanan pembayaran bertahap 4 fase agar UMKM terhindar dari risiko gagal bayar buyer luar negeri.

Ada yang bisa saya bantu hari ini?`;
  }

  // 27. Teknologi / pemrograman
  if (q.includes('coding') || q.includes('koding') || q.includes('program') || q.includes('javascript') || q.includes('python') || q.includes('komputer') || q.includes('server') || q.includes('database') || q.includes('api') || q.includes('teknologi')) {
    return `Halo! Terkait topik teknologi dan pengembangan perangkat lunak:

Teknologi modern dan sistem berbasis AI dirancang untuk memecahkan masalah kompleks secara efisien:
• **Arsitektur Aplikasi:** NusaBridge sendiri dibangun dengan arsitektur web modern yang menggabungkan backend Express.js, sistem database native JavaScript JSON-Store yang cepat, dan integrasi SDK Google GenAI (@google/genai).
• **Panggilan API & Interaksi Cerdas:** Sistem menggunakan REST API untuk menghubungkan antarmuka pengguna dengan mesin AI, sehingga analisis RFQ, kalkulasi Incoterms, dan verifikasi dokumen dapat dijalankan secara instan.
• **Otomatisasi Dokumen:** Menggunakan formatting berbasis CSS Print & PDF templating berstandar internasional untuk mencetak Proforma Invoice dan Sales Contract secara rapi.

Apakah ada aspek pemrograman, API, atau arsitektur teknologi tertentu yang ingin Anda tanyakan?`;
  }

  // 28. Respons bebas
  return `Halo! Terima kasih atas pertanyaan Anda mengenai:
**"${raw}"**

Berikut ulasan informatif dan wawasan komprehensif untuk menjawab pertanyaan Anda:

1. **Inti Pembahasan:**
Pertanyaan yang Anda ajukan menyentuh aspek penting yang memerlukan pendekatan sistematis, pemahaman prinsip dasar yang tepat, serta eksekusi yang cermat.

2. **Wawasan & Strategi Praktis:**
• **Analisis Data yang Terukur:** Pastikan setiap keputusan atau rencana didukung oleh data valid, referensi yang kredibel, serta pertimbangan risiko yang matang.
• **Efisiensi & Standarisasi:** Terapkan langkah kerja yang terstruktur dan terstandarisasi untuk mendapatkan hasil optimal dan konsisten.
• **Penerapan Nyata:** Jika pertanyaan ini berkaitan dengan operasional usaha atau ekspor, Anda dapat memanfaatkan kalkulasi harga Incoterms (FOB/CIF), verifikasi legalitas izin NIB, atau sistem transaksi aman Escrow Vault kami.

Apakah ada aspek tertentu dari topik ini yang ingin Anda diskusikan lebih jauh?`;
}

export default generateSmartAgentReply;
