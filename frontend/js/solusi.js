/**
 * ==========================================================================
 * NUSABRIDGE - LOGIKA GEMINI AI AGENT OPERATIONAL SUITE
 * File: js/solusi.js
 * Deskripsi: Mesin otomatisasi ekspor UMKM berbasis 4 modul interaktif:
 * 1. AI Sales Assistant & RFQ Studio (Kalkulator Incoterms 2020)
 * 2. Auto-PDF Document Generator (Tool Calling: Proforma Invoice & Sales Contract)
 * 3. KYC Hub & Kepatuhan Global (Audit Legalitas OSS NIB, NPWP, & Regulasi FDA/JAS/EUDR)
 * 4. Escrow Vault & AI Chat Assistant (Simulasi Percakapan 4 Fase Pencairan Dana)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 0. WORKSPACE PERCAKAPAN GEMINI AI AGENT UTAMA (@google/genai)
  // --------------------------------------------------------------------------
  const geminiHistory = document.getElementById('geminiChatHistory');
  const geminiInput = document.getElementById('geminiUserPromptInput');
  const btnSendGemini = document.getElementById('btnSendGeminiPrompt');
  const btnClearHistory = document.getElementById('btnClearChatHistory');
  const scenarioItems = document.querySelectorAll('.btn-scenario-item');
  const chipPrompts = document.querySelectorAll('.btn-chip-prompt');

  const SCENARIO_MAP = {
    hamburg: "Halo NusaBridge AI, saya Hanseatic Importers dari Hamburg, Jerman. Saya bermaksud mengimpor 20 Metric Ton (MT) Kopi Robusta Lampung dari UMKM Indonesia dengan skema pengiriman CIF Hamburg Port. Tolong hitungkan estimasi biayanya, cek verifikasi seller, dan buatkan draf kontrak serta skema pembayarannya.",
    'los-angeles': "Halo NusaBridge AI, kami Pacific Spice dari Los Angeles, USA. Kami ingin membeli 5 MT Cengkeh Lalpari Maluku CIF Los Angeles. Mohon rincian biaya Incoterms 2020 dan verifikasi kepatuhan US FDA.",
    tokyo: "Konnichiwa NusaBridge AI! Kami Tokyo Living Design Co. ingin memesan 2.000 Pcs Kursi Rotan Alami Cirebon skema FOB Tanjung Priok. Berapa estimasi harga dan dokumen kelengkapan V-Legal SVLK?",
    kyc: "Tolong lakukan audit legalitas dan verifikasi kepatuhan ekspor untuk NIB 0120268840001 dan NPWP 01.234.567.8-012.000 untuk tujuan pasar Uni Eropa (regulasi EUDR).",
    escrow: "Bagaimana cara kerja dan rincian alur pencairan dana 4 tahap di Escrow Vault NusaBridge untuk melindungi transaksi ekspor UMKM?"
  };

  /**
   * Pembersih & Pemformat Teks Gemini Alami (Tanpa Tag HTML Rumit)
   * Menampilkan teks percakapan alami, santun, dan bersih persis seperti Google Gemini resmi.
   */
  function formatGeminiText(rawText) {
    if (!rawText) return '';
    let text = String(rawText);

    // 1. Bersihkan semua tag HTML jika ada agar tidak ada tag yang terlihat di layar
    text = text.replace(/<[^>]*>/g, '');

    // 2. Format markdown bold standar: **teks** menjadi <strong>teks</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Rapikan markdown header (### Judul -> <strong>Judul</strong>)
    text = text.replace(/^#{1,6}\s*(.*$)/gm, '<strong>$1</strong>');

    // 4. Rapikan kutipan markdown (> teks -> 💡 teks)
    text = text.replace(/^>\s*/gm, '💡 ');

    // 5. Ubah baris baru menjadi <br>
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    text = text.replace(/\n/g, '<br>');

    return text;
  }

  function appendChatBubble(sender, rawText, headerLabel) {
    if (!geminiHistory) return;
    const isUser = sender === 'user';
    const row = document.createElement('div');
    row.className = `chat-bubble-row ${isUser ? 'user-row' : 'agent-row'}`;

    const formattedTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const renderedContent = formatGeminiText(rawText);

    row.innerHTML = `
      <div class="cbr-avatar">${isUser ? '👤' : '🤖'}</div>
      <div class="cbr-content">
        <div class="cbr-header">
          <span>${headerLabel || (isUser ? 'Anda (Buyer / Eksportir)' : 'NusaBridge Gemini AI Agent')}</span>
          <span>${formattedTime}</span>
        </div>
        <div class="cbr-text">${renderedContent}</div>
      </div>
    `;

    geminiHistory.appendChild(row);
    geminiHistory.scrollTop = geminiHistory.scrollHeight;
  }

  function showTypingIndicator() {
    if (!geminiHistory) return null;
    const typing = document.createElement('div');
    typing.id = 'geminiTypingBubble';
    typing.className = 'chat-bubble-row agent-row';
    typing.innerHTML = `
      <div class="cbr-avatar">🤖</div>
      <div class="cbr-content" style="padding:10px 14px;">
        <div class="typing-indicator">
          <span>Gemini AI Agent sedang mengetik</span>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    geminiHistory.appendChild(typing);
    geminiHistory.scrollTop = geminiHistory.scrollHeight;
    return typing;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('geminiTypingBubble');
    if (el) el.remove();
  }

  /**
   * Helper Pencari Produk Cerdas dari Database 120 Komoditas Ekspor
   */
  function findMatchingProducts(query) {
    const list = window.NUSA_PRODUCTS_DATA || [];
    if (!list.length) return [];
    const qLower = (query || '').toLowerCase().trim();

    // Kata-kata stopword yang diabaikan saat pencarian
    const stopwords = ['dan', 'yang', 'untuk', 'dengan', 'dari', 'bisa', 'tolong', 'halo', 'info', 'harga', 'berapa', 'apakah', 'jual', 'kami', 'saya', 'ekspor', 'mau', 'ingin', 'kirim', 'buatkan', 'spesifikasi', 'spek', 'ada', 'cari', 'tentang', 'produk'];
    const keywords = qLower
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopwords.includes(w));

    if (!keywords.length && qLower.length < 3) return [];

    const scored = list.map(item => {
      let score = 0;
      const name = item.name.toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const origin = (item.origin || '').toLowerCase();
      const desc = (item.desc || '').toLowerCase();

      // Cocok langsung dengan frasa lengkap
      if (name.includes(qLower)) score += 60;
      if (cat.includes(qLower)) score += 30;

      // Cocok per kata kunci
      keywords.forEach(kw => {
        if (name.includes(kw)) score += 15;
        if (cat.includes(kw)) score += 8;
        if (origin.includes(kw)) score += 8;
        if (desc.includes(kw)) score += 3;
      });

      return { item, score };
    }).filter(r => r.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 2).map(r => r.item);
  }

  /**
   * Knowledge Engine Respons Cerdas Berbahasa Alami (Mirip Gemini Resmi - Tanpa Tag Rumit)
   */
  function generateSmartAgentReply(userMessage) {
    const raw = (userMessage || '').trim();
    const q = raw.toLowerCase();

    // Periksa apakah pertanyaan adalah tentang panduan, regulasi, kalkulasi, atau konsep
    const isLegalityOrGuide = (
      q.includes('cara ekspor') || q.includes('bagaimana ekspor') || q.includes('memulai ekspor') || q.includes('langkah ekspor') || q.includes('pemula') ||
      q.includes('incoterm') || q.includes('apa itu') || q.includes('beda fob') || q.includes('perbedaan') ||
      q.includes('legalitas') || q.includes('karantina') || q.includes('fitosanitari') || q.includes('sertifikat') || q.includes('izin') || q.includes('syarat') ||
      q.includes('escrow') || q.includes('bayar') || q.includes('pembayaran') || q.includes('keamanan') ||
      q.includes('dokumen') || q.includes('surat ekspor') || q.includes('berkas') ||
      q.includes('hamburg') || q.includes('los angeles') || q.includes('tokyo') || q.includes('hitung') || q.includes('kalkulasi')
    );

    // 1. Pencarian Produk Langsung dari Katalog 120 Komoditas
    const matchedProducts = findMatchingProducts(raw);
    const isAskingProduct = (
      q.includes('harga') || q.includes('produk') || q.includes('kopi') || q.includes('rempah') ||
      q.includes('cengkeh') || q.includes('kayu') || q.includes('rotan') || q.includes('batik') ||
      q.includes('tenun') || q.includes('songket') || q.includes('ulos') || q.includes('vanila') ||
      q.includes('lada') || q.includes('pala') || q.includes('nilam') || q.includes('atsiri') ||
      q.includes('kapulaga') || q.includes('jahe') || q.includes('kunyit') || q.includes('gayo') ||
      q.includes('toraja') || q.includes('mandheling') || q.includes('lampung') || q.includes('dampit') ||
      q.includes('kintamani') || q.includes('bajawa') || q.includes('wamena') || q.includes('spek') ||
      q.includes('spesifikasi') || q.includes('moq') || q.includes('minimal order') || q.includes('jual')
    );

    if (!isLegalityOrGuide && matchedProducts.length > 0 && isAskingProduct) {
      const p = matchedProducts[0];
      const idrEst = Math.round(p.price * 16250).toLocaleString('id-ID');
      const specsText = Array.isArray(p.specs) ? p.specs.map(s => `${s.k}: ${s.v}`).join(' | ') : 'Standar Ekspor';
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

💡 **Langkah Selanjutnya**:
Apakah Anda ingin saya buatkan kalkulasi estimasi pengiriman (Incoterms FOB atau CIF), rincian ocean freight, asuransi, dan margin aman untuk produk ini? Cukup sebutkan jumlah kuantitas dan negara/pelabuhan tujuannya!`;
    }

    // 2. Rute Ekspor Khusus: Hamburg / Jerman / Uni Eropa (Kopi Robusta/Arabika)
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

    // 3. Rute Ekspor Khusus: Los Angeles / USA (Cengkeh Lalpari / Rempah / Kopi)
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

    // 4. Rute Ekspor Khusus: Tokyo / Jepang (Kursi Rotan / Kriya / Kayu Jati)
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

    // 5. Perhitungan Biaya Umum / Kalkulator Incoterms
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

    // 6. Penjelasan Konsep Incoterms 2020 (FOB, CIF, CFR, EXW)
    if (q.includes('incoterm') || q.includes('fob') || q.includes('cif') || q.includes('cfr') || q.includes('exw') || q.includes('ddp') || q.includes('beda fob')) {
      return `Halo! Incoterms 2020 adalah aturan resmi dari ICC (International Chamber of Commerce) yang mengatur pembagian biaya, risiko, dan tanggung jawab antara penjual (eksportir) dan pembeli (buyer luar negeri).

Berikut penjelasan skema yang paling sering digunakan:

• **FOB (Free on Board - Pelabuhan Indonesia)**
Tanggung jawab Anda selesai setelah barang termuat di atas kapal di pelabuhan muat Indonesia (misal: Tanjung Priok atau Tanjung Perak). Ongkos kapal laut internasional dan asuransi kargo ditanggung penuh oleh pembeli. Skema ini sangat direkomendasikan untuk eksportir pemula karena minim risiko fluktuasi biaya kapal!

• **CIF (Cost, Insurance, and Freight - Pelabuhan Tujuan Buyer)**
Anda menanggung harga barang, ongkos kapal laut internasional, dan premi asuransi hingga kapal tiba di pelabuhan tujuan pembeli (misal: Hamburg, Tokyo, atau Los Angeles). Namun peralihan risiko kerusakan barang tetap beralih ke pembeli begitu barang termuat di kapal di Indonesia.

• **CFR (Cost and Freight)**
Mirip dengan skema CIF, tetapi tanpa asuransi. Biaya asuransi diurus dan ditanggung oleh pembeli sendiri.

• **EXW (Ex Works - Gudang Penjual)**
Pembeli mengambil barang langsung di pintu pabrik atau gudang Anda. Seluruh biaya pengangkutan lokal, perizinan ekspor, dan kapal ditanggung pembeli.

Saran terbaik bagi UMKM adalah menawarkan skema FOB terlebih dahulu, atau CIF jika pembeli meminta penawaran lengkap terima di pelabuhan tujuan.`;
    }

    // 7. Legalitas, NIB OSS, NPWP, dan Kepatuhan Karantina
    if (q.includes('legalitas') || q.includes('nib') || q.includes('npwp') || q.includes('oss') || q.includes('izin') || q.includes('syarat') || q.includes('karantina') || q.includes('fitosanitari') || q.includes('phytosanitary') || q.includes('fda') || q.includes('eudr') || q.includes('jas') || q.includes('svlk')) {
      return `Halo! Memiliki legalitas yang lengkap adalah kunci utama agar komoditas ekspor Anda tidak tertahan di Bea Cukai maupun pelabuhan negara tujuan.

Berikut adalah persyaratan legalitas pokok untuk ekspor:

• **NIB (Nomor Induk Berusaha) 13 Digit OSS RBA**
Saat ini NIB berbasis risiko otomatis berfungsi sebagai identitas berusaha, Hak Akses Kepabeanan di Ditjen Bea Cukai, serta Angka Pengenal Eksportir/Importir (API).

• **NPWP Usaha Aktif**
NPWP badan usaha (PT, CV, Koperasi) atau perorangan yang telah berstatus valid di Direktorat Jenderal Pajak.

• **Sertifikat Fitosanitari (Phytosanitary Certificate)**
Wajib untuk seluruh komoditas hasil perkebunan, pertanian, kopi, dan rempah. Diterbitkan oleh Badan Karantina Indonesia setelah melalui uji laboratorium untuk memastikan bebas dari organisme pengganggu tumbuhan.

• **Sertifikasi Khusus Komoditas & Negara Tujuan**:
- **Produk Kayu & Rotan**: Wajib memiliki dokumen sertifikasi kelestarian V-Legal SVLK dari Kemenhut.
- **Tujuan Amerika Serikat**: Wajib mendaftarkan fasilitas produksi ke US FDA (Food Facility Registration).
- **Tujuan Uni Eropa**: Wajib mematuhi regulasi bebas deforestasi EUDR dilengkapi koordinat lokasi kebun.
- **Tujuan Jepang**: Memenuhi standar batas residu pestisida JAS (Japanese Agricultural Standards).

Anda dapat menguji validitas NIB usaha Anda pada tab menu KYC Hub di bawah untuk mendapatkan badge Verified Global Exporter.`;
    }

    // 8. Escrow Vault & Keamanan Pembayaran
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

    // 9. Dokumen Pokok Ekspor Resmi
    if (q.includes('dokumen') || q.includes('surat') || q.includes('invoice') || q.includes('sales contract') || q.includes('peb') || q.includes('packing list') || q.includes('bill of lading') || q.includes('bl') || q.includes('coo') || q.includes('ska')) {
      return `Halo! Dalam perdagangan internasional, dokumen resmi adalah bukti legalitas kepemilikan dan dasar penagihan pembayaran. Berikut 6 dokumen pokok ekspor:

1. **Proforma Invoice**: Penawaran harga resmi di awal yang memuat kuantitas, harga per unit, spesifikasi produk, dan termin pembayaran.
2. **Sales Contract (Kontrak Penjualan)**: Perjanjian jual-beli yang mengikat hak dan kewajiban hukum antara eksportir dan buyer.
3. **Commercial Invoice**: Faktur tagihan resmi yang digunakan untuk proses kepabeanan (clearance) serta dasar penghitungan bea masuk di negara tujuan.
4. **Packing List**: Rincian fisik muatan seperti jenis kemasan, jumlah koli/karung, berat bersih (net weight), berat kotor (gross weight), dan volume CBM.
5. **PEB (Pemberitahuan Ekspor Barang)**: Dokumen pemberitahuan kepabeanan ke Kantor Bea Cukai untuk memperoleh Nota Pelayanan Ekspor (NPE).
6. **Bill of Lading (B/L)**: Bukti tanda terima muatan dan surat kepemilikan barang yang diterbitkan oleh perusahaan pelayaran pengangkut.

Di NusaBridge, Anda dapat menerbitkan draf Proforma Invoice dan Sales Contract berstandar ICC secara otomatis berformat PDF pada fitur Auto-PDF Generator!`;
    }

    // 10. Panduan Langkah Ekspor untuk Pemula
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

    // 11. Informasi Katalog 120 Komoditas Ekspor
    if (q.includes('katalog') || q.includes('daftar komoditas') || q.includes('daftar produk') || q.includes('apa saja yang dijual') || q.includes('pilihan komoditas')) {
      return `Halo! NusaBridge menyediakan etalase kurasi 120 komoditas ekspor unggulan Indonesia yang telah lolos verifikasi standar mutu dan legalitas:

• ☕ **Kopi Ekspor Unggulan (30 Produk)**:
Kopi Arabika & Robusta Specialty pilihan (Gayo Aceh, Toraja Sapan, Mandheling, Robusta Lampung ELB, Dampit Malang, Kintamani Bali, Bajawa Flores, Wamena Papua, dll.) dengan opsi Green Beans mentah maupun Roasted Beans.

• 🌿 **Rempah-Rempah & Hasil Alam (30 Produk)**:
Cengkeh Lalpari Maluku Grade AA, Kayu Manis Korintji Cassia Vera, Lada Putih Muntok Double Washed, Vanila Gourmet Papua, Pala Banda ABCD, Kapulaga Putih Super, dan Minyak Atsiri Nilam Aceh.

• 🪵 **Kriya & Kerajinan Ramah Lingkungan (30 Produk)**:
Kursi & Furnitur Anyaman Rotan Cirebon, Mebel Kayu Jati SVLK Jepara, Kerajinan Anyaman Enceng Gondok, Mangkuk Batok Kelapa Eco-Polished, dan Keranjang Seagrass.

• 🧵 **Tekstil & Wastra Nusantara (30 Produk)**:
Kain Batik Tulis Sutra Solo/Yogya Motif Keraton, Batik Cap Pekalongan Katun Primisima, Tenun Ikat Troso Jepara, Tenun Sumba Pewarna Alami, Songket Palembang Benang Emas, dan Ulos Batak Tradisional.

Anda dapat menanyakan harga atau spesifikasi komoditas mana pun secara spesifik, dan saya akan memberikan informasi lengkapnya!`;
    }

    // 12. Sapaan Ramah & Percakapan Kasual
    if (q.includes('halo') || q.includes('hai') || q.includes('selamat pagi') || q.includes('selamat siang') || q.includes('selamat malam') || q.includes('assalamualaikum') || q === 'hi' || q === 'hello') {
      return `Halo! Selamat datang di NusaBridge Gemini AI. Saya adalah asisten pintar perdagangan ekspor-impor untuk UMKM Indonesia.

Ada yang bisa saya bantu hari ini? Anda dapat menanyakan seputar:
• Informasi harga, spesifikasi, dan MOQ dari 120 komoditas ekspor Indonesia.
• Perhitungan kalkulasi Incoterms (FOB / CIF), ocean freight, dan proteksi margin aman.
• Pengecekan syarat perizinan dan kepatuhan global (NIB OSS, Karantina, FDA, EUDR, JAS).
• Panduan transaksi aman dengan sistem Escrow Vault 4 tahap.

Silakan ketik pertanyaan Anda secara bebas!`;
    }

    if (q.includes('terima kasih') || q.includes('makasih') || q.includes('thanks') || q.includes('ok') || q.includes('oke') || q.includes('siap')) {
      return `Sama-sama! Senang bisa membantu Anda. Jika ada pertanyaan lain seputar ekspor komoditas, perhitungan biaya pengiriman, atau pembuatan dokumen perdagangan, silakan ketik kapan saja. Sukses selalu untuk perdagangan ekspor UMKM Indonesia!`;
    }

    // 13. Respons Analitis Kontekstual Bebas (Tidak Ngawur)
    return `Halo! Mengenai pertanyaan Anda tentang "${raw}":

Dalam praktik perdagangan ekspor-impor UMKM bersama NusaBridge:
• **Analisis Operasional**: Setiap transaksi ekspor memerlukan kesesuaian antara spesifikasi komoditas, perhitungan biaya pengiriman (Incoterms 2020), dan pemenuhan syarat regulasi di negara pembeli.
• **Perhitungan Biaya**: Kami menyarankan Anda menyusun penawaran dengan memperhitungkan harga pokok barang, biaya penanganan lokal ke pelabuhan, ongkos kapal laut internasional, serta margin laba bersih minimal 15-20%.
• **Kepastian Hukum & Finansial**: Seluruh kesepakatan sebaiknya dituangkan dalam Sales Contract resmi berformat PDF dan dilindungi dengan skema pembayaran bertahap di Escrow Vault (30% DP, 30% PEB, 20% Bill of Lading, 20% Tiba).

Apakah Anda ingin saya hitungkan estimasi biaya untuk produk tertentu atau membuatkan draf dokumen penawarannya? Silakan sebutkan nama komoditas, jumlah kuantitas, dan negara tujuannya!`;
  }

  async function processGeminiQuery(userMessage) {
    if (!userMessage || !userMessage.trim()) return;
    const promptText = userMessage.trim();
    appendChatBubble('user', promptText);
    if (geminiInput) {
      geminiInput.value = '';
      geminiInput.style.height = 'auto';
    }

    showTypingIndicator();

    // 1. Coba panggil Backend Server API (jika server aktif)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          removeTypingIndicator();
          appendChatBubble('agent', data.reply, 'NusaBridge Gemini AI');
          return;
        }
      }
    } catch (e) {
      // Backend offline, lanjutkan ke knowledge engine pintar bawaan
    }

    // 2. Fallback ke Knowledge Engine Cerdas
    setTimeout(() => {
      removeTypingIndicator();
      const reply = generateSmartAgentReply(promptText);
      appendChatBubble('agent', reply, 'NusaBridge Gemini AI');
    }, 450);
  }

  // Event Listener Pengiriman Chat
  if (btnSendGemini) {
    btnSendGemini.addEventListener('click', () => {
      processGeminiQuery(geminiInput?.value);
    });
  }

  if (geminiInput) {
    geminiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processGeminiQuery(geminiInput.value);
      }
    });

    // Auto resize textarea
    geminiInput.addEventListener('input', () => {
      geminiInput.style.height = 'auto';
      geminiInput.style.height = Math.min(geminiInput.scrollHeight, 120) + 'px';
    });
  }

  // Bersihkan Chat
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (geminiHistory) {
        geminiHistory.innerHTML = '';
        renderInitialAgentGreeting();
      }
    });
  }

  function renderInitialAgentGreeting() {
    appendChatBubble('agent', `Halo! Saya NusaBridge Gemini AI, asisten perdagangan ekspor-impor pintar untuk UMKM Indonesia.

Saya siap membantu Anda dalam:
• Mengecek harga, spesifikasi, dan MOQ dari 120 komoditas ekspor unggulan (Kopi, Rempah, Kriya, Tekstil).
• Menghitung estimasi biaya pengiriman, ocean freight kapal, asuransi, dan penawaran CIF/FOB dengan margin aman.
• Memberikan panduan kepatuhan dan audit perizinan negara tujuan (NIB OSS, Sertifikat Karantina, US FDA, EUDR Eropa, JAS Jepang).
• Menjelaskan skema pembayaran bertahap 4 fase via Escrow Vault agar transaksi Anda aman dari risiko penipuan.

Silakan ketik pertanyaan atau konsultasi ekspor Anda di bawah!`, 'NusaBridge Gemini AI');
  }

  // Tampilkan sambutan awal saat pertama load
  renderInitialAgentGreeting();

  // --------------------------------------------------------------------------
  // 1. SISTEM NAVIGASI TAB MODUL
  // --------------------------------------------------------------------------
  const tabButtons = document.querySelectorAll('.ai-tab-btn');
  const tabPanes = document.querySelectorAll('.ai-tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // --------------------------------------------------------------------------
  // 2. MODUL 1: AI SALES ASSISTANT & RFQ STUDIO (INCOTERMS 2020)
  // --------------------------------------------------------------------------
  const rfqInput = document.getElementById('rfqBuyerRawInput');
  const btnConvertRFQ = document.getElementById('btnConvertRFQ');
  const rfqResultGrid = document.getElementById('rfqResultGrid');
  const sampleButtons = document.querySelectorAll('.rfq-sample-btn');

  const SAMPLE_BUYER_TEXTS = {
    kopi: "Looking for 20 MT Robusta green beans CIF Hamburg port, packaging 60kg gunny bags, delivery schedule November 2026.",
    rempah: "Need 5 MT Clove Lalpari CIF Los Angeles port, FDA approved required, shipment from Indonesia.",
    kriya: "RFQ for 2,000 pcs Handwoven Rattan Chairs FOB Tanjung Priok to Tokyo port, ISPM 15 fumigation standard."
  };

  sampleButtons.forEach(b => {
    b.addEventListener('click', () => {
      const type = b.getAttribute('data-sample');
      if (SAMPLE_BUYER_TEXTS[type] && rfqInput) {
        rfqInput.value = SAMPLE_BUYER_TEXTS[type];
        parseAndRenderRFQ();
      }
    });
  });

  function parseAndRenderRFQ() {
    if (!rfqResultGrid) return;
    const text = (rfqInput?.value || '').toLowerCase();

    let commodity = 'Kopi Robusta Lampung Grade 1';
    let hsCode = '0901.11.10';
    let pol = 'Pelabuhan Tanjung Priok, Jakarta';
    let pod = 'Port of Hamburg, Germany';
    let incoterm = 'CIF Hamburg (Incoterms 2020)';
    let qty = '20,000 Kg (20 MT)';
    let fobPrice = 3.85;
    let freightInsurance = 0.42;

    if (text.includes('clove') || text.includes('cengkeh') || text.includes('los angeles')) {
      commodity = 'Cengkeh Lalpari Maluku Super';
      hsCode = '0907.10.00';
      pol = 'Pelabuhan Tanjung Perak, Surabaya';
      pod = 'Port of Los Angeles, USA';
      incoterm = 'CIF Los Angeles (Incoterms 2020)';
      qty = '5,000 Kg (5 MT)';
      fobPrice = 12.50;
      freightInsurance = 1.15;
    } else if (text.includes('rattan') || text.includes('rotan') || text.includes('tokyo')) {
      commodity = 'Kursi Rotan Alami Cirebon';
      hsCode = '9401.52.00';
      pol = 'Pelabuhan Tanjung Priok, Jakarta';
      pod = 'Tokyo Port, Japan';
      incoterm = 'FOB Tanjung Priok (Incoterms 2020)';
      qty = '2,000 Pcs (2 x 40ft High Cube)';
      fobPrice = 78.00;
      freightInsurance = 0.00;
    }

    const marginPct = 18.5;
    const baseProductionCost = (fobPrice * 0.72).toFixed(2);
    const truckingPortCost = (fobPrice * 0.095).toFixed(2);
    const netProfitMargin = (fobPrice * (marginPct / 100)).toFixed(2);
    const finalUnitPrice = (fobPrice + freightInsurance).toFixed(2);
    const totalContractVal = (parseFloat(finalUnitPrice) * (parseInt(qty.replace(/[^0-9]/g, '')) || 20000)).toLocaleString('en-US');

    rfqResultGrid.innerHTML = `
      <div class="sop-col">
        <h5>1. Ekstraksi Entitas &amp; Parameter RFQ</h5>
        <div class="sop-val-big" style="font-size:1.15rem; color:#60a5fa;">${commodity}</div>
        <p class="sop-desc"><strong>Volume / Satuan:</strong> ${qty}</p>
        <p class="sop-desc"><strong>Pelabuhan Muat (POL):</strong> ${pol}</p>
        <p class="sop-desc"><strong>Pelabuhan Bongkar (POD):</strong> ${pod}</p>
        <div class="sop-badge green">✓ Incoterms Terdeteksi: ${incoterm}</div>
      </div>

      <div class="sop-col">
        <h5>2. Rincian Struktur Biaya Ekspor (Per Satuan)</h5>
        <div class="sop-highlight-box">
          <div class="shb-row"><span>Biaya Produksi &amp; Kemasan:</span> <strong>USD ${baseProductionCost}</strong></div>
          <div class="shb-row"><span>Trucking &amp; Port Handling:</span> <strong>USD ${truckingPortCost}</strong></div>
          <div class="shb-row"><span>Ocean Freight &amp; Asuransi:</span> <strong>USD ${freightInsurance.toFixed(2)}</strong></div>
          <div class="shb-row" style="border-top:1px dashed rgba(255,255,255,0.2); padding-top:4px;">
            <span style="color:#34d399;">Margin Aman UMKM (+${marginPct}%):</span> 
            <strong style="color:#34d399;">+USD ${netProfitMargin}</strong>
          </div>
        </div>
      </div>

      <div class="sop-col">
        <h5>3. Rekomendasi Kuotasi &amp; Nilai Kontrak</h5>
        <div class="sop-highlight-box" style="background:rgba(16,185,129,0.12); border-color:#10b981;">
          <div class="shb-row"><span>Harga Penawaran Final:</span> <strong style="font-size:1.25rem; color:#34d399;">USD ${finalUnitPrice}</strong></div>
          <div class="shb-row"><span>Estimasi Nilai Kontrak:</span> <strong style="color:#ffffff;">USD ${totalContractVal}</strong></div>
          <div class="shb-row"><span>Rekomendasi HS Code:</span> <code>${hsCode}</code></div>
        </div>
        <button class="btn btn-primary btn-sm btn-block" id="btnForwardToDocGen" type="button">
          Terbitkan Proforma Invoice Otomatis ➔
        </button>
      </div>
    `;

    document.getElementById('btnForwardToDocGen')?.addEventListener('click', () => {
      const pdfTabBtn = document.querySelector('[data-tab="tab-pdf"]');
      if (pdfTabBtn) pdfTabBtn.click();
    });
  }

  if (btnConvertRFQ) {
    btnConvertRFQ.addEventListener('click', () => {
      btnConvertRFQ.innerHTML = '<span>🤖 Gemini AI Memproses Incoterms 2020...</span>';
      setTimeout(() => {
        parseAndRenderRFQ();
        btnConvertRFQ.innerHTML = '<span>⚡ Konversi Pesan Buyer Menjadi RFQ Resmi (Incoterms 2020)</span>';
      }, 400);
    });
  }

  // --------------------------------------------------------------------------
  // 3. MODUL 2: AUTO-PDF DOCUMENT GENERATOR (TOOL CALLING)
  // --------------------------------------------------------------------------
  const docTypeButtons = document.querySelectorAll('.doc-type-btn');
  const docPaperSheet = document.getElementById('docPaperSheet');
  const btnPrintPdfDoc = document.getElementById('btnPrintPdfDoc');
  const btnCopyDocText = document.getElementById('btnCopyDocText');

  let currentDocType = 'pi';

  function renderDocumentSheet(type) {
    currentDocType = type;
    docTypeButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-doctype') === type));

    if (!docPaperSheet) return;

    if (type === 'pi') {
      docPaperSheet.innerHTML = `
        <div class="dps-header">
          <div class="dps-brand">
            <strong>NUSABRIDGE EXPORT TRADE FACILITATION ENGINE</strong>
            <p>Integrated Global Trade &amp; Automated Customs Documentation Platform</p>
          </div>
          <div class="dps-meta">
            <h4>PROFORMA INVOICE</h4>
            <div style="font-size:11.5px; color:#64748b;">Invoice No: <strong>#PI-2026-DE-088</strong></div>
            <div style="font-size:11.5px; color:#64748b;">Date: <strong>19 Oktober 2026</strong></div>
          </div>
        </div>

        <div class="dps-parties-grid">
          <div>
            <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">Seller / Exporter:</strong>
            <p style="margin:4px 0 0; font-size:12px; color:#334155;">
              <strong>CV Kopi Nusantara Bersama</strong><br>
              NIB: 0120268840001 &bull; NPWP: 01.234.567.8-012.000<br>
              Takengon, Aceh Tengah, Indonesia<br>
              Escrow Vault ID: <code>NB-ESC-USD-99214</code>
            </p>
          </div>
          <div>
            <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">Consignee / Buyer:</strong>
            <p style="margin:4px 0 0; font-size:12px; color:#334155;">
              <strong>Hanseatic Coffee Importers GmbH</strong><br>
              Am Sandtorkai 48, 20457 Hamburg, Germany<br>
              EORI: DE882194125 &bull; VAT: DE11893240<br>
              Bank: Deutsche Bank AG Hamburg
            </p>
          </div>
        </div>

        <div style="margin-bottom:12px; display:flex; gap:20px; font-size:12px; color:#475569;">
          <span>Port of Loading: <strong>Belawan Port, Medan (IDBLW)</strong></span>
          <span>Port of Discharge: <strong>Port of Hamburg, Germany (DEHAM)</strong></span>
          <span>Terms: <strong>CIF Hamburg (Incoterms 2020)</strong></span>
        </div>

        <table class="dps-table">
          <thead>
            <tr>
              <th>Item &amp; Description</th>
              <th>HS Code</th>
              <th>Qty (Kg)</th>
              <th>Unit Price (USD)</th>
              <th>Total Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Kopi Arabika Gayo Specialty Grade 1</strong><br>
                <small style="color:#64748b;">Moisture &lt;12%, Defect &lt;4%, Screen 16/18, Gunny Bags 60Kg</small>
              </td>
              <td>0901.11.10</td>
              <td>20,000</td>
              <td>$4.27</td>
              <td><strong>$85,400.00</strong></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th colspan="4" style="text-align:right;">Subtotal FOB Belawan:</th>
              <td>$77,000.00</td>
            </tr>
            <tr>
              <th colspan="4" style="text-align:right;">Ocean Freight &amp; Marine Cargo Insurance (CIF):</th>
              <td>$8,400.00</td>
            </tr>
            <tr>
              <th colspan="4" style="text-align:right; font-size:13px; color:#0f172a;">GRAND TOTAL (CIF HAMBURG):</th>
              <td style="font-size:13px; font-weight:800; color:#059669;">USD $85,400.00</td>
            </tr>
          </tfoot>
        </table>

        <div style="background:#f1f5f9; padding:10px 14px; border-radius:6px; font-size:11.5px; color:#334155; margin-bottom:14px;">
          <strong>Payment Terms via Escrow Vault:</strong> 30% Advance Down Payment upon Confirmation, 30% against PEB Customs Clearance, 20% upon Clean Bill of Lading, 20% Balance upon Port of Hamburg Arrival.
        </div>

        <div class="dps-footer-seal">
          <div>
            <span class="seal-stamp">✓ VERIFIED BY NUSABRIDGE AI TOOL CALLING</span>
            <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Digital Signature Hash: <code>e8b4...92c1</code></div>
          </div>
          <div style="text-align:right; font-size:11px; color:#64748b;">
            Authorized Signatory &amp; Stamp<br>
            <strong style="color:#0f172a;">NusaBridge AI Trade Settlement Network</strong>
          </div>
        </div>
      `;
    } else {
      docPaperSheet.innerHTML = `
        <div class="dps-header">
          <div class="dps-brand">
            <strong>INTERNATIONAL CHAMBER OF COMMERCE (ICC) MODEL</strong>
            <p>International Export Sales Contract &bull; Governed by CISG &amp; Incoterms 2020</p>
          </div>
          <div class="dps-meta">
            <h4>EXPORT SALES CONTRACT</h4>
            <div style="font-size:11.5px; color:#64748b;">Contract No: <strong>#SC-2026-US-104</strong></div>
            <div style="font-size:11.5px; color:#64748b;">Jurisdiction: <strong>Singapore International Arbitration (SIAC)</strong></div>
          </div>
        </div>

        <div class="dps-parties-grid">
          <div>
            <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">The Seller:</strong>
            <p style="margin:4px 0 0; font-size:12px; color:#334155;">
              <strong>Koperasi Rempah Organik Maluku</strong><br>
              Ambon, Maluku, Republic of Indonesia<br>
              Exporter ID: <code>EXP-NUSA-2026-081</code>
            </p>
          </div>
          <div>
            <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">The Buyer:</strong>
            <p style="margin:4px 0 0; font-size:12px; color:#334155;">
              <strong>Pacific Spice &amp; Botanical Co.</strong><br>
              Long Beach, California, United States of America<br>
              US FDA Reg: <code>18820499120</code>
            </p>
          </div>
        </div>

        <div style="font-size:12px; color:#334155; margin-bottom:14px; line-height:1.6;">
          <strong>Clause 1 (Commodity &amp; Specs):</strong> 5,000 Kg Clove Lalpari Handpicked Clean, Moisture &lt;11.5%, Volatile Oil &gt;19%, ASTA Cleanliness Standard.<br>
          <strong>Clause 2 (Price &amp; Term):</strong> CIF Los Angeles Port at USD $13.65 / Kg, Total Contract Value USD $68,250.00.<br>
          <strong>Clause 3 (Inspection):</strong> Phytosanitary Certificate issued by Indonesian Agricultural Quarantine Agency &amp; Lab CoA by Sucofindo.<br>
          <strong>Clause 4 (Smart Escrow Settlement):</strong> All payments are secured within NusaBridge Escrow Vault in USD currency with automated milestone release rules.
        </div>

        <div class="dps-footer-seal">
          <div>
            <span class="seal-stamp" style="border-color:#2563eb; color:#2563eb;">⚖️ LEGALLY BINDING DIGITAL CONTRACT</span>
            <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Electronic Identification &amp; Trust Services (eIDAS) Compliant</div>
          </div>
          <div style="text-align:right; font-size:11px; color:#64748b;">
            Countersigned Digitally by Both Parties<br>
            <strong style="color:#0f172a;">Valid &amp; Enforceable Globally</strong>
          </div>
        </div>
      `;
    }
  }

  docTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      renderDocumentSheet(btn.getAttribute('data-doctype'));
    });
  });

  if (btnPrintPdfDoc) {
    btnPrintPdfDoc.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnCopyDocText) {
    btnCopyDocText.addEventListener('click', () => {
      if (docPaperSheet) {
        navigator.clipboard.writeText(docPaperSheet.innerText).then(() => {
          alert('Teks draf dokumen ekspor resmi berhasil disalin ke clipboard!');
        });
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. MODUL 3: KYC HUB & KEPATUHAN GLOBAL (NIB/NPWP & FDA/JAS/EUDR)
  // --------------------------------------------------------------------------
  const btnRunKycAudit = document.getElementById('btnRunKycAudit');
  const kycResultCard = document.getElementById('kycResultCard');
  const kycTargetCountry = document.getElementById('kycTargetCountry');

  const KYC_REGULATION_KNOWLEDGE = {
    usa: {
      standard: "FDA (Food and Drug Administration) & Bioterrorism Act",
      items: [
        "Registrasi Fasilitas Pangan (FFR) pada US FDA Database: Terverifikasi",
        "Kewajiban Pengisian FDA Prior Notice sebelum Kapal Sandar: Aktif",
        "Standar Kebersihan ASTA & Pengujian Mikotoksin Bebas Kontaminan: Lolos Uji Lab",
        "Kepatuhan US Foreign Supplier Verification Program (FSVP): Siap Terbit"
      ]
    },
    jepang: {
      standard: "JAS (Japanese Agricultural Standard) & MHLW Food Sanitation",
      items: [
        "Sertifikasi Standar Organik JAS Pertanian Jepang: Terdaftar Terverifikasi",
        "Pemeriksaan Positive List System (Batas Maksimum Residu Pestisida MHLW): 100% Lolos",
        "Certificate of Origin (COO Form IJEPA Indonesia-Japan Economic Partnership): Aktif",
        "Inspeksi Bebas Serangga Hidup Badan Karantina Tumbuhan: Lolos Sertifikasi"
      ]
    },
    jerman: {
      standard: "EUDR (European Union Deforestation Regulation) & GSP+",
      items: [
        "Geolocation Tagging Koordinat Kebun Bebas Deforestasi Pasca-2020: Terpetakan GIS",
        "Due Diligence Statement (DDS) TRACES NT Komisi Eropa: Siap Diterbitkan",
        "Uji Laboratorium Bebas Logam Berat & Pestisida Terlarang Uni Eropa: Lolos",
        "COO Form A / REX System untuk Pembebasan Bea Masuk (0% Duty): Memenuhi Syarat"
      ]
    },
    uea: {
      standard: "Sertifikasi Halal BPJPH & Akreditasi ESMA UAE",
      items: [
        "Sertifikat Halal Resmi BPJPH Indonesia (Mutual Recognition Agreement UAE): Aktif",
        "Kepatuhan Standar Kemasan Pangan Higienis Gulf Standards (GSO): Terpenuhi",
        "Dokumen COO Skema Perjanjian Perdagangan IUAE-CEPA (0% Tarif): Terbit Otomatis",
        "Legalitas Asosiasi Eksportir Kemenkumham: Valid & Terdaftar"
      ]
    }
  };

  function renderKycResult() {
    if (!kycResultCard) return;
    const country = kycTargetCountry?.value || 'usa';
    const reg = KYC_REGULATION_KNOWLEDGE[country] || KYC_REGULATION_KNOWLEDGE.usa;
    const nib = document.getElementById('kycNibInput')?.value || '0120268840001';
    const npwp = document.getElementById('kycNpwpInput')?.value || '01.234.567.8-012.000';

    kycResultCard.innerHTML = `
      <div class="krc-header">
        <div>
          <strong style="color:#0f172a; font-size:14px;">Hasil Audit Legalitas &amp; Standar Mutu</strong>
          <div style="font-size:11px; color:#64748b;">Standar Regulasi: <strong>${reg.standard}</strong></div>
        </div>
        <span class="krc-score">100% LOLOS</span>
      </div>

      <div style="margin-bottom:12px;">
        <div class="krc-item">
          <span class="krc-icon">✓</span>
          <div>
            <strong>NIB Pelaku Usaha (${nib}):</strong>
            <p style="margin:2px 0 0; font-size:11.5px; color:#334155;">Status OSS Aktif &bull; Hak Akses Kepabeanan Ekspor Terbuka &bull; Skala Usaha Terverifikasi</p>
          </div>
        </div>
        <div class="krc-item">
          <span class="krc-icon">✓</span>
          <div>
            <strong>NPWP Perusahaan (${npwp}):</strong>
            <p style="margin:2px 0 0; font-size:11.5px; color:#334155;">Status Pajak Valid DJP Kemenkeu &bull; Bebas Tunggakan Kepabeanan</p>
          </div>
        </div>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:14px;">
        <strong style="font-size:12px; color:#0f172a; display:block; margin-bottom:8px;">Deteksi Regulasi Negara Tujuan:</strong>
        ${reg.items.map(item => `
          <div class="krc-item" style="margin-bottom:6px;">
            <span class="krc-icon" style="color:#059669;">●</span>
            <span style="font-size:11.5px; color:#334155;">${item}</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; background:#ecfdf5; padding:10px 14px; border-radius:6px; border:1px solid #a7f3d0;">
        <span style="font-size:12px; font-weight:700; color:#065f46;">🛡️ Verified Global Exporter Shield Diterbitkan</span>
        <span style="font-size:11px; color:#059669; font-weight:800;">SIAP EKSPOR</span>
      </div>
    `;
  }

  if (btnRunKycAudit) {
    btnRunKycAudit.addEventListener('click', () => {
      btnRunKycAudit.innerHTML = '<span>🤖 Mengaudit Database OSS &amp; Bea Cukai...</span>';
      setTimeout(() => {
        renderKycResult();
        btnRunKycAudit.innerHTML = '<span>🔍 Jalankan Audit Kepatuhan Regulasi Global</span>';
      }, 350);
    });
  }

  // --------------------------------------------------------------------------
  // 5. MODUL 4: ESCROW VAULT & AI CHAT ASSISTANT (4 FASE NOTIFIKASI)
  // --------------------------------------------------------------------------
  const phaseButtons = document.querySelectorAll('.escrow-btn-phase');
  const chatMessages = document.getElementById('escrowChatMessages');
  const chatInput = document.getElementById('escrowChatInput');
  const btnSendChat = document.getElementById('btnSendEscrowChat');
  const totalVaultStatus = document.getElementById('escrowTotalVaultStatus');

  const PHASE_NOTIFICATIONS = {
    1: {
      tag: "Fase 1 (30% DP Cair)",
      title: "Kontrak Disepakati & Dana Escrow Terkunci",
      amount: "USD 6,000",
      pct: "30%",
      msg: "Kabar gembira! Buyer Hanseatic Coffee Importers GmbH telah menyetujui Sales Contract #SC-2026-DE-088 dan mengunci 100% total dana kontrak (USD 20,000) di NusaBridge Escrow Vault. Sesuai Smart Contract Fase 1, dana uang muka 30% sebesar USD 6,000 telah dilepaskan ke rekening modal kerja UMKM Anda.",
      hash: "0x7a89b...3c14f"
    },
    2: {
      tag: "Fase 2 (30% PEB Cair)",
      title: "Pemberitahuan Ekspor Barang (PEB) Terbit",
      amount: "USD 6,000",
      pct: "60%",
      msg: "Verifikasi Otomatis Kepabeanan Berhasil! Dokumen PEB (Pemberitahuan Ekspor Barang) dan Nota Pelayanan Ekspor (NPE) nomor 088219/KPU.01/2026 telah terkonfirmasi valid oleh sistem Bea Cukai. Sesuai kesepakatan Fase 2, dana sebesar USD 6,000 (akumulasi 60%) telah dicairkan ke rekening Anda.",
      hash: "0x3f12a...9b42e"
    },
    3: {
      tag: "Fase 3 (20% B/L Cair)",
      title: "Kapal Berlayar & Bill of Lading On-Board",
      amount: "USD 4,000",
      pct: "80%",
      msg: "Telemetri Maritim AIS Terverifikasi! Peti kemas kargo Anda telah dimuat di atas kapal MV Meratus Flores dan Bill of Lading (B/L) resmi Clean On Board nomor MEDN-HAM-9921 telah diterbitkan pihak pelayaran. Sesuai Fase 3, dana tambahan USD 4,000 (total 80%) telah berhasil ditransfer.",
      hash: "0x9c41d...6e77a"
    },
    4: {
      tag: "Fase 4 (20% Final Tuntas)",
      title: "Kargo Tiba di Pelabuhan & Buyer Konfirmasi Sesuai",
      amount: "USD 4,000",
      pct: "100%",
      msg: "Transaksi Selesai 100%! Kapal kargo telah sandar di Port of Hamburg, Jerman. Pihak buyer telah mengonfirmasi bahwa seluruh 20 MT biji kopi telah diterima dalam kondisi prima sesuai spesifikasi kontrak. Sisa pelunasan 20% sebesar USD 4,000 telah dicairkan. Transaksi dinyatakan tuntas paripurna!",
      hash: "0x2e88a...4b011"
    }
  };

  function appendAgentMessage(text, headerTag) {
    if (!chatMessages) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'ecb-msg agent';
    msgEl.innerHTML = `
      <strong>🤖 ${headerTag || 'NusaBridge Escrow AI'} &bull; ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong>
      ${text}
    `;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendUserMessage(text) {
    if (!chatMessages) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'ecb-msg';
    msgEl.style.cssText = 'background:#2563eb; color:#ffffff; align-self:flex-end; border-radius:12px; max-width:85%; padding:9px 13px; font-size:12.5px;';
    msgEl.innerText = text;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  phaseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const phaseNum = btn.getAttribute('data-phase');
      phaseButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const data = PHASE_NOTIFICATIONS[phaseNum];
      if (!data) return;

      if (totalVaultStatus) {
        totalVaultStatus.innerText = `PROGRES VAULT: ${data.pct}`;
      }

      appendAgentMessage(`
        <div style="font-weight:750; color:#34d399; margin-bottom:4px;">${data.title}</div>
        <p style="margin:0 0 6px;">${data.msg}</p>
        <div style="font-size:11px; color:#94a3b8; border-top:1px solid #334155; padding-top:4px;">
          Pencairan Dana: <strong style="color:#ffffff;">${data.amount}</strong> &bull; Total Progres: <strong style="color:#34d399;">${data.pct}</strong><br>
          Hash Smart Contract: <code>${data.hash}</code>
        </div>
      `, `NOTIFIKASI ESCROW VAULT - ${data.tag}`);
    });
  });

  async function handleSendChat() {
    const text = chatInput?.value?.trim();
    if (!text) return;
    appendUserMessage(text);
    if (chatInput) chatInput.value = '';

    const lower = text.toLowerCase();

    // Coba panggil Backend API jika server menyala
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          appendAgentMessage(data.reply.replace(/\n/g, '<br>'), 'NusaBridge Gemini AI Agent');
          return;
        }
      }
    } catch (e) {
      // Backend offline, gunakan rule engine cerdas 4 pilar
    }

    setTimeout(() => {
      let reply = "";
      if (lower.includes('hamburg') || (lower.includes('robusta') && (lower.includes('cif') || lower.includes('kopi')))) {
        reply = `Halo Hanseatic Coffee Importers! Terima kasih telah menggunakan NusaBridge. Berikut adalah analisis transaksi ekspor Kopi Robusta Lampung Anda:<br><br>
📊 <strong>1. Kalkulasi RFQ Studio (Pilar 1)</strong><br>
Harga Dasar FOB Tanjung Priok: $3.85 / Kg ($77,000 USD)<br>
Ocean Freight &amp; Asuransi Kargo: $0.42 / Kg ($8,400 USD)<br>
Total Penawaran CIF Hamburg: <strong>$85,400 USD</strong> ($4.27 / Kg)<br>
Margin Aman UMKM: <strong>+18.5% Net Profit</strong><br><br>
🛡️ <strong>2. Audit Legalitas &amp; KYC Hub (Pilar 3)</strong><br>
NIB Pelaku Usaha: Valid &amp; Aktif Ekspor<br>
Sertifikasi Saniter: Phytosanitary &amp; Karantina Lolos (Bebas Hama Organisme)<br>
Skor Kepatuhan: <strong>100% Score (Verified Seller Shield)</strong><br><br>
📄 <strong>3. Otomatisasi Dokumen Legal (Pilar 2)</strong><br>
Commercial Invoice #INV-2026-DE-088 dan Sales Contract (CIF Hamburg) telah secara otomatis diterbitkan berformat PDF.<br><br>
🔒 <strong>4. Skema Escrow Vault (Pilar 4)</strong><br>
Pembayaran sebesar $85,400 USD akan dikunci secara aman di Escrow Vault dan dicairkan secara bertahap:<br>
• <strong>Tahap 1 (30% - $25,620)</strong>: DP Cair saat Kontrak Ditandatangani.<br>
• <strong>Tahap 2 (30% - $25,620)</strong>: Cair saat Dokumen PEB &amp; Stuffing Container Selesai.<br>
• <strong>Tahap 3 (20% - $17,080)</strong>: Cair saat Kapal Berlayar &amp; Bill of Lading (B/L) Terbit.<br>
• <strong>Tahap 4 (20% - $17,080)</strong>: Settlement Final saat Kontainer Tiba di Hamburg Port.`;
      } else if (lower.includes('dp') || lower.includes('uang muka') || lower.includes('fase 1')) {
        reply = "Untuk pencairan 30% Down Payment, buyer wajib menandatangani Sales Contract secara digital dan menyetor 100% dana ke Escrow Vault. Begitu dana terkunci, 30% langsung cair ke rekening UMKM.";
      } else if (lower.includes('peb') || lower.includes('bea cukai')) {
        reply = "Pencairan Fase 2 (30%) memerlukan nomor pendaftaran PEB yang valid dari sistem CEISA Bea Cukai. AI Agent NusaBridge otomatis memverifikasi status NPE (Nota Pelayanan Ekspor).";
      } else if (lower.includes('kapal') || lower.includes('b/l') || lower.includes('bill of lading')) {
        reply = "Pencairan Fase 3 (20%) terhubung langsung dengan sensor AIS kapal kargo. Saat kargo dimuat (on-board) dan B/L terbit, sistem langsung membuka kunci dana.";
      } else {
        reply = `Halo! Saya <strong>NusaBridge Gemini AI Agent</strong>, asisten B2B perdagangan ekspor-impor pintar untuk UMKM Indonesia.<br><br>
Saya siap mengawal transaksi ekspor Anda dengan <strong>4 Pilar NusaBridge</strong>:<br>
1. <strong>RFQ Studio &amp; Incoterms 2020</strong>: Menghitung estimasi FOB, Ocean Freight, Asuransi maritim, hingga harga CIF dengan margin aman UMKM.<br>
2. <strong>Otomatisasi Dokumen</strong>: Menerbitkan draf berkas resmi Proforma Invoice, Commercial Invoice, dan Export Sales Contract berformat PDF instan.<br>
3. <strong>KYC Hub &amp; Kepatuhan Global</strong>: Memverifikasi NIB, NPWP, Phytosanitary, izin US FDA, sertifikasi JAS Jepang, atau regulasi EUDR Eropa dengan skor 100%.<br>
4. <strong>Escrow Vault Multivalas</strong>: Melindungi dana transaksi dengan pelepasan bertahap 4 fase (30% DP ➔ 30% PEB ➔ 20% Bill of Lading ➔ 20% Pelunasan Akhir).`;
      }
      appendAgentMessage(reply, 'NusaBridge Gemini AI Agent');
    }, 350);
  }

  if (btnSendChat) btnSendChat.addEventListener('click', handleSendChat);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendChat();
    });
  }

  // Inisialisasi awal render
  parseAndRenderRFQ();
  renderDocumentSheet('pi');
  renderKycResult();
  
  // Sambutan awal chat
  appendAgentMessage(
    "Selamat datang di Simulasi Escrow Vault NusaBridge. Sistem ini mengamankan pembayaran ekspor bernilai tinggi agar UMKM tidak menanggung risiko gagal bayar buyer luar negeri. Klik salah satu tombol 4 Fase di sebelah kiri untuk menguji notifikasi pencairan bertahap.",
    "Smart Contract Live System"
  );

});
