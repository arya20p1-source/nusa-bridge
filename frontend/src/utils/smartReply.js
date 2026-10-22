/**
 * NusaBridge Smart Intelligence Engine (fallback offline).
 * Ported from app.js getSmartIndexReply - dipakai bila backend AI offline/timeout.
 */
export function getSmartIndexReply(userQuery, lang = 'id') {
  const raw = (userQuery || '').trim();
  const q = raw.toLowerCase();
  const isEn = lang === 'en' || q.includes('how') || q.includes('what') || q.includes('hello') || q.includes('hi ');

  // 1. Cara Kerja AI / Artificial Intelligence / Machine Learning
  if (
    q.includes('cara kerja ai') || q.includes('how ai works') || q.includes('how does ai work') ||
    q.includes('apa itu ai') || q.includes('what is ai') || q.includes('kecerdasan buatan') ||
    q.includes('machine learning') || q.includes('deep learning') || q.includes('neural network') ||
    q.includes('llm') || q.includes('model ai')
  ) {
    if (isEn) {
      return `Hello! Artificial Intelligence (AI) works by mimicking how the human brain processes information, learns from patterns, and executes data-driven decisions:

1. **Data Ingestion:** Massive volumes of diverse data (text, trade statistics, prices) are preprocessed into mathematical vectors.
2. **Deep Neural Networks:** Transformer models process relationships between words and concepts using multi-head self-attention.
3. **Training & Optimization:** Algorithms iteratively evaluate outputs and adjust billions of internal weights to minimize prediction error.
4. **Real-Time Inference:** When you ask a query, the model calculates the most accurate and context-rich answer in seconds.
5. **Applied in NusaBridge:** We utilize NusaBridge AI to analyze buyer RFQs, compute Incoterms 2020 CIF/FOB pricing, audit OSS legalities, and secure escrow milestones!`;
    }
    return `Halo! Kecerdasan Buatan (Artificial Intelligence / AI) bekerja dengan cara meniru kemampuan otak manusia dalam mengenali pola, memproses informasi, dan mengambil keputusan berbasis data:

1. **Pengumpulan & Pemrosesan Data:** AI menyerap miliaran data referensi (teks, regulasi, harga komoditas) dan mengonversinya menjadi representasi vektor matematis.
2. **Jaringan Saraf Tiruan (Deep Neural Networks):** Menggunakan arsitektur Transformer modern yang mampu memahami konteks kalimat secara menyeluruh.
3. **Pelatihan & Penyesuaian Bobot:** Algoritma secara mandiri memperbaiki akurasi jawabannya melalui perhitungan tingkat kesalahan (*loss function*) dan optimasi parameter (*Backpropagation*).
4. **Inferensi Real-Time:** Saat Anda mengetik pertanyaan, sistem menghitung probabilitas terbaik dan menghasilkan jawaban cerdas dalam hitungan detik.
5. **Penerapan di NusaBridge:** AI kami otomatis mengonversi pesan buyer menjadi RFQ Incoterms 2020, memvalidasi NIB OSS, menerbitkan kontrak PDF, dan memantau escrow!`;
  }

  // 2. Salam & Sapaan Ramah
  if (
    q === 'halo' || q === 'hai' || q === 'hi' || q === 'hello' ||
    q.startsWith('halo ') || q.startsWith('hai ') ||
    q.includes('selamat pagi') || q.includes('selamat siang') || q.includes('selamat malam') || q.includes('apa kabar')
  ) {
    return `Halo! Saya adalah **NusaBridge AI**, asisten perdagangan ekspor-impor cerdas untuk UMKM Indonesia.

Ada yang bisa saya bantu hari ini? Anda dapat menanyakan:
• Cara kerja kecerdasan buatan NusaBridge AI
• Kalkulasi harga Incoterms 2020 (FOB, Ocean Freight, Asuransi, CIF)
• Pengecekan izin usaha NIB OSS & sertifikasi karantina
• Rekomendasi 130 komoditas ekspor unggulan (Kopi, Rempah, Kriya, Tekstil)
• Skema transaksi aman 4 tahap di Escrow Vault

Silakan ketik pertanyaan Anda!`;
  }

  // 3. Analisis RFQ / Permintaan Buyer
  if (q.includes('rfq') || q.includes('permintaan buyer') || q.includes('inquiry') || q.includes('pesan buyer') || q.includes('analisis')) {
    return `📊 **Analisis RFQ Berhasil!**
Buyer internasional memerlukan ketersediaan komoditas spesifikasi ekspor standar (kadar air < 12%, cacat fisik < 5%). AI NusaBridge otomatis menghitung struktur biaya Incoterms 2020, merekomendasikan margin aman +18.5%, dan menyiapkan draf Proforma Invoice instan.`;
  }

  // 4. Rekomendasi Harga Kompetitif
  if (q.includes('harga') || q.includes('kompetitif') || q.includes('margin') || q.includes('biaya')) {
    return `💡 **Kalkulasi Harga Cerdas NusaBridge AI:**
Berdasarkan indeks harga komoditas dan rute pelayaran maritim, penawaran harga disarankan menggunakan margin aman **+18% s/d +24% net profit** agar eksportir terlindungi dari fluktuasi nilai tukar valas dan biaya pelabuhan (*Ocean Freight*).`;
  }

  // 5. Penjelasan Incoterms 2020
  if (q.includes('incoterm') || q.includes('fob') || q.includes('cif') || q.includes('cfr') || q.includes('exw')) {
    return `📑 **Panduan Singkat Incoterms 2020:**
• **FOB (Free on Board):** Eksportir bertanggung jawab sampai kargo termuat ke atas kapal di pelabuhan muat Indonesia (Tanjung Priok / Tanjung Perak / Belawan). Ongkos kapal dibayar oleh buyer.
• **CIF (Cost, Insurance & Freight):** Eksportir menanggung harga barang + ongkos kapal (*Ocean Freight*) + premi asuransi kargo sampai pelabuhan tujuan buyer (Hamburg, Tokyo, Los Angeles).`;
  }

  // 6. Proforma Invoice & Sales Contract
  if (q.includes('invoice') || q.includes('kontrak') || q.includes('sales contract') || q.includes('dokumen') || q.includes('peb')) {
    return `📝 **Otomasi Dokumen Legal Ekspor Siap!**
Dokumen Proforma Invoice dan Sales Contract telah secara otomatis diterbitkan berstandar ICC Incoterms 2020 berformat PDF lengkap dengan klausul termin pembayaran bertahap Escrow Vault (30% DP / 30% PEB / 20% B/L / 20% Tiba).`;
  }

  // 7. Cara Memulai Ekspor
  if (q.includes('cara ekspor') || q.includes('langkah ekspor') || q.includes('ekspor pemula') || q.includes('bagaimana ekspor')) {
    return `🚀 **6 Langkah Memulai Ekspor untuk UMKM:**
1. Daftarkan NIB perorangan secara gratis di oss.go.id (berlaku sebagai hak kepabeanan).
2. Siapkan komoditas unggulan dan uji mutu (kadar air & kebersihan).
3. Hitung harga penawaran Incoterms (FOB / CIF) dengan margin aman.
4. Kirim sampel produk ke calon buyer luar negeri.
5. Gunakan pembayaran aman via Escrow Vault (DP 30% di awal).
6. Proses muat kontainer (stuffing), terbitkan dokumen PEB, dan kapal kargo bertolak!`;
  }

  // 8. Tentang NusaBridge & Pengembang
  if (q.includes('nusabridge') || q.includes('siapa kamu') || q.includes('kamu siapa') || q.includes('pembuat') || q.includes('arjika')) {
    return `🤖 Saya adalah **NusaBridge AI**, asisten ekspor-impor pintar yang dikembangkan oleh **Tim Arjika Labs - SMK Antartika 1 Sidoarjo** untuk kompetisi **GTNIC 2026**. Platform ini menggabungkan AI Sales Assistant, otomasi dokumen PDF resmi, validasi kepatuhan KYC Hub, dan perlindungan Escrow Vault!`;
  }

  // 9. Respons Terbuka Khas NusaBridge AI
  return `Halo! Menjawab pertanyaan Anda mengenai:
**"${raw}"**

Berikut adalah penjelasan informatif dan terstruktur:
• **Konsep Inti:** Setiap aspek dalam pembahasan ini memerlukan pemahaman mendasar yang teratur, pertimbangan data empiris, serta eksekusi yang konsisten.
• **Rekomendasi Praktis:** Anda dapat mengeksplorasi kalkulasi penawaran Incoterms 2020, simulasi penerbitan dokumen ekspor PDF, atau pengujian kepatuhan izin NIB di halaman **Solusi AI** kami.

💡 Anda juga dapat membuka halaman **Solusi AI** untuk berinteraksi langsung dengan studio operasional ekspor lengkap kami!`;
}

export default getSmartIndexReply;
