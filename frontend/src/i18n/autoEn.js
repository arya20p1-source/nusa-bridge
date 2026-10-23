/**
 * Kamus cepat ID -> EN untuk teks UI yang paling sering muncul.
 * Teks yang belum ada di sini akan dicoba diterjemahkan oleh Gemini
 * (POST /api/translate); bila Gemini tidak tersedia, teks tetap ID.
 * Kamus ini dibuat menyeluruh agar UI tetap Inggris meski API terbatas.
 */
export const AUTO_EN = {
  // ===== NAVBAR / CHROME =====
  'Radar Pelayaran Kapal Kargo': 'Shipping Radar',
  'Layar Penuh': 'Full Screen',
  '🟢 Berlayar (On Schedule)': '🟢 Sailing (On Schedule)',
  'Kecepatan: 19.4 knots': 'Speed: 19.4 knots',
  'Kecepatan: 19.3 knots': 'Speed: 19.3 knots',
  'Kecepatan: 19.3 knots': 'Speed: 19.3 knots',
  'Progres Pelayaran:': 'Voyage Progress:',
  'ETA: 4 Hari Lagi (24 Okt 2026)': 'ETA: 4 Days Left (24 Oct 2026)',
  'Lihat Detail →': 'View Details →',
  'Negosiasi': 'Negotiation',
  'Proses Dokumen': 'Document Processing',
  'Dalam Pengiriman': 'In Transit',
  'Platform ini adalah prototype untuk keperluan kompetisi GTNIC 2026.':
    'This platform is a prototype for GTNIC 2026 competition purposes.',

  // ===== HOME HERO =====
  'Halo! Saya NusaBridge AI, asisten ekspor-impor pintar Anda. Saya dapat membantu analisis RFQ, rekomendasi harga Incoterms, hingga pembuatan dokumen ekspor resmi.':
    'Hello! I am NusaBridge AI, your smart export-import assistant. I can help with RFQ analysis, Incoterms price recommendations, and official export document creation.',

  // ===== PRODUCTS PAGE =====
  '☕ Kopi Ekspor Unggulan': '☕ Premium Export Coffee',
  '🌿 Rempah & Hasil Alam': '🌿 Spices & Natural Products',
  '🪑 Kriya & Kerajinan': '🪑 Crafts & Handicrafts',
  '🧵 Tekstil & Wastra Nusantara': '🧵 Textiles & Traditional Fabrics',
  'Menampilkan': 'Showing',
  'produk siap ekspor': 'export-ready products',
  'Dilindungi Sistem NusaBridge Escrow Vault': 'Protected by NusaBridge Escrow Vault System',
  'Ajukan RFQ': 'Request RFQ',
  'Phytosanitary Karantina': 'Phytosanitary Quarantine',
  'UNTUK PELAKU USAHA UMKM': 'FOR MSME BUSINESSES',
  'Pelajari Alur Ekspor AI': 'Learn AI Export Flow',
  '100% Proteksi Transaksi': '100% Transaction Protection',
  'Escrow Vault 4 Tahap Dana Aman': 'Escrow Vault 4-Stage Safe Funds',
  '(Hal': '(Page',
  'dari': 'of',

  // product description templates
  'Komoditas ekspor varian Green Beans berstandar internasional dengan SCA cupping score 85.5, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Green Beans with international standards, SCA cupping score 85.5, controlled moisture <12%, and strict defect sorting system.',
  'Komoditas ekspor varian Green Beans berstandar internasional dengan SCA cupping score 85.0, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Green Beans with international standards, SCA cupping score 85.0, controlled moisture <12%, and strict defect sorting system.',
  'Komoditas ekspor varian Green Beans berstandar internasional dengan SCA cupping score 86.2, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Green Beans with international standards, SCA cupping score 86.2, controlled moisture <12%, and strict defect sorting system.',
  'Komoditas ekspor varian Green Beans berstandar internasional dengan SCA cupping score 85.2, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Green Beans with international standards, SCA cupping score 85.2, controlled moisture <12%, and strict defect sorting system.',
  'Komoditas ekspor varian Roaster berstandar internasional dengan SCA cupping score 86.0, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Roasted with international standards, SCA cupping score 86.0, controlled moisture <12%, and strict defect sorting system.',
  'Komoditas ekspor varian Roaster berstandar internasional dengan SCA cupping score 84.8, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Roasted with international standards, SCA cupping score 84.8, controlled moisture <12%, and strict defect sorting system.',
  'Komoditas ekspor varian Roaster berstandar internasional dengan SCA cupping score 87.0, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Roasted with international standards, SCA cupping score 87.0, controlled moisture <12%, and strict defect sorting system.',
  'Komoditas ekspor varian Roaster berstandar internasional dengan SCA cupping score 85.5, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Roasted with international standards, SCA cupping score 85.5, controlled moisture <12%, and strict defect sorting system.',
  'Komoditas ekspor varian Roaster berstandar internasional dengan SCA cupping score 87.5, kadar air terkontrol <12%, dan sistem sortasi defect ketat.':
    'Export commodity variant Roasted with international standards, SCA cupping score 87.5, controlled moisture <12%, and strict defect sorting system.',
  'Bunga cengkeh kering warna cokelat kemerahan cerah dengan kadar minyak atsiri >19% dan kadar air <11%.':
    'Dried clove flowers, bright reddish-brown color with essential oil content >19% and moisture <11%.',
  'Kulit kayu manis kering gulung rapi panjang 8-10 cm, aroma pedas manis kuat dan bebas jamur.':
    'Dried cinnamon bark, neatly rolled 8-10 cm, strong sweet-spicy aroma and mold-free.',

  // ===== SOLUTIONS PAGE =====
  'Mengecek...': 'Checking...',
  'Halo! Saya': 'Hello! I am',
  ', asisten perdagangan ekspor-impor pintar untuk UMKM Indonesia.':
    ', a smart export-import assistant for Indonesian MSMEs.',
  'Saya siap membantu Anda dalam:': "I'm ready to help you with:",
  '• Mengecek harga, spesifikasi, dan MOQ dari 50 komoditas ekspor unggulan (Kopi, Rempah, Kriya, Tekstil).':
    '• Checking prices, specifications, and MOQ of 50 featured export commodities (Coffee, Spices, Crafts, Textiles).',
  '• Menghitung estimasi biaya pengiriman, ocean freight kapal, asuransi, dan penawaran CIF/FOB dengan margin aman.':
    '• Calculating shipping cost estimates, ocean freight, insurance, and CIF/FOB offers with safe margins.',
  '• Memberikan panduan kepatuhan dan audit perizinan negara tujuan (NIB OSS, Sertifikat Karantina, US FDA, EUDR Eropa, JAS Jepang).':
    '• Providing compliance guidance and permit audits for destination countries (NIB OSS, Quarantine Cert, US FDA, EU EUDR, Japan JAS).',
  '• Menjelaskan skema pembayaran bertahap 4 fase via Escrow Vault agar transaksi Anda aman dari risiko penipuan.':
    '• Explaining the 4-phase staged payment scheme via Escrow Vault to keep your transactions safe from fraud.',
  'Silakan ketik pertanyaan atau konsultasi ekspor Anda di bawah!':
    'Please type your export question or consultation below!',
  'Harga Dasar FOB Tanjung Priok:': 'Base Price FOB Tanjung Priok:',
  'Rekomendasi Penawaran CIF:': 'Recommended CIF Offer:',
  'Margin Aman: +18.5% Net Profit': 'Safe Margin: +18.5% Net Profit',
  'Otomatisasi Dokumen Ekspor Resmi': 'Official Export Document Automation',
  'Terbit instan dengan klausul perlindungan hukum internasional untuk melindungi hak penjual lokal.':
    'Issued instantly with international legal protection clauses to safeguard local sellers.',
  'Kalkulasi berat bersih (net weight), berat kotor (gross weight), dan volume CBM peti kemas tanpa salah hitung.':
    'Calculating net weight, gross weight, and container CBM volume without errors.',
  'Terintegrasi dengan format data sistem kepabeanan Indonesia untuk mempercepat penerbitan Nota Pelayanan Ekspor (NPE).':
    'Integrated with Indonesian customs data formats to speed up Export Service Note (NPE) issuance.',
  '16 Oktober 2026': '16 October 2026',
  'KYC Hub & Validasi Kepatuhan Global': 'KYC Hub & Global Compliance Validation',
  'Verifikasi status Nomor Induk Berusaha pada sistem OSS dan kelayakan izin kepabeanan.':
    'Verifying Business Registration Number (NIB) status on the OSS system and customs permit eligibility.',
  'Mengecek otomatis apakah produk memerlukan sertifikat FDA (AS), CE Mark (Eropa), JAS (Jepang), atau Fumigasi ISPM 15.':
    'Automatically checking whether products require FDA (US), CE Mark (Europe), JAS (Japan), or ISPM 15 fumigation certificates.',
  'Meningkatkan kepercayaan buyer internasional sehingga mereka bersedia membayar uang muka (DP) lebih awal.':
    'Increasing international buyer trust so they are willing to pay a down payment (DP) earlier.',
  'Verifikasi Legalitas & Sertifikasi': 'Legal & Certification Verification',
  'NIB Pelaku Usaha (OSS):': 'Business NIB (OSS):',
  'Valid & Aktif Ekspor': 'Valid & Active for Export',
  'NPWP Badan/Perorangan:': 'Tax ID (NPWP):',
  'Terdaftar Kemenkeu': 'Registered with Ministry of Finance',
  'Hasil Uji Lab Sucofindo/Baristand:': 'Lab Test Results (Sucofindo/Baristand):',
  'Lolos Uji Logam Berat': 'Passed Heavy Metal Test',
  'Phytosanitary & Karantina:': 'Phytosanitary & Quarantine:',
  'Bebas Hama Organisme': 'Free of Pests/Organisms',
  'Escrow Vault: Transaksi Aman Tanpa Risiko': 'Escrow Vault: Safe Transactions Without Risk',
  'Pelepasan dana produksi saat Sales Contract ditandatangani kedua belah pihak.':
    'Releasing production funds when the Sales Contract is signed by both parties.',
  'Pelepasan dana saat barang tiba di pelabuhan muat dan dokumen PEB diterbitkan.':
    'Releasing funds when goods arrive at the loading port and the PEB document is issued.',
  'Pelepasan dana saat kapal kargo berlayar dan Bill of Lading (B/L) resmi terbit.':
    'Releasing funds when the cargo vessel sails and the official Bill of Lading (B/L) is issued.',
  'Pelepasan sisa dana saat kontainer tiba di pelabuhan tujuan dan lolos inspeksi penerimaan.':
    'Releasing remaining funds when the container arrives at the destination port and passes acceptance inspection.',
  'Tahap 1: Kontrak Selesai (30%)': 'Stage 1: Contract Complete (30%)',
  'USD 6,000 (Cair)': 'USD 6,000 (Released)',
  'Tahap 2: PEB & Stuffing (30%)': 'Stage 2: PEB & Stuffing (30%)',
  'Tahap 3: Kapal Berlayar (20%)': 'Stage 3: Vessel Sailed (20%)',
  'USD 4,000 (Dalam Proses)': 'USD 4,000 (In Process)',
  'Tahap 4: Tiba di Tujuan (20%)': 'Stage 4: Arrived at Destination (20%)',
  'USD 4,000 (Terkunci di Vault)': 'USD 4,000 (Locked in Vault)',
  'Studio Operasional Ekspor Berbasis NusaBridge AI':
    'NusaBridge AI-Based Export Operations Studio',
  'Uji coba interaktif 4 kemampuan inti AI: Konversi RFQ Incoterms 2020, penerbitan draf berkas PDF resmi, audit legalitas KYC Hub, dan notifikasi 4 fase Escrow Vault.':
    'Interactive trial of 4 core AI capabilities: Incoterms 2020 RFQ conversion, official PDF draft issuance, KYC Hub legal audit, and 4-phase Escrow Vault notifications.',
  '3. KYC Hub & Kepatuhan Global': '3. KYC Hub & Global Compliance',
  '4. Escrow Vault & AI Chat (4 Fase)': '4. Escrow Vault & AI Chat (4 Phases)',
  'Pesan / Permintaan Informal dari Buyer Luar Negeri:':
    'Informal Message / Request from Foreign Buyer:',
  '✨ Konversi Pesan Buyer Menjadi RFQ Resmi (Incoterms 2020)':
    '✨ Convert Buyer Message to Official RFQ (Incoterms 2020)',
  'Request for Quotation (RFQ) Terbit Otomatis • Incoterms 2020':
    'Request for Quotation (RFQ) Auto-Issued • Incoterms 2020',
  '1. Ekstraksi Entitas & Parameter RFQ': '1. RFQ Entity & Parameter Extraction',
  'Volume / Satuan:': 'Volume / Unit:',
  'Pelabuhan Muat (POL):': 'Loading Port (POL):',
  'Pelabuhan Tanjung Priok, Jakarta': 'Tanjung Priok Port, Jakarta',
  'Pelabuhan Bongkar (POD):': 'Discharge Port (POD):',
  '✅ Incoterms Terdeteksi:': '✅ Incoterms Detected:',
  '2. Rincian Struktur Biaya Ekspor (Per Satuan)':
    '2. Export Cost Structure Breakdown (Per Unit)',
  'Biaya Produksi & Kemasan:': 'Production & Packaging Cost:',
  'Trucking & Port Handling:': 'Trucking & Port Handling:',
  'Ocean Freight & Asuransi:': 'Ocean Freight & Insurance:',
  'Margin Aman UMKM (+': 'Safe MSME Margin (+',
  '3. Rekomendasi Kuotasi & Nilai Kontrak': '3. Quotation & Contract Value Recommendation',
  'Harga Penawaran Final:': 'Final Offer Price:',
  'Estimasi Nilai Kontrak:': 'Estimated Contract Value:',
  'Rekomendasi HS Code:': 'Recommended HS Code:',
  'Terbitkan Proforma Invoice Otomatis →': 'Issue Proforma Invoice Automatically →',
  'INTEGRASI MUDAH': 'EASY INTEGRATION',
  'Siap Membawa Produk Lokal Menuju Pasar Dunia?':
    'Ready to Bring Local Products to the Global Market?',
  'Bergabunglah bersama ratusan pelaku UMKM yang telah mengotomatisasi dokumen dan menemukan buyer internasional terverifikasi melalui NusaBridge.':
    'Join hundreds of MSMEs who have automated their documents and found verified international buyers through NusaBridge.',
  '98% Waktu Terpangkas': '98% Time Saved',
  'Dari 2 Minggu Jadi 5 Menit': 'From 2 Weeks to 5 Minutes',
  'Mengubah pesan penawaran informal dari buyer luar negeri menjadi format formal Request For Quotation (RFQ) berstandar Incoterms 2020 dalam hitungan detik.':
    'Converting informal buyer offers into formal Request For Quotation (RFQ) format under Incoterms 2020 standards in seconds.',
  'Kalkulator Incoterms Real-Time': 'Real-Time Incoterms Calculator',
  'AI menghitung perbedaan struktur biaya FOB, CIF, CFR, dan EXW secara otomatis berdasarkan pelabuhan muat dan tujuan.':
    'AI automatically calculates cost structure differences for FOB, CIF, CFR, and EXW based on loading and destination ports.',
  'Rekomendasi Harga Margin Aman': 'Safe Margin Price Recommendation',
  'Mencegah UMKM merugi karena salah estimasi biaya freight laut, fluktuasi kurs mata uang, atau biaya pelabuhan.':
    'Preventing MSME losses from incorrect ocean freight estimates, currency fluctuations, or port fees.',
  'Asisten Negosiasi Multi-Bahasa': 'Multi-Language Negotiation Assistant',
  'Membantu UMKM merespons email buyer berbahasa Inggris, Jerman, Jepang, atau Arab dengan tata bahasa bisnis profesional.':
    'Helping MSMEs respond to buyer emails in English, German, Japanese, or Arabic with professional business grammar.',

  // ===== PRICING PAGE =====
  '🎁 Terapkan Voucher 15%': '🎁 Apply 15% Voucher',
  'Pilih': 'Choose',
  'Paket UMKM Eksportir (1 Tahun)': 'SME Exporter Package (1 Year)',
  'Ditagih Rp 820.000 / tahun • Solusi ekspor lengkap 12 bulan penuh':
    'Billed Rp 820,000 / year • Complete 12-month export solution',
  '/ bulan': '/ month',
};
