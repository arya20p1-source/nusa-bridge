/**
 * NusaBridge - Landing Page Interactivity
 * Built for GTNIC 2026 Prototype
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==================== 1. MOBILE MENU TOGGLE ====================
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });

    // Close mobile menu when clicking nav link
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      });
    });
  }

  // ==================== 2. ACTIVE NAV LINK ON SCROLL ====================
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    // Toggle scrolled state on navbar
    const navbar = document.querySelector('.navbar-header');
    if (navbar) {
      if (scrollY > 30) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // ==================== 3. LANGUAGE SWITCHER (ID / EN) ====================
  const langDropdownWrapper = document.getElementById('langDropdownWrapper');
  const langSelectorBtn = document.getElementById('langSelectorBtn');
  const currentLangLabel = document.getElementById('currentLangLabel');
  const langOptionItems = document.querySelectorAll('.lang-option-item');
  const langToast = document.getElementById('langToast');

  let currentLang = localStorage.getItem('nusabridge_lang') || 'id';

  const translations = {
    id: {
      // Nav
      nav_home: "Beranda",
      nav_products: "Produk",
      nav_solutions: "Solusi AI",
      nav_workflow: "Alur Ekspor",
      nav_pricing: "Harga",
      nav_about: "Tentang",
      btn_login: "Masuk",
      btn_register: "Daftar Gratis",
      // Hero
      hero_pill: "Platform Ekspor-Impor UMKM Indonesia",
      hero_title: 'UMKM Indonesia<br>Go Global,<br>Lebih Mudah<br>dengan <span class="text-accent">AI Agent</span>',
      hero_desc: "NusaBridge adalah platform intermediasi ekspor-impor berbasis AI Agent yang membantu UMKM Indonesia mengelola transaksi, verifikasi legalitas, otomasi dokumen perdagangan, dan pelacakan logistik secara efisien.",
      hero_btn_export: "Mulai Ekspor Sekarang",
      hero_btn_demo: "Lihat Demo",
      trust_1: "Aman & Terpercaya",
      trust_2: "Mudah Digunakan",
      trust_3: "Dibuat untuk UMKM",
      verif_1: "NIB Terverifikasi",
      verif_2: "NPWP Terverifikasi",
      verif_3: "Data Usaha Valid",
      // Stats
      stat_1_label: "Produk UMKM",
      stat_2_label: "Negara Tujuan",
      stat_3_label: "Efisiensi Dokumen",
      stat_4_label: "Dukungan AI",
      // Solutions
      solutions_pill: "SOLUSI NUSABRIDGE",
      solutions_title: 'Semua <span class="text-accent">Kebutuhan</span> Ekspor UMKM<br>dalam <span class="text-accent">Satu Platform</span>',
      solutions_sub: "Didukung AI Agent, NusaBridge mempermudah proses ekspor mulai dari pencarian buyer, negosiasi, hingga otomatisasi dokumen.",
      sol_1_title: "AI Sales Assistant<br>& RFQ Studio",
      sol_1_desc: "Analisis permintaan, rekomendasi harga, dan negosiasi berbasis AI.",
      sol_2_title: "Otomatisasi Dokumen<br>Perdagangan",
      sol_2_desc: "Generate Proforma Invoice, Sales Contract, dan dokumen ekspor sesuai standar internasional.",
      sol_3_title: "KYC Hub<br>(Sandbox)",
      sol_3_desc: "Validasi format NIB/NPWP untuk membangun kepercayaan buyer.",
      sol_4_title: "Escrow Vault<br>& Manajemen Transaksi",
      sol_4_desc: "Transaksi aman dengan pelepasan dana bertahap (30% / 30% / 20% / 20%).",
      // Products
      products_pill: "PRODUK UNGGULAN",
      products_title: "Produk UMKM Indonesia<br>untuk Pasar Global",
      products_view_all: "Lihat Semua Produk",
      cat_all: "Semua",
      cat_coffee: "Kopi",
      cat_spices: "Rempah",
      cat_craft: "Kriya",
      cat_textile: "Tekstil",
      cat_food: "Makanan",
      cat_others: "Lainnya",
      // Workflow
      workflow_pill: "ALUR EKSPOR",
      workflow_title: "Cara Kerja NusaBridge",
      workflow_sub: "Dari menemukan buyer hingga dokumen siap, semua dalam satu platform.",
      step_1: "Daftar & Lengkapi<br>Data Usaha",
      step_2: "Analisis RFQ<br>dengan AI",
      step_3: "Negosiasi & Pilih<br>Incoterms",
      step_4: "Generate Dokumen<br>Otomatis",
      step_5: "Pantau Logistik<br>& Escrow",
      step_6: "Produk Tiba<br>di Pasar Global",
      // Mockup
      mock_nav_home: "Beranda",
      mock_nav_prod: "Produk",
      mock_nav_rfq: "RFQ Studio",
      mock_nav_docs: "Dokumen",
      mock_nav_log: "Logistik",
      mock_nav_kyc: "KYC Hub",
      mock_nav_settings: "Pengaturan",
      mock_search_placeholder: "Cari produk, buyer, atau dokumen...",
      mock_welcome_title: "Selamat datang, UMKM Indonesia 👋",
      mock_welcome_sub: "Kelola transaksi ekspor Anda dengan bantuan AI Agent.",
      mstat_rfq: "Permintaan RFQ",
      mstat_docs: "Dokumen Dibuat",
      mstat_tx: "Transaksi Berjalan",
      mstat_eff: "Efisiensi Waktu",
      mwidget_map: "Peta Logistik",
      mwidget_tx: "Transaksi Terbaru",
      // Chat
      chat_header_title: "Asisten AI untuk Ekspor Anda",
      chat_greeting: "Halo! Saya NusaBridge AI Agent. Saya dapat membantu analisis RFQ, rekomendasi harga, hingga pembuatan dokumen ekspor.",
      chat_sug_1: "Analisis permintaan buyer (RFQ)",
      chat_sug_2: "Rekomendasi harga kompetitif",
      chat_sug_3: "Penjelasan Incoterms 2020",
      chat_sug_4: "Buat draft Proforma Invoice",
      chat_input_placeholder: "Tulis pertanyaan...",
      // Why Us
      why_pill: "MENGAPA NUSABRIDGE",
      why_title: "Dipercaya untuk Mendukung UMKM Indonesia",
      why_1_title: "Fokus pada UMKM",
      why_1_desc: "Dirancang khusus untuk kebutuhan pelaku usaha mikro, kecil, dan menengah.",
      why_2_title: "Teknologi AI Terdepan",
      why_2_desc: "Menggunakan NusaBridge AI untuk analisis, rekomendasi, dan otomasi dokumen.",
      why_3_title: "Standar Internasional",
      why_3_desc: "Mengacu pada Incoterms 2020 dan praktik perdagangan global.",
      why_4_title: "Aman & Transparan",
      why_4_desc: "Simulasi escrow dan verifikasi legalitas dalam lingkungan sandbox yang aman.",
      // CTA
      cta_pill: "Bersama NusaBridge",
      cta_heading: "Wujudkan UMKM Indonesia<br>yang Berdaya Saing Global",
      cta_subtext: "Teknologi AI untuk membuka lebih banyak peluang perdagangan internasional bagi produk lokal Indonesia.",
      cta_btn_register: "Daftar Sekarang",
      cta_btn_contact: "Hubungi Kami",
      cta_slogan_1: "Produk Lokal",
      cta_slogan_2: "Menuju Global 🌍",
      // Footer
      footer_brand_desc: "Platform AI untuk mempercepat ekspor UMKM Indonesia.",
      footer_title_nav: "Navigasi",
      footer_title_resources: "Sumber Daya",
      footer_title_social: "Ikuti Kami",
      footer_copyright: "© 2026 NusaBridge. Tim Arjika Labs - SMK Antartika 1 Sidoarjo.",
      res_help: "Pusat Bantuan",
      res_docs: "Dokumentasi",
      res_blog: "Blog",
      res_privacy: "Kebijakan Privasi",
      res_terms: "Syarat & Ketentuan",
      // Toast & Modal
      toast_msg: "Bahasa diubah ke Bahasa Indonesia 🇮🇩",
      modal_login_title: "Masuk ke NusaBridge",
      modal_register_title: "Daftar Akun NusaBridge",

      // Halaman Harga & Voucher
      harga_hero_pill: "SKEMA RESMI KOMPETISI GTNIC 2026",
      harga_hero_title: "Investasi Transparan & Ramah Ekosistem UMKM",
      harga_hero_sub: "Mulai dengan uji coba gratis 1 bulan penuh. Perpanjang dengan paket hemat 5 bulan atau 1 tahun untuk menikmati otomasi dokumen kepabeanan dan pelacakan kapal kargo maritim tanpa batas.",
      voucher_badge: "PROGRAM SUBSIDI DIGITALISASI EKSPOR GTNIC 2026",
      voucher_status: "● Kuota Subsidi Tersedia",
      voucher_title: "Program Subsidi Ekspor Digital untuk UMKM Indonesia",
      voucher_desc: "Dukung percepatan perdagangan global UMKM dengan kupon subsidi resmi <strong>15% pasti</strong> untuk Paket 5 Bulan dan Paket 1 Tahun. Potongan langsung diaplikasikan ke total biaya langganan secara transparan tanpa syarat tersembunyi.",
      voucher_val_label: "POTONGAN SUBSIDI",
      voucher_btn_claim: "Terapkan Voucher 15%",
      wa_banner_title: "Ingin Berlangganan Lebih dari 1 Tahun atau Lisensi Koperasi UMKM?",
      wa_banner_desc: "Dapatkan potongan harga volume khusus, multi-akun anggota, dan asistensi kepabeanan intensif.",
      wa_banner_btn: "💬 Chat Admin via WhatsApp",

      // Kartu Harga
      plan_1_badge: "SANDBOX EVALUASI",
      plan_1_name: "Paket Starter / Sandbox",
      plan_1_desc: "Akses uji coba simulasi KYC sandbox, kalkulator AI, dan pembuatan draf dokumen PDF terbatas (max 3/bulan) untuk UMKM pemula atau pengujian juri GTNIC 2026.",
      plan_1_period: "/ Gratis Selamanya",
      plan_1_vat: "✓ Termasuk PPN 11% • Tanpa Kartu Kredit",
      plan_1_notice: "Masa aktif uji coba gratis untuk eksplorasi juri GTNIC 2026 dan UMKM rintisan baru.",
      plan_1_f1: "Akses Uji Coba Simulasi KYC Sandbox",
      plan_1_f2: "Kalkulator AI Incoterms 2020 Dasar",
      plan_1_f3: "Pembuatan Draf Dokumen PDF Terbatas (Max 3/bulan)",
      plan_1_f4: "Simulasi Pencairan Escrow Vault 4 Fase",
      plan_1_f5: "Akses Showcase 120 Komoditas Unggulan",
      plan_1_f6: "Verified Seller Badge Resmi di Katalog",
      plan_1_f7: "Otomasi Dokumen PDF Sepuasnya",
      plan_1_btn: "Mulai Sandbox Gratis",

      popular_ribbon: "PALING POPULER",
      plan_2_badge: "REKOMENDASI EKSPORTIR",
      plan_2_name: "UMKM Eksportir / Professional",
      plan_2_desc: "Akses penuh RFQ Studio, kalkulator harga ekspor-impor tanpa batas, otomatisasi dokumen PDF sepuasnya, Verified Seller Badge, dan penguncian transaksi di Escrow Vault.",
      duration_label: "Pilih Durasi Paket:",
      dur_1m: "1 Bulan",
      dur_5m: "5 Bulan",
      dur_1y: "1 Tahun",
      save_20: "Hemat 20%",
      save_best: "12 Bulan Penuh",
      save_25: "Hemat 20%",
      save_51: "12 Bulan Penuh",
      original_price_label: "Harga Asli:",
      per_month: "/ bulan",
      plan_2_vat: "✓ Sudah Termasuk PPN 11% (Faktur Pajak Tersedia)",
      plan_2_f1: "Akses Penuh RFQ Studio & AI Sales Assistant",
      plan_2_f2: "Kalkulator Harga Ekspor-Impor Tanpa Batas (FOB, CFR, CIF, DDP)",
      plan_2_f3: "Otomatisasi Dokumen PDF Sepuasnya (Invoice & Sales Contract)",
      plan_2_f4: "Verified Seller Badge Resmi di Katalog Global",
      plan_2_f5: "Penguncian Transaksi Aman di Escrow Vault Multivalas",
      plan_2_f6: "Radar Pelacakan Kapal Kargo Maritim AIS Real-Time",
      plan_2_f7: "Asistensi Pendampingan Ekspor via WhatsApp Prioritas",
      plan_2_f8: "Garansi 100% Uang Kembali 7 Hari & Refund Prorata",
      plan_2_btn: "Pilih Paket Professional (1 Tahun)",

      plan_3_badge: "KORPORASI & KOPERASI",
      plan_3_name: "Paket Enterprise",
      plan_3_desc: "Fitur multi-user untuk korporasi, asosiasi, atau koperasi ekspor besar, analitik lanjutan, dan kustomisasi berkas perdagangan.",
      scheme_custom: "Skema",
      custom_val: "Kustom",
      custom_period: "/ Hubungi Kami",
      plan_3_vat: "✓ Termasuk PPN 11% • Penagihan Perusahaan Resmi",
      plan_3_f1: "Fitur Multi-User (10 - 50 Akun Petani & Staff Ekspor)",
      plan_3_f2: "Analitik Rantai Pasok & Rute Pelayaran Lanjutan",
      plan_3_f3: "Kustomisasi Berkas Perdagangan Sesuai Standar Global",
      plan_3_f4: "Integrasi API Bea Cukai, Forwarder & Gudang Khusus",
      plan_3_f5: "Pendampingan On-Site & Kurasi Buyer B2B Tatap Muka",
      plan_3_f6: "Dedicated Account Manager & Legal Specialist 24/7",
      plan_3_btn: "Chat Admin WA (Paket Enterprise)",

      // Evaluasi GTNIC 2026 & Kalkulator Margin
      eval_note_badge: "CATATAN EVALUASI GTNIC 2026",
      eval_note_text: "<strong>Lingkungan Evaluasi Juri:</strong> Selama tahap evaluasi GTNIC 2026, seluruh simulasi kalkulator dan fitur AI dapat diuji coba secara gratis.",
      calc_pill: "KALKULATOR MARGIN EKSPOR UMKM",
      calc_title: "Hitung Potensi Keuntungan Ekspor Anda",
      calc_sub: "Simulasikan nilai kontrak penjualan, biaya freight, dan margin bersih yang diterima UMKM.",
      calc_label_contract: "Estimasi Nilai Kontrak Penjualan (USD):",
      calc_label_prod: "Estimasi Biaya Produksi & Kemasan Lokal (USD):",
      calc_label_freight: "Biaya Freight & Port Handling (FOB/CIF) (USD):",
      calc_label_escrow: "Biaya Layanan Escrow NusaBridge (1.2%):",
      calc_label_net: "Estimasi Keuntungan Bersih (Net Profit):",
      calc_row_margin: "Margin Keuntungan:",
      calc_row_dp: "Pencairan Dana Tahap 1 (30% DP):",
      calc_row_status: "Status Keamanan Dana:",
      calc_safe_tag: "100% Terlindungi Escrow Vault",
      calc_btn_consult: "Konsultasikan Simulasi Ini",
      faq_pill: "PERTANYAAN UMUM",

      // Halaman Solusi AI
      solusi_hero_pill: "TEKNOLOGI AI AGENT TERCANGGIH",
      solusi_hero_title: "Otomasi Ekspor Cerdas dari Awal Sampai Selesai",
      solusi_hero_sub: "NusaBridge menggabungkan pemrosesan bahasa alami (LLM), otomasi dokumen legal perdagangan internasional, dan telemetri maritim untuk memberdayakan UMKM bersaing di pasar global tanpa kendala birokrasi.",
      solusi_chat_title: "NusaBridge AI",
      solusi_chat_sub: "Google Gemini 2.5 Flash • Terhubung Langsung",
      solusi_disclaimer: "NusaBridge AI siap menjawab segala pertanyaan secara cerdas, akurat, dan on-topic. Ketik pertanyaan Anda secara bebas untuk memulai konsultasi.",
      solusi_btn_clear: "Bersihkan Chat",
      solusi_btn_send: "Kirim",
      solusi_input_ph: "Tanyakan apa saja ke NusaBridge AI... (Contoh: Bagaimana cara kerja AI? atau Hitung biaya CIF Hamburg)",

      // Halaman Produk
      produk_hero_pill: "KATALOG EKSPOR RESMI",
      produk_hero_title: "Produk & Komoditas Unggulan UMKM Nusantara",
      produk_hero_sub: "Semua produk telah melewati audit legalitas NIB, standar uji mutu laboratorium, dan verifikasi profil oleh AI Agent NusaBridge siap kirim ke pasar global.",
      produk_stat_1: "500+ Komoditas Terdaftar",
      produk_stat_2: "100% Terverifikasi NIB/NPWP",
      produk_stat_3: "20+ Negara Tujuan Ekspor",
      produk_stat_4: "FOB / CIF Incoterms Ready",
      produk_search_ph: "Cari nama produk, daerah asal, atau HS Code (cth: Kopi Gayo, Cengkeh, Rotan)...",
      sort_label: "Urutkan:",
      sort_featured: "Paling Populer",
      sort_price_low: "Harga: Rendah ke Tinggi",
      sort_price_high: "Harga: Tinggi ke Rendah",
      sort_moq_low: "MOQ Terkecil",

      // Transparansi & Garansi
      guarantee_title: "Garansi 100% Uang Kembali 7 Hari & Pengembalian Prorata",
      guarantee_desc: "NusaBridge memberikan garansi pengembalian dana 100% tanpa syarat jika Anda membatalkan dalam 7 hari pertama langganan. Untuk paket 5 bulan atau 1 tahun, pengembalian dana setelah hari ke-7 dihitung secara adil berdasarkan sisa bulan yang belum berjalan (prorata).",
      tax_transparency_title: "Transparansi Biaya: PPN 11% & Kurs Acuan Resmi BI Jisdor",
      tax_transparency_desc: "Seluruh harga paket langganan sudah termasuk PPN 11% (tersedia Faktur Pajak resmi). Penukaran valas USD saat pencairan Escrow Vault menggunakan Kurs Tengah Resmi Bank Indonesia (BI Jisdor) hari transaksi dengan spread transparan maksimal 0,35%.",

      // FAQ
      faq_main_title: "Pertanyaan Seputar Biaya, Garansi & Transaksi",
      faq_q1: "Apakah ada biaya tersembunyi selain harga paket langganan?",
      faq_a1: "<strong>Tidak ada biaya tersembunyi sama sekali.</strong> NusaBridge menerapkan transparansi biaya penuh:<br>1. <strong>Langganan Software:</strong> Sesuai paket durasi yang Anda pilih (mulai Rp 58.300/bulan untuk paket 1 tahun) yang sudah termasuk PPN 11%.<br>2. <strong>Biaya Escrow Vault:</strong> Flat 1.2% dari nilai pembayaran invoice yang berhasil dicairkan.<br>3. <strong>Kurs Pencairan:</strong> Menggunakan Kurs Tengah Resmi Bank Indonesia (BI Jisdor) pada hari kerja pencairan.",
      faq_q2: "Kapan dana dari buyer luar negeri masuk dan bagaimana acuan kursnya?",
      faq_a2: "Dana dicairkan bertahap dalam 4 fase: 30% uang muka (DP) saat Sales Contract disepakati, 30% saat kargo masuk kontainer dan PEB Bea Cukai terbit, 20% saat On-Board Bill of Lading terbit, dan 20% pelunasan akhir saat kontainer tiba di pelabuhan tujuan. Pencairan langsung ke rekening valas/rupiah Anda.",
      faq_q3: "Bagaimana jika saya ingin berhenti? Apakah ada kebijakan pengembalian dana (refund)?",
      faq_a3: "Ya, NusaBridge memiliki kebijakan refund yang sangat adil dan transparan:<br>• <strong>Garansi 7 Hari 100% Uang Kembali:</strong> Jika dalam 7 hari pertama Anda merasa layanan tidak sesuai, kami kembalikan dana 100% tanpa potongan.<br>• <strong>Refund Prorata untuk Paket 5 Bulan & 1 Tahun:</strong> Sisa bulan yang belum berjalan dikembalikan secara proporsional.",
      faq_q4: "Apakah UMKM yang baru memiliki NIB perorangan bisa langsung menggunakan layanan?",
      faq_a4: "Bisa! Cukup dengan Nomor Induk Berusaha (NIB) standar dari OSS RBA (perorangan maupun badan usaha), sistem KYC Hub NusaBridge akan memandu aktivasi Hak Akses Kepabeanan dan verifikasi dokumen agar siap ekspor.",

      // Sandbox Mockup
      settings_title: "Pengaturan Profil & Rekening Escrow",
      settings_save: "Simpan Perubahan"
    },
    en: {
      // Nav
      nav_home: "Home",
      nav_products: "Products",
      nav_solutions: "AI Solutions",
      nav_workflow: "Export Flow",
      nav_pricing: "Pricing",
      nav_about: "About Us",
      btn_login: "Log In",
      btn_register: "Sign Up Free",
      // Hero
      hero_pill: "Indonesian SME Export-Import Platform",
      hero_title: 'Indonesian SMEs<br>Go Global,<br>Made Easier<br>with <span class="text-accent">AI Agent</span>',
      hero_desc: "NusaBridge is an AI Agent-driven export-import intermediation platform empowering Indonesian SMEs to manage transactions, verify compliance, automate trade documents, and track logistics seamlessly.",
      hero_btn_export: "Start Exporting Now",
      hero_btn_demo: "Watch Demo",
      trust_1: "Safe & Trusted",
      trust_2: "Easy to Use",
      trust_3: "Built for SMEs",
      verif_1: "Verified Tax & NIB",
      verif_2: "Verified Business ID",
      verif_3: "Valid Enterprise Data",
      // Stats
      stat_1_label: "SME Products",
      stat_2_label: "Destinations",
      stat_3_label: "Document Accuracy",
      stat_4_label: "AI Support",
      // Solutions
      solutions_pill: "NUSABRIDGE SOLUTIONS",
      solutions_title: 'All Your SME <span class="text-accent">Export Needs</span><br>in <span class="text-accent">One Platform</span>',
      solutions_sub: "Powered by AI Agents, NusaBridge simplifies exporting from buyer matching and negotiations to automated paperwork.",
      sol_1_title: "AI Sales Assistant<br>& RFQ Studio",
      sol_1_desc: "Inquiry analysis, smart price recommendations, and AI-assisted negotiation.",
      sol_2_title: "Automated Trade<br>Documents",
      sol_2_desc: "Instantly generate Proforma Invoices, Sales Contracts, and COO compliant with global standards.",
      sol_3_title: "KYC Hub<br>(Sandbox)",
      sol_3_desc: "Validate legal business format to establish buyer trust and compliance.",
      sol_4_title: "Escrow Vault<br>& Transaction Desk",
      sol_4_desc: "Secure transactions with milestone-based payout release (30% / 30% / 20% / 20%).",
      // Products
      products_pill: "FEATURED COMMODITIES",
      products_title: "Indonesian SME Products<br>for the Global Market",
      products_view_all: "View All Products",
      cat_all: "All",
      cat_coffee: "Coffee",
      cat_spices: "Spices",
      cat_craft: "Crafts",
      cat_textile: "Textiles",
      cat_food: "Food & Agri",
      cat_others: "Others",
      // Workflow
      workflow_pill: "EXPORT PROCESS",
      workflow_title: "How NusaBridge Works",
      workflow_sub: "From buyer matching to document readiness, all in a single platform.",
      step_1: "Register & Profile<br>Business Data",
      step_2: "Analyze RFQ<br>with AI",
      step_3: "Negotiate & Select<br>Incoterms",
      step_4: "Auto-Generate<br>Trade Documents",
      step_5: "Track Logistics<br>& Escrow",
      step_6: "Products Arrive at<br>Global Destination",
      // Mockup
      mock_nav_home: "Home",
      mock_nav_prod: "Products",
      mock_nav_rfq: "RFQ Studio",
      mock_nav_docs: "Documents",
      mock_nav_log: "Logistics",
      mock_nav_kyc: "KYC Hub",
      mock_nav_settings: "Settings",
      mock_search_placeholder: "Search products, buyers, or documents...",
      mock_welcome_title: "Welcome, Indonesian SME 👋",
      mock_welcome_sub: "Manage your export operations with intelligent AI assistance.",
      mstat_rfq: "RFQ Requests",
      mstat_docs: "Documents Created",
      mstat_tx: "Active Shipments",
      mstat_eff: "Time Saved",
      mwidget_map: "Logistics Map",
      mwidget_tx: "Recent Trades",
      // Chat
      chat_header_title: "AI Assistant for Your Export",
      chat_greeting: "Hello! I am NusaBridge AI. I can help analyze RFQs, suggest export pricing, and prepare trade documents.",
      chat_sug_1: "Analyze buyer request (RFQ)",
      chat_sug_2: "Competitive pricing suggestion",
      chat_sug_3: "Explain Incoterms 2020",
      chat_sug_4: "Draft Proforma Invoice",
      chat_input_placeholder: "Type your question...",
      // Why Us
      why_pill: "WHY NUSABRIDGE",
      why_title: "Trusted to Empower Indonesian SMEs",
      why_1_title: "Focus on SMEs",
      why_1_desc: "Engineered specifically for micro, small, and medium local enterprises.",
      why_2_title: "Cutting-Edge AI",
      why_2_desc: "Harnessing NusaBridge AI for real-time analysis, insights, and paperwork automation.",
      why_3_title: "International Standards",
      why_3_desc: "Aligned with Incoterms 2020 guidelines and global trade best practices.",
      why_4_title: "Safe & Transparent",
      why_4_desc: "Escrow simulation and legal verification in a secure sandbox environment.",
      // CTA
      cta_pill: "Together with NusaBridge",
      cta_heading: "Empowering Indonesian SMEs<br>to Compete Globally",
      cta_subtext: "Harnessing AI technology to open international market access for authentic Indonesian products.",
      cta_btn_register: "Register Now",
      cta_btn_contact: "Contact Us",
      cta_slogan_1: "Local Products",
      cta_slogan_2: "Going Global 🌍",
      // Footer
      footer_brand_desc: "AI platform accelerating Indonesian SME exports worldwide.",
      footer_title_nav: "Navigation",
      footer_title_resources: "Resources",
      footer_title_social: "Follow Us",
      footer_copyright: "© 2026 NusaBridge. Arjika Labs - SMK Antartika 1 Sidoarjo.",
      res_help: "Help Center",
      res_docs: "Documentation",
      res_blog: "Blog",
      res_privacy: "Privacy Policy",
      res_terms: "Terms & Conditions",
      // Toast & Modal
      toast_msg: "Language switched to English 🇬🇧",
      modal_login_title: "Log In to NusaBridge",
      modal_register_title: "Register NusaBridge Account",

      // Halaman Harga & Voucher (EN)
      harga_hero_pill: "OFFICIAL GTNIC 2026 SCHEME",
      harga_hero_title: "Transparent & Accessible Pricing for SMEs",
      harga_hero_sub: "Start with a full 1-month free trial. Extend with cost-effective 5-month or 1-year plans to enjoy unlimited customs automation and maritime cargo tracking.",
      voucher_badge: "GTNIC 2026 EXPORT DIGITAL SUBSIDY",
      voucher_status: "● Official Quota Available",
      voucher_title: "Digital Export Subsidy Program for Indonesian SMEs",
      voucher_desc: "Accelerate your global trade journey with an official <strong>15% flat subsidy voucher</strong> on 5-Month and 1-Year plans. Applied automatically with zero hidden fees.",
      voucher_val_label: "SUBSIDY DISCOUNT",
      voucher_btn_claim: "Apply 15% Voucher",
      wa_banner_title: "Looking for Multi-Year Plans or SME Cooperative Licenses?",
      wa_banner_desc: "Enjoy special volume pricing, multi-member accounts, and dedicated customs assistance.",
      wa_banner_btn: "💬 Contact Admin via WhatsApp",

      // Kartu Harga (EN)
      plan_1_badge: "EVALUATION SANDBOX",
      plan_1_name: "Starter / Sandbox Plan",
      plan_1_desc: "Trial access to KYC sandbox simulation, AI Incoterms calculator, and limited PDF generation (max 3/mo) for beginners or GTNIC 2026 evaluation.",
      plan_1_period: "/ Free Forever",
      plan_1_vat: "✓ 11% VAT Included • No Credit Card Required",
      plan_1_notice: "Free trial sandbox environment for GTNIC 2026 evaluation and new SME exporters.",
      plan_1_f1: "Trial Access to KYC Sandbox Simulation",
      plan_1_f2: "Basic Incoterms 2020 AI Calculator",
      plan_1_f3: "Limited Export PDF Drafting (Max 3/month)",
      plan_1_f4: "4-Phase Escrow Vault Simulation",
      plan_1_f5: "Browse 120 Featured Commodities",
      plan_1_f6: "Verified Seller Badge on Global Catalog",
      plan_1_f7: "Unlimited PDF Document Generation",
      plan_1_btn: "Start Free Sandbox",

      popular_ribbon: "MOST POPULAR",
      plan_2_badge: "EXPORTER RECOMMENDED",
      plan_2_name: "SME Exporter / Professional",
      plan_2_desc: "Full access to RFQ Studio, unlimited pricing calculator, automated PDF documentation, Verified Seller Badge, and Escrow Vault settlement.",
      duration_label: "Select Billing Duration:",
      dur_1m: "1 Month",
      dur_5m: "5 Months",
      dur_1y: "1 Year",
      save_20: "Save 20%",
      save_best: "Full 12 Months",
      save_25: "Save 20%",
      save_51: "Full 12 Months",
      original_price_label: "Original Price:",
      per_month: "/ month",
      plan_2_vat: "✓ Includes 11% VAT (Official Tax Invoice Available)",
      plan_2_f1: "Full Access to RFQ Studio & AI Sales Assistant",
      plan_2_f2: "Unlimited Export-Import Pricing Calculator (FOB, CIF, etc.)",
      plan_2_f3: "Unlimited PDF Trade Paperwork Automation",
      plan_2_f4: "Official Verified Seller Badge on Global Showcase",
      plan_2_f5: "Safe Milestone Payouts in Multi-Currency Escrow Vault",
      plan_2_f6: "Real-Time AIS Maritime Cargo Ship Tracking",
      plan_2_f7: "Priority WhatsApp Export Advisory & Support",
      plan_2_f8: "7-Day 100% Money-Back Guarantee & Prorated Refund",
      plan_2_btn: "Select Professional Plan (1 Year)",

      plan_3_badge: "ENTERPRISE & COOPERATIVES",
      plan_3_name: "Enterprise Plan",
      plan_3_desc: "Multi-seat access for corporations, trading associations, or export cooperatives, advanced logistics analytics, and custom trade workflows.",
      scheme_custom: "Custom",
      custom_val: "Quote",
      custom_period: "/ Contact Sales",
      plan_3_vat: "✓ 11% VAT Included • Official Corporate Invoicing",
      plan_3_f1: "Multi-User Seats (10 - 50 Member/Staff Accounts)",
      plan_3_f2: "Advanced Supply Chain & Shipping Route Analytics",
      plan_3_f3: "Customized Export Paperwork Aligned with Global Buyers",
      plan_3_f4: "Customs API, Forwarder & Bonded Warehouse Integrations",
      plan_3_f5: "On-Site Advisory & Direct In-Person B2B Buyer Matching",
      plan_3_f6: "24/7 Dedicated Account Manager & Trade Counsel",
      plan_3_btn: "Chat Admin on WhatsApp (Enterprise)",

      // Evaluasi GTNIC 2026 & Kalkulator Margin (EN)
      eval_note_badge: "GTNIC 2026 EVALUATION NOTE",
      eval_note_text: "<strong>Jury Evaluation Sandbox:</strong> During the GTNIC 2026 evaluation phase, all AI calculators and simulations are free to test.",
      calc_pill: "SME EXPORT MARGIN CALCULATOR",
      calc_title: "Calculate Your Export Profit Potential",
      calc_sub: "Simulate sales contract value, ocean freight, and net profits retained by local SMEs.",
      calc_label_contract: "Estimated Sales Contract Value (USD):",
      calc_label_prod: "Local Production & Packaging Cost (USD):",
      calc_label_freight: "Freight & Port Handling (FOB/CIF) (USD):",
      calc_label_escrow: "NusaBridge Escrow Fee (1.2%):",
      calc_label_net: "Estimated Net Profit:",
      calc_row_margin: "Profit Margin:",
      calc_row_dp: "Milestone 1 Payout (30% DP):",
      calc_row_status: "Fund Security Status:",
      calc_safe_tag: "100% Guaranteed Escrow Vault",
      calc_btn_consult: "Consult This Simulation",
      faq_pill: "FREQUENTLY ASKED QUESTIONS",

      // Halaman Solusi AI (EN)
      solusi_hero_pill: "CUTTING-EDGE AI AGENT TECHNOLOGY",
      solusi_hero_title: "Intelligent End-to-End Export Automation",
      solusi_hero_sub: "NusaBridge combines Large Language Models (LLM), automated global trade paperwork, and maritime AIS telemetry to empower Indonesian SMEs to compete worldwide without bureaucratic barriers.",
      solusi_chat_title: "NusaBridge AI",
      solusi_chat_sub: "Google Gemini 2.5 Flash • Direct Connected",
      solusi_disclaimer: "NusaBridge AI is ready to answer any export, trade, or technical question accurately and on-topic. Type freely to begin.",
      solusi_btn_clear: "Clear Chat",
      solusi_btn_send: "Send",
      solusi_input_ph: "Ask anything to NusaBridge AI... (e.g. How does AI work? or Calculate CIF Hamburg)",

      // Halaman Produk (EN)
      produk_hero_pill: "OFFICIAL EXPORT CATALOG",
      produk_hero_title: "Featured Commodities of Indonesian SMEs",
      produk_hero_sub: "All products have cleared NIB legal audits, lab quality tests, and profile verification by NusaBridge AI Agent ready for worldwide delivery.",
      produk_stat_1: "500+ Listed Commodities",
      produk_stat_2: "100% Tax & NIB Verified",
      produk_stat_3: "20+ Destination Countries",
      produk_stat_4: "FOB / CIF Incoterms Ready",
      produk_search_ph: "Search product name, origin, or HS Code (e.g. Gayo Coffee, Cloves, Rattan)...",
      sort_label: "Sort by:",
      sort_featured: "Most Popular",
      sort_price_low: "Price: Low to High",
      sort_price_high: "Price: High to Low",
      sort_moq_low: "Lowest MOQ",

      // Transparansi & Garansi (EN)
      guarantee_title: "7-Day 100% Money-Back Guarantee & Prorated Refunds",
      guarantee_desc: "NusaBridge offers an unconditional 100% refund within the first 7 days. For 5-month or 1-year plans, cancellations after day 7 are refunded on a fair prorated basis for remaining months.",
      tax_transparency_title: "Transparent Pricing: 11% VAT & Official BI Jisdor Rates",
      tax_transparency_desc: "All subscription prices already include 11% VAT with official tax invoices. Foreign currency conversions during Escrow payouts follow Bank Indonesia (BI Jisdor) mid-rates with a transparent spread max 0.35%.",

      // FAQ (EN)
      faq_main_title: "Frequently Asked Questions on Pricing, Guarantee & Trade",
      faq_q1: "Are there any hidden fees beyond the subscription price?",
      faq_a1: "<strong>No hidden fees whatsoever.</strong> We ensure total cost transparency:<br>1. <strong>Software Subscription:</strong> Starting at Rp 58,300/mo (1-year plan), fully inclusive of 11% VAT.<br>2. <strong>Escrow Vault Fee:</strong> Flat 1.2% on successfully settled invoice payouts.<br>3. <strong>Exchange Rate:</strong> Bank Indonesia (BI Jisdor) mid-rate on settlement day.",
      faq_q2: "When are buyer funds released and what rate is applied?",
      faq_a2: "Funds are released in 4 milestones: 30% advance on contract confirmation, 30% on container stuffing & PEB customs clearance, 20% upon On-Board Bill of Lading, and 20% final settlement upon port arrival. Deposited directly to your foreign exchange or IDR account.",
      faq_q3: "What if I want to cancel? What is the refund policy?",
      faq_a3: "Yes, NusaBridge provides a clear and fair refund policy:<br>• <strong>7-Day 100% Full Refund:</strong> If you cancel within the first 7 days, get a full 100% refund without deduction.<br>• <strong>Prorated Refund for Multi-Month Plans:</strong> Remaining unused months are refunded proportionally.",
      faq_q4: "Can micro-enterprises with individual NIB start immediately?",
      faq_a4: "Yes! With your standard NIB (Nomor Induk Berusaha) from OSS RBA, NusaBridge KYC Hub will automatically guide your customs access activation so you can trade globally.",

      // Sandbox Mockup (EN)
      settings_title: "Profile Settings & Escrow Vault Account",
      settings_save: "Save Changes"
    }
  };

  function showToast(message) {
    if (!langToast) return;
    langToast.innerHTML = `<span>${message}</span>`;
    langToast.classList.add('show');
    clearTimeout(langToast._timer);
    langToast._timer = setTimeout(() => {
      langToast.classList.remove('show');
    }, 2400);
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('nusabridge_lang', lang);
    document.documentElement.lang = lang;

    // Update Dropdown UI
    if (currentLangLabel) {
      currentLangLabel.textContent = lang.toUpperCase();
    }

    langOptionItems.forEach(item => {
      const itemLang = item.getAttribute('data-lang');
      const checkEl = item.querySelector('.lang-check');
      if (itemLang === lang) {
        item.classList.add('active');
        if (checkEl) checkEl.textContent = '✓';
      } else {
        item.classList.remove('active');
        if (checkEl) checkEl.textContent = '';
      }
    });

    const dict = translations[lang] || translations.id;

    // Update all elements with data-i18n
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        // If content contains HTML tags, use innerHTML
        if (dict[key].includes('<') && dict[key].includes('>')) {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    // Update Input Placeholders
    const i18nPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
    i18nPlaceholders.forEach(el => {
      const phKey = el.getAttribute('data-i18n-placeholder');
      if (dict[phKey]) {
        el.placeholder = dict[phKey];
      }
    });

    const mockupSearch = document.getElementById('mockupSearchInput');
    if (mockupSearch && dict.mock_search_placeholder) {
      mockupSearch.placeholder = dict.mock_search_placeholder;
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput && dict.chat_input_placeholder) {
      chatInput.placeholder = dict.chat_input_placeholder;
    }

    const prodSearch = document.getElementById('productSearchInput');
    if (prodSearch && dict.produk_search_ph) {
      prodSearch.placeholder = dict.produk_search_ph;
    }

    const geminiPrompt = document.getElementById('geminiUserPromptInput');
    if (geminiPrompt && dict.solusi_input_ph) {
      geminiPrompt.placeholder = dict.solusi_input_ph;
    }
  }

  // Toggle dropdown menu
  if (langSelectorBtn && langDropdownWrapper) {
    langSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = langDropdownWrapper.classList.toggle('open');
      langSelectorBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!langDropdownWrapper.contains(e.target)) {
        langDropdownWrapper.classList.remove('open');
        langSelectorBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Click on option item
    langOptionItems.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = btn.getAttribute('data-lang');
        if (selectedLang) {
          applyLanguage(selectedLang);
          langDropdownWrapper.classList.remove('open');
          langSelectorBtn.setAttribute('aria-expanded', 'false');
          const dict = translations[selectedLang] || translations.id;
          showToast(dict.toast_msg);
        }
      });
    });
  }

  // Apply initial language preference
  applyLanguage(currentLang);

  // ==================== 4. PRODUCT CATEGORY FILTER ====================
  const catPills = document.querySelectorAll('.cat-pill');
  const productCards = document.querySelectorAll('.product-card');

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Toggle active class
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const selectedCat = pill.getAttribute('data-category');

      productCards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (selectedCat === 'all' || cardCat === selectedCat) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transition = 'opacity 0.3s ease';
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ==================== 5. PRODUCT CAROUSEL ARROWS ====================
  const productsCarousel = document.getElementById('productsCarousel');
  const btnPrevProduct = document.getElementById('btnPrevProduct');
  const btnNextProduct = document.getElementById('btnNextProduct');

  if (productsCarousel && btnPrevProduct && btnNextProduct) {
    btnPrevProduct.addEventListener('click', () => {
      productsCarousel.scrollBy({
        left: -240,
        behavior: 'smooth'
      });
    });

    btnNextProduct.addEventListener('click', () => {
      productsCarousel.scrollBy({
        left: 240,
        behavior: 'smooth'
      });
    });
  }

  // Klik Kartu Produk Beranda -> Arahkan Langsung ke Halaman Katalog Produk
  productCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const prodName = card.querySelector('.product-name')?.innerText || '';
      window.location.href = `produk.html?search=${encodeURIComponent(prodName)}`;
    });
  });

  // ==================== 6. INTERACTIVE AI AGENT CHAT ====================
  const chatArea = document.getElementById('chatArea');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const suggestButtons = document.querySelectorAll('.chat-suggest-btn');

  // Knowledge Engine Respons Cerdas Berbahasa Alami (NusaBridge AI Standar GTNIC 2026)
  function getSmartIndexReply(userQuery, lang) {
    const raw = (userQuery || '').trim();
    const q = raw.toLowerCase();
    const isEn = lang === 'en' || q.includes('how') || q.includes('what') || q.includes('hello') || q.includes('hi ');

    // 1. Cara Kerja AI / Artificial Intelligence / Machine Learning
    if (q.includes('cara kerja ai') || q.includes('how ai works') || q.includes('how does ai work') || q.includes('apa itu ai') || q.includes('what is ai') || q.includes('kecerdasan buatan') || q.includes('machine learning') || q.includes('deep learning') || q.includes('neural network') || q.includes('llm') || q.includes('model ai')) {
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
    if (q === 'halo' || q === 'hai' || q === 'hi' || q === 'hello' || q.startsWith('halo ') || q.startsWith('hai ') || q.includes('selamat pagi') || q.includes('selamat siang') || q.includes('selamat malam') || q.includes('apa kabar')) {
      return `Halo! Saya adalah **NusaBridge AI**, asisten perdagangan ekspor-impor cerdas untuk UMKM Indonesia.

Ada yang bisa saya bantu hari ini? Anda dapat menanyakan:
• Cara kerja kecerdasan buatan NusaBridge AI
• Kalkulasi harga Incoterms 2020 (FOB, Ocean Freight, Asuransi, CIF)
• Pengecekan izin usaha NIB OSS & sertifikasi karantina
• Rekomendasi 120 komoditas ekspor unggulan (Kopi, Rempah, Kriya, Tekstil)
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

  function appendUserMessage(text) {
    const userRow = document.createElement('div');
    userRow.className = 'chat-bubble-row';
    userRow.innerHTML = `
      <div class="chat-bubble user-bubble">${escapeHtml(text)}</div>
    `;
    chatArea.appendChild(userRow);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function appendAgentMessage(text) {
    const agentRow = document.createElement('div');
    agentRow.className = 'chat-bubble-row';
    agentRow.innerHTML = `
      <div class="agent-avatar-icon">
        <img src="/assets/icons/icon-1.webp" alt="AI Agent Icon">
      </div>
      <div class="chat-bubble agent-bubble">${formatAiText(text)}</div>
    `;
    chatArea.appendChild(agentRow);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function appendTypingIndicator() {
    const typingRow = document.createElement('div');
    typingRow.className = 'chat-bubble-row';
    typingRow.id = 'typingIndicator';
    const msg = currentLang === 'en' ? 'NusaBridge AI is processing your inquiry...' : 'NusaBridge AI sedang menganalisis data...';
    typingRow.innerHTML = `
      <div class="agent-avatar-icon">
        <img src="/assets/icons/icon-1.webp" alt="AI Agent Icon">
      </div>
      <div class="chat-bubble agent-bubble" style="font-style: italic; color: #64748b;">
        ${msg}
      </div>
    `;
    chatArea.appendChild(typingRow);
    chatArea.scrollTop = chatArea.scrollHeight;
    return typingRow;
  }

  async function handleAiQuery(queryText) {
    if (!queryText || !queryText.trim()) return;
    const cleanText = queryText.trim();
    appendUserMessage(cleanText);
    const typing = appendTypingIndicator();

    const storedApiKey = localStorage.getItem('nb_gemini_api_key') || '';
    let apiEndpoint = '/api/ai/chat';
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) {
      apiEndpoint = 'http://localhost:5000/api/ai/chat';
    }

    // Gunakan AbortController dengan batas waktu 15 detik agar memberi waktu respons AI resmi tanpa hang
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          apiKey: storedApiKey
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          if (typing) typing.remove();
          appendAgentMessage(data.reply);
          return;
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      // Backend offline atau timeout, langsung fallback ke smart engine lokal
    }

    setTimeout(() => {
      if (typing) typing.remove();
      const reply = getSmartIndexReply(cleanText, currentLang);
      appendAgentMessage(reply);
    }, 350);
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      handleAiQuery(text);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatAiText(str) {
    if (!str) return '';
    let text = String(str).replace(/<[^>]*>/g, '');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/^#{1,6}\s*(.*$)/gm, '<strong>$1</strong>');
    text = text.replace(/^>\s*/gm, '💡 ');
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br>');
    return text;
  }

  // ==================== 7. MODALS POPUP LOGIC ====================
  const authModal = document.getElementById('authModal');
  const demoModal = document.getElementById('demoModal');
  const infoModal = document.getElementById('infoModal');

  // Trigger buttons
  const btnMasuk = document.getElementById('btnMasuk');
  const btnMasukMobile = document.getElementById('btnMasukMobile');
  const btnDaftar = document.getElementById('btnDaftar');
  const btnDaftarMobile = document.getElementById('btnDaftarMobile');
  const btnHeroExport = document.getElementById('btnHeroExport');
  const btnHeroDemo = document.getElementById('btnHeroDemo');
  const btnCtaDaftar = document.getElementById('btnCtaDaftar');
  const btnCtaContact = document.getElementById('btnCtaContact');

  // Close buttons
  const closeAuthModal = document.getElementById('closeAuthModal');
  const closeDemoModal = document.getElementById('closeDemoModal');
  const closeInfoModal = document.getElementById('closeInfoModal');
  const btnOkInfo = document.getElementById('btnOkInfo');

  function openModal(modal) {
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active', 'show');
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('active', 'show');
      modal.style.display = 'none';
    }
  }

  // Open Auth modal (Login)
  [btnMasuk, btnMasukMobile].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        const titleEl = document.getElementById('authModalTitle');
        if (titleEl) {
          titleEl.innerText = currentLang === 'en' ? 'Log In to NusaBridge' : 'Masuk ke NusaBridge';
        }
        openModal(authModal);
      });
    }
  });

  // Open Auth modal (Register)
  [btnDaftar, btnDaftarMobile, btnHeroExport, btnCtaDaftar].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        const titleEl = document.getElementById('authModalTitle');
        if (titleEl) {
          titleEl.innerText = currentLang === 'en' ? 'Register NusaBridge Account' : 'Daftar Akun NusaBridge';
        }
        openModal(authModal);
      });
    }
  });

  // Open Demo modal
  if (btnHeroDemo) {
    btnHeroDemo.addEventListener('click', () => openModal(demoModal));
  }

  // Open Contact modal
  if (btnCtaContact) {
    btnCtaContact.addEventListener('click', () => {
      document.getElementById('infoModalTitle').innerText = currentLang === 'en' ? 'Contact NusaBridge Team' : 'Hubungi Tim NusaBridge';
      document.getElementById('infoModalBody').innerHTML = currentLang === 'en'
        ? 'Reach us at:<br><strong>Email:</strong> support@nusabridge.id<br><strong>WhatsApp Hotline:</strong> <a href="https://wa.me/6285735800491" target="_blank" style="color:#1b68f8; font-weight:700;">+62 857-3580-0491</a><br><strong>Address:</strong> SMK Antartika 1 Sidoarjo / Tim Arjika Labs'
        : 'Hubungi kami melalui:<br><strong>Email:</strong> support@nusabridge.id<br><strong>WhatsApp Hotline:</strong> <a href="https://wa.me/6285735800491" target="_blank" style="color:#1b68f8; font-weight:700;">+62 857-3580-0491</a><br><strong>Lokasi:</strong> SMK Antartika 1 Sidoarjo / Tim Arjika Labs';
      openModal(infoModal);
    });
  }

  // Footer info modals
  document.querySelectorAll('.open-info-modal').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const title = link.getAttribute('data-title');
      document.getElementById('infoModalTitle').innerText = title;
      document.getElementById('infoModalBody').innerText = currentLang === 'en'
        ? `"${title}" is an official reference and documentation module for the GTNIC 2026 prototype exhibition.`
        : `Bagian "${title}" merupakan modul dokumentasi dan referensi resmi prototype NusaBridge untuk perlombaan GTNIC 2026.`;
      openModal(infoModal);
    });
  });

  // Universal close button listener for all modal close buttons (&times; / silang)
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const parentModal = btn.closest('.modal-overlay');
      if (parentModal) {
        closeModal(parentModal);
      }
    });
  });

  // Close modals listeners explicit IDs
  if (closeAuthModal) closeAuthModal.addEventListener('click', () => closeModal(authModal));
  if (closeDemoModal) closeDemoModal.addEventListener('click', () => closeModal(demoModal));
  if (closeInfoModal) closeInfoModal.addEventListener('click', () => closeModal(infoModal));
  if (btnOkInfo) btnOkInfo.addEventListener('click', () => closeModal(infoModal));

  // Close modal when clicking outside card (backdrop)
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Close modal with ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      document.querySelectorAll('.modal-overlay.active, .modal-overlay.show').forEach(m => closeModal(m));
    }
  });

  // Modal Auth tabs (Seller vs Buyer)
  const tabSeller = document.getElementById('tabSeller');
  const tabBuyer = document.getElementById('tabBuyer');
  if (tabSeller && tabBuyer) {
    tabSeller.addEventListener('click', () => {
      tabSeller.classList.add('active');
      tabBuyer.classList.remove('active');
    });
    tabBuyer.addEventListener('click', () => {
      tabBuyer.classList.add('active');
      tabSeller.classList.remove('active');
    });
  }

  // ==================== 8. SESSION & USER AUTH (LOGIN / REGISTER) ====================
  const userLoggedNav = document.getElementById('userLoggedNav');
  const navUserCompanyName = document.getElementById('navUserCompanyName');
  const btnLogoutNav = document.getElementById('btnLogoutNav');

  function checkUserSession() {
    try {
      const sessionData = localStorage.getItem('nusabridge_session');
      if (sessionData) {
        const user = JSON.parse(sessionData);
        if (user && user.loggedIn) {
          // Sembunyikan tombol Masuk & Daftar
          if (btnMasuk) btnMasuk.style.display = 'none';
          if (btnDaftar) btnDaftar.style.display = 'none';
          if (btnMasukMobile) btnMasukMobile.style.display = 'none';
          if (btnDaftarMobile) btnDaftarMobile.style.display = 'none';

          // Tampilkan status profil di navbar
          if (userLoggedNav) {
            userLoggedNav.style.display = 'inline-flex';
            if (navUserCompanyName) {
              navUserCompanyName.innerText = user.company || user.name || 'CV Kopi Nusantara';
            }
          }

          // Sinkronkan nama di mockup bar jika ada
          const mockupName = document.querySelector('.user-name');
          const mockupRole = document.querySelector('.user-role');
          if (mockupName) mockupName.innerText = user.name || 'Budi Santoso';
          if (mockupRole) mockupRole.innerHTML = `${user.company || 'UMKM Mandiri'} <span class="arrow-sub">●</span>`;
          return;
        }
      }
    } catch (e) {
      console.warn('Session check error:', e);
    }

    // Jika belum login, tampilkan tombol default
    if (btnMasuk) btnMasuk.style.display = '';
    if (btnDaftar) btnDaftar.style.display = '';
    if (userLoggedNav) userLoggedNav.style.display = 'none';
  }

  // Tombol Logout di Navbar
  if (btnLogoutNav) {
    btnLogoutNav.addEventListener('click', () => {
      localStorage.removeItem('nusabridge_session');
      checkUserSession();
      showToast('👋 Anda telah keluar dari sesi akun.');
    });
  }

  // Jalankan pemeriksaan sesi saat halaman dimuat
  checkUserSession();

  // Auth form submit simulation & direct login
  const authForm = document.getElementById('authForm');
  const selectedPlanInput = document.getElementById('selectedPlanInput');
  const appliedDiscountInput = document.getElementById('appliedDiscountInput');

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Ambil nilai input dari formulir modal
      const companyInput = authForm.querySelector('input[type="text"][placeholder*="UMKM"], input[type="text"]:not([readonly])');
      const emailInput = authForm.querySelector('input[type="email"]');
      const companyName = companyInput ? companyInput.value.trim() : 'CV Kopi Nusantara Mandiri';
      const emailVal = emailInput ? emailInput.value.trim() : 'owner@bisnis.id';
      const userName = companyName.replace(/^(CV|PT|UD|Koperasi)\s*/i, '');

      // Simpan sesi login langsung di browser
      const sessionUser = {
        loggedIn: true,
        name: userName || 'Budi Santoso',
        company: companyName || 'CV Kopi Nusantara Mandiri',
        email: emailVal,
        role: tabBuyer && tabBuyer.classList.contains('active') ? 'buyer' : 'seller',
        nib: '1294801928415',
        plan: selectedPlanInput ? selectedPlanInput.value : 'Free Trial (1 Bulan)',
        token: `nb_session_${Date.now()}`
      };

      try {
        localStorage.setItem('nusabridge_session', JSON.stringify(sessionUser));
      } catch (err) {}

      // Coba kirim data ke backend jika aktif
      try {
        const apiBase = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';
        fetch(`${apiBase}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionUser)
        }).catch(() => {});
      } catch (err) {}

      // Update UI navbar secara instan
      checkUserSession();
      closeModal(authModal);

      if (selectedPlanInput && selectedPlanInput.value) {
        const planText = selectedPlanInput.value;
        const discText = appliedDiscountInput ? appliedDiscountInput.value : '';
        const hasDisc = discText && !discText.includes('Tanpa Diskon');
        alert(`🎉 Selamat! Pendaftaran berhasil & Anda otomatis masuk ke akun.\n\n• Nama Usaha: ${companyName}\n• Paket Aktif: ${planText}${hasDisc ? '\n• Promo Terpasang: ' + discText : ''}\n\nLayanan ekspor Anda siap digunakan.`);
      } else {
        alert(`🎉 Selamat datang, ${companyName}! Anda telah berhasil masuk.`);
      }
    });
  }

  // ==================== 9. MOCKUP INTERACTIVE SANDBOX VIEWS SWITCHER ====================
  const mockupViews = {
    overview: document.getElementById('mockupViewOverview'),
    products: document.getElementById('mockupViewProducts'),
    rfq: document.getElementById('mockupViewRfq'),
    docs: document.getElementById('mockupViewDocs'),
    logistics: document.getElementById('mockupViewLogistics'),
    kyc: document.getElementById('mockupViewKyc'),
    settings: document.getElementById('mockupViewSettings')
  };

  function switchMockupView(targetViewKey) {
    // Sembunyikan semua sandbox view
    Object.values(mockupViews).forEach(viewEl => {
      if (viewEl) viewEl.style.display = 'none';
    });

    // Tampilkan view yang dipilih
    if (mockupViews[targetViewKey]) {
      mockupViews[targetViewKey].style.display = 'flex';
    } else if (mockupViews.overview) {
      mockupViews.overview.style.display = 'flex';
    }
  }

  document.querySelectorAll('.mockup-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.mockup-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const viewKey = item.getAttribute('data-view') || 'overview';
      switchMockupView(viewKey);

      const viewLabels = {
        overview: currentLang === 'en' ? '🏠 Export Home Dashboard Active' : '🏠 Dashboard Beranda Ekspor Aktif',
        products: currentLang === 'en' ? '📦 Export Commodity Catalog Active' : '📦 Manajemen Katalog Produk Ekspor Aktif',
        rfq: currentLang === 'en' ? '⚡ AI RFQ Studio & Pricing Active' : '⚡ AI RFQ Studio & Negosiasi Harga Aktif',
        docs: currentLang === 'en' ? '📄 AI Trade Document Generator Active' : '📄 AI Export Document Generator Sandbox Aktif',
        logistics: currentLang === 'en' ? '🚢 AIS Maritime Radar Tracking Active' : '🚢 Pelacakan Radar Maritim & Logistik Aktif',
        kyc: currentLang === 'en' ? '🛡️ KYC Hub: OSS Verification Active' : '🛡️ KYC Hub: Validasi NIB & NPWP OSS Aktif',
        settings: currentLang === 'en' ? '⚙️ Profile & Escrow Account Settings' : '⚙️ Pengaturan Profil Usaha & Rekening Escrow'
      };
      if (typeof showToast === 'function') {
        showToast(viewLabels[viewKey] || 'Sandbox Aktif');
      }
    });
  });

  // Global Hash Routing Handler (agar link #kyc, #docs, #rfq, #logistics, #login, #register berfungsi dari mana saja)
  function handleUrlHashRouting() {
    const rawHash = (window.location.hash || '').replace('#', '').toLowerCase();
    if (!rawHash) return;

    if (rawHash === 'login' || rawHash === 'masuk') {
      const titleEl = document.getElementById('authModalTitle');
      if (titleEl) titleEl.innerText = currentLang === 'en' ? 'Log In to NusaBridge' : 'Masuk ke NusaBridge';
      openModal(authModal);
      return;
    }

    if (rawHash === 'daftar' || rawHash === 'register') {
      const titleEl = document.getElementById('authModalTitle');
      if (titleEl) titleEl.innerText = currentLang === 'en' ? 'Register NusaBridge Account' : 'Daftar Akun NusaBridge';
      openModal(authModal);
      return;
    }

    const viewAliases = {
      kyc: 'kyc',
      'kyc-hub': 'kyc',
      logistik: 'logistics',
      logistics: 'logistics',
      dokumen: 'docs',
      docs: 'docs',
      rfq: 'rfq',
      'rfq-studio': 'rfq',
      produk: 'products',
      products: 'products',
      pengaturan: 'settings',
      settings: 'settings',
      beranda: 'overview',
      overview: 'overview'
    };

    const targetKey = viewAliases[rawHash];
    if (targetKey) {
      const targetNav = document.querySelector(`.mockup-nav-item[data-view="${targetKey}"]`);
      if (targetNav) {
        document.querySelectorAll('.mockup-nav-item').forEach(i => i.classList.remove('active'));
        targetNav.classList.add('active');
        switchMockupView(targetKey);

        const showcaseEl = document.querySelector('.section-dashboard-showcase');
        if (showcaseEl) {
          showcaseEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }

  window.addEventListener('hashchange', handleUrlHashRouting);
  setTimeout(handleUrlHashRouting, 150);

  // Tombol aksi cepat kalkulasi RFQ dari dalam produk sandbox
  document.querySelectorAll('.btn-quick-rfq').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const prodName = btn.getAttribute('data-product') || 'Produk';
      const rfqNavItem = document.querySelector('.mockup-nav-item[data-view="rfq"]');
      if (rfqNavItem) {
        document.querySelectorAll('.mockup-nav-item').forEach(i => i.classList.remove('active'));
        rfqNavItem.classList.add('active');
        switchMockupView('rfq');
        if (typeof showToast === 'function') {
          showToast(`⚡ Memuat simulasi RFQ untuk: ${prodName}`);
        }
      }
    });
  });

  // Tombol refresh AIS di tab logistik sandbox
  const btnRefreshAis = document.getElementById('btnRefreshAis');
  if (btnRefreshAis) {
    btnRefreshAis.addEventListener('click', () => {
      btnRefreshAis.textContent = 'Memperbarui AIS...';
      btnRefreshAis.disabled = true;
      setTimeout(() => {
        btnRefreshAis.textContent = '🔄 Refresh Telemetri AIS';
        btnRefreshAis.disabled = false;
        if (typeof showToast === 'function') {
          showToast('🟢 Telemetri AIS 3 Kapal Kargo Berhasil Diperbarui!');
        }
      }, 700);
    });
  }

  // ---------- 9A. LOGIKA INTERAKTIF DOKUMEN GENERATOR SANDBOX ----------
  const docTypeSelect = document.getElementById('docTypeSelect');
  const docCommoditySelect = document.getElementById('docCommoditySelect');
  const docIncotermsSelect = document.getElementById('docIncotermsSelect');
  const dppTitle = document.getElementById('dppTitle');
  const dppDocNo = document.getElementById('dppDocNo');
  const dppItemDesc = document.getElementById('dppItemDesc');
  const dppBuyerName = document.getElementById('dppBuyerName');
  const btnPrintExportDoc = document.getElementById('btnPrintExportDoc');

  function updateDocPreview() {
    const docType = docTypeSelect ? docTypeSelect.value : 'invoice';
    const comm = docCommoditySelect ? docCommoditySelect.value : 'Kopi Arabika Gayo Specialty Grade 1';
    const terms = docIncotermsSelect ? docIncotermsSelect.value : 'CIF Hamburg, Germany';

    const titleMap = {
      invoice: 'PROFORMA INVOICE',
      contract: 'INTERNATIONAL SALES CONTRACT',
      peb: 'PEMBERITAHUAN EKSPOR BARANG (PEB)',
      coo: 'CERTIFICATE OF ORIGIN (FORM A)'
    };

    if (dppTitle) dppTitle.innerText = titleMap[docType] || 'PROFORMA INVOICE';
    if (dppDocNo) {
      dppDocNo.innerText = `No: NB-${docType.toUpperCase()}-2026-X-${Math.floor(100 + Math.random() * 900)} • Tanggal: 19 Oktober 2026`;
    }
    if (dppItemDesc) {
      dppItemDesc.innerText = comm;
    }
    if (dppBuyerName) {
      dppBuyerName.innerText = `Nordic Coffee Importers GmbH (${terms})`;
    }
  }

  [docTypeSelect, docCommoditySelect, docIncotermsSelect].forEach(sel => {
    if (sel) sel.addEventListener('change', updateDocPreview);
  });

  function downloadDocHtmlFile(filename, title, bodyHtml) {
    const fullDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; background: #fff; }
    .container { max-width: 820px; margin: 0 auto; border: 2px solid #0f172a; padding: 32px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: 800; color: #1e3a8a; }
    .seal { font-size: 11px; font-weight: 800; color: #059669; border: 1.5px solid #059669; padding: 4px 10px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12.5px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; color: #1e293b; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
    .btn-print { background: #1b68f8; color: #fff; border: none; padding: 8px 16px; font-weight: 700; border-radius: 6px; cursor: pointer; margin-bottom: 16px; font-size: 13px; }
    @media print { .btn-print { display: none; } body { margin: 0; } .container { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div style="text-align: right; max-width: 820px; margin: 0 auto;">
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
  </div>
  <div class="container">
    ${bodyHtml}
  </div>
</body>
</html>`;
    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (btnPrintExportDoc) {
    btnPrintExportDoc.addEventListener('click', () => {
      const docType = docTypeSelect ? docTypeSelect.value : 'invoice';
      const comm = docCommoditySelect ? docCommoditySelect.value : 'Kopi Arabika Gayo Specialty Grade 1';
      const terms = docIncotermsSelect ? docIncotermsSelect.value : 'CIF Hamburg, Germany';
      const docNo = dppDocNo ? dppDocNo.innerText : 'NB-DOC-2026-X-049';
      const titleText = dppTitle ? dppTitle.innerText : 'DOKUMEN RESMI EKSPOR';

      const docBody = `
        <div class="header">
          <div>
            <div class="title">${titleText}</div>
            <div style="font-size:12px; color:#64748b; margin-top:4px;">${docNo}</div>
          </div>
          <div class="seal">✓ ICC INCOTERMS 2020 STANDARD</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; font-size:12px; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">
          <div>
            <strong style="color:#0f172a; text-transform:uppercase;">Eksportir Terdaftar (Seller):</strong>
            <p style="margin:4px 0 0; color:#334155;">
              <strong>CV Kopi Nusantara Bersama</strong><br>
              NIB: 1294801928415 &bull; NPWP: 01.234.567.8-012.000<br>
              Status: Verified Global Exporter Shield
            </p>
          </div>
          <div>
            <strong style="color:#0f172a; text-transform:uppercase;">Penerima / Buyer:</strong>
            <p style="margin:4px 0 0; color:#334155;">
              <strong>Nordic Coffee Importers GmbH</strong><br>
              Am Sandtorkai 48, Hamburg, Germany<br>
              Delivery Terms: <strong>${terms}</strong>
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Deskripsi Komoditas</th>
              <th>Kuantitas</th>
              <th>Ketentuan Pengiriman</th>
              <th>Total Nilai Ekspor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${comm}</strong><br><small style="color:#64748b;">Standar Mutu Ekspor, Bebas Hama, Uji Laboratorium Terlampir</small></td>
              <td>1 Kontainer (FCL 20ft)</td>
              <td><strong>${terms}</strong></td>
              <td><strong style="color:#059669;">USD $85,400.00</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:10px 14px; border-radius:6px; font-size:11.5px; color:#065f46; margin-top:14px;">
          <strong>Jaminan Transaksi Escrow Vault:</strong> 100% dana telah terkunci di rekening Escrow multi-valas. Pelepasan dana otomatis dalam 4 tahap: 30% Uang Muka, 30% Terbit PEB Bea Cukai, 20% Bill of Lading terbit, 20% Tiba di Pelabuhan Tujuan.
        </div>

        <div class="footer">
          <div>
            <span>Diterbitkan secara digital oleh platform NusaBridge AI</span><br>
            <span>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</span>
          </div>
          <div style="text-align:right;">
            <span>Standar International Chamber of Commerce (ICC)</span><br>
            <strong>NusaBridge Trade Facilitation</strong>
          </div>
        </div>
      `;

      downloadDocHtmlFile(`Dokumen-Ekspor-${docType.toUpperCase()}-${comm.replace(/[^a-zA-Z0-9]/g, '-')}.html`, `${titleText} - ${comm}`, docBody);
      showToast('📄 Dokumen ekspor resmi berhasil diunduh ke perangkat Anda!');
      setTimeout(() => {
        window.print();
      }, 500);
    });
  }

  // ---------- 9B. LOGIKA INTERAKTIF KYC HUB (NIB & NPWP OSS SANDBOX) ----------
  const kycNibInput = document.getElementById('kycNibInput');
  const kycCompanyInput = document.getElementById('kycCompanyInput');
  const btnSampleNibValid = document.getElementById('btnSampleNibValid');
  const btnSampleNibInvalid = document.getElementById('btnSampleNibInvalid');
  const btnVerifyKyc = document.getElementById('btnVerifyKyc');
  const kycResultBox = document.getElementById('kycResultBox');
  const kycResultTitle = document.getElementById('kycResultTitle');
  const kycResultMsg = document.getElementById('kycResultMsg');
  const kycResultDetails = document.getElementById('kycResultDetails');

  if (btnSampleNibValid) {
    btnSampleNibValid.addEventListener('click', () => {
      if (kycNibInput) kycNibInput.value = '1294801928415';
      if (kycCompanyInput) kycCompanyInput.value = 'CV Kopi Nusantara Mandiri';
      executeKycVerification();
    });
  }

  if (btnSampleNibInvalid) {
    btnSampleNibInvalid.addEventListener('click', () => {
      if (kycNibInput) kycNibInput.value = '9999000011112';
      if (kycCompanyInput) kycCompanyInput.value = 'Usaha Tanpa NIB Terdaftar';
      executeKycVerification();
    });
  }

  function executeKycVerification() {
    const rawNib = kycNibInput ? kycNibInput.value.replace(/\D/g, '') : '';
    const comp = kycCompanyInput ? kycCompanyInput.value : 'Pelaku Usaha';

    if (rawNib.length !== 13) {
      alert('⚠️ Format NIB salah! NIB OSS Indonesia harus memiliki tepat 13 digit angka.');
      return;
    }

    if (!kycResultBox) return;

    // Tampilkan loading sebentar
    kycResultTitle.innerText = 'Memverifikasi ke Server OSS Berbasis Risiko...';
    kycResultMsg.innerText = 'Melakukan cross-check hak kepabeanan dan legalitas nomor induk berusaha.';

    setTimeout(() => {
      const isValid = !rawNib.startsWith('999');

      if (isValid) {
        kycResultBox.style.background = '#f0fdf4';
        kycResultBox.style.borderColor = '#86efac';
        kycResultTitle.innerText = `🛡️ VERIFIED GLOBAL EXPORTER (VGE-2026)`;
        kycResultTitle.style.color = '#14532d';
        kycResultMsg.innerText = `Badan usaha "${comp}" terdaftar resmi pada Sistem OSS Berbasis Risiko (NIB: ${rawNib}). Memiliki hak kepabeanan ekspor sah.`;
        if (kycResultDetails) {
          kycResultDetails.style.display = 'grid';
          kycResultDetails.innerHTML = `
            <div><strong>Status OSS:</strong> <span style="color:#059669;">AKTIF &amp; VALID</span></div>
            <div><strong>NIB:</strong> ${rawNib}</div>
            <div><strong>Klasifikasi:</strong> KBLI 46311 (Kopi &amp; Rempah)</div>
            <div><strong>Hak Akses:</strong> Angka Pengenal Ekspor (API)</div>
          `;
        }
        showToast('✓ NIB Terverifikasi 100%! Lencana eksportir resmi aktif.');
      } else {
        kycResultBox.style.background = '#fef2f2';
        kycResultBox.style.borderColor = '#fca5a5';
        kycResultTitle.innerText = `✕ NIB TIDAK DITEMUKAN DI OSS`;
        kycResultTitle.style.color = '#991b1b';
        kycResultMsg.innerText = `Nomor Induk Berusaha ${rawNib} tidak ditemukan pada basis data OSS RBA. Harap lengkapi registrasi di oss.go.id.`;
        if (kycResultDetails) {
          kycResultDetails.style.display = 'none';
        }
        showToast('⚠️ NIB tidak terdaftar pada sandbox OSS.');
      }
    }, 450);
  }

  if (btnVerifyKyc) {
    btnVerifyKyc.addEventListener('click', executeKycVerification);
  }

  // ---------- 9C. LOGIKA INTERAKTIF RFQ STUDIO DI MOCKUP ----------
  const btnNegoRfq = document.getElementById('btnNegoRfq');
  const btnAcceptRfq = document.getElementById('btnAcceptRfq');

  if (btnNegoRfq) {
    btnNegoRfq.addEventListener('click', () => {
      const counterPrice = prompt('Masukkan harga penawaran tandingan (Counter Offer USD / Kg):', '9.45');
      if (counterPrice) {
        showToast(`🤝 Mengirim tawaran balik (Counter Offer) USD ${counterPrice}/Kg ke buyer Hamburg via AI Agent...`);
      }
    });
  }

  const btnSaveMockupSettings = document.getElementById('btnSaveMockupSettings');
  if (btnSaveMockupSettings) {
    btnSaveMockupSettings.addEventListener('click', () => {
      const compName = document.getElementById('settingCompanyName')?.value || 'Perusahaan';
      showToast(`✓ Pengaturan profil ${compName} & rekening Escrow DHE berhasil disimpan!`);
    });
  }

  if (btnAcceptRfq) {
    btnAcceptRfq.addEventListener('click', () => {
      showToast('✓ Penawaran buyer disetujui! Mengarahkan ke pembuatan dokumen ekspor...');
      // Otomatis pindah ke view Dokumen
      const docsNavItem = document.querySelector('.mockup-nav-item[data-view="docs"]');
      if (docsNavItem) {
        document.querySelectorAll('.mockup-nav-item').forEach(i => i.classList.remove('active'));
        docsNavItem.classList.add('active');
        switchMockupView('docs');
      }
    });
  }

  // Notification Icon Click in Mockup
  const mockupBell = document.querySelector('.mockup-icon-btn');
  if (mockupBell) {
    mockupBell.addEventListener('click', () => {
      showToast('🔔 2 Pesan Baru: Buyer Hamburg menyetujui RFQ; Kapal KM Baruna memasuki rute Selat Malaka.');
    });
  }

  // Profile Click in Mockup
  const mockupProfile = document.querySelector('.mockup-user-profile');
  if (mockupProfile) {
    mockupProfile.addEventListener('click', () => {
      showToast('👤 Akun UMKM Indonesia • Status: Verified Seller (NIB: 1294801928415)');
    });
  }

});

