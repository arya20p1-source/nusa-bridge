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
      why_2_desc: "Menggunakan Google Gemini untuk analisis, rekomendasi, dan otomasi dokumen.",
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
      modal_register_title: "Daftar Akun NusaBridge"
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
      chat_greeting: "Hello! I am NusaBridge AI Agent. I can help analyze RFQs, suggest export pricing, and prepare trade documents.",
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
      why_2_desc: "Harnessing Google Gemini for real-time analysis, insights, and paperwork automation.",
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
      modal_register_title: "Register NusaBridge Account"
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
    const mockupSearch = document.getElementById('mockupSearchInput');
    if (mockupSearch && dict.mock_search_placeholder) {
      mockupSearch.placeholder = dict.mock_search_placeholder;
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput && dict.chat_input_placeholder) {
      chatInput.placeholder = dict.chat_input_placeholder;
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

  // Pre-defined smart AI answers for exporter workflow
  const aiResponses = {
    id: {
      'Analisis permintaan buyer (RFQ)': 
        '📊 **Analisis RFQ Berhasil!**\nBuyer dari Jerman menanyakan ketersediaan 10 MT Biji Kopi Gayo grade 1. Standar spesifikasi kelembapan max 12%, cacat fisik < 5%. AI merekomendasikan verifikasi kuota stok dan sertifikasi ICO Organic.',
      
      'Rekomendasi harga kompetitif': 
        '💡 **Kalkulasi Harga Cerdas NusaBridge AI:**\nBerdasarkan data harga pasar riil di pelabuhan Rotterdam, kami menyarankan penawaran **USD 8.80 – 9.20 / Kg (FOB Belawan)** agar margin laba bersih mencapai 24% dan tetap kompetitif terhadap supplier Vietnam.',
      
      'Penjelasan Incoterms 2020': 
        '📑 **Panduan Singkat Incoterms 2020:**\n• **FOB (Free on Board):** Anda bertanggung jawab sampai barang naik ke atas kapal di pelabuhan Indonesia.\n• **CIF (Cost, Insurance & Freight):** Anda membayar ongkos angkut & asuransi hingga pelabuhan tujuan buyer.',
      
      'Buat draft Proforma Invoice': 
        '📝 **Draft Proforma Invoice Siap!**\nDokumen Proforma Invoice #INV-2026-DE-088 telah otomatis dibuat sesuai standar ICC. Klausul termin pembayaran Escrow 30/30/20/20 telah disematkan.'
    },
    en: {
      'Analisis permintaan buyer (RFQ)': 
        '📊 **RFQ Analysis Complete!**\nBuyer from Germany inquiries about 10 MT Arabica Gayo Grade 1 coffee beans. Moisture max 12%, physical defects < 5%. AI recommends verifying inventory quotas and ICO Organic certification.',
      
      'Rekomendasi harga kompetitif': 
        '💡 **NusaBridge AI Smart Price Calculation:**\nBased on real-time Rotterdam port index, we recommend offering **USD 8.80 – 9.20 / Kg (FOB Belawan)** to secure a 24% net margin while staying competitive against Vietnam exporters.',
      
      'Penjelasan Incoterms 2020': 
        '📑 **Quick Incoterms 2020 Guide:**\n• **FOB (Free on Board):** Exporter liability ends once goods cross ship rail at Indonesian port.\n• **CIF (Cost, Insurance & Freight):** Exporter covers freight & maritime insurance until buyer destination port.',
      
      'Buat draft Proforma Invoice': 
        '📝 **Proforma Invoice Draft Ready!**\nProforma Invoice #INV-2026-DE-088 auto-generated conforming to ICC guidelines. Milestone escrow terms 30/30/20/20 included.'
    }
  };

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
        <img src="assets/icons/icon-1.webp" alt="AI Agent Icon">
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
    const msg = currentLang === 'en' ? 'NusaBridge AI is analyzing trade data...' : 'NusaBridge AI sedang menganalisis data...';
    typingRow.innerHTML = `
      <div class="agent-avatar-icon">
        <img src="assets/icons/icon-1.webp" alt="AI Agent Icon">
      </div>
      <div class="chat-bubble agent-bubble" style="font-style: italic; color: #64748b;">
        ${msg}
      </div>
    `;
    chatArea.appendChild(typingRow);
    chatArea.scrollTop = chatArea.scrollHeight;
    return typingRow;
  }

  function handleAiQuery(queryText) {
    appendUserMessage(queryText);
    const typing = appendTypingIndicator();

    setTimeout(() => {
      typing.remove();
      const langDict = aiResponses[currentLang] || aiResponses.id;
      const defaultResp = currentLang === 'en'
        ? `Thank you! Regarding "${escapeHtml(queryText)}", NusaBridge AI Agent identified export opportunities and compliance mandates. Our engine can auto-issue your Certificate of Origin and Sales Contract.`
        : `Terima kasih! Mengenai pertanyaan "${escapeHtml(queryText)}", AI Agent NusaBridge mendeteksi peluang ekspor dan persyaratan dokumen yang relevan. Sistem siap membantu penerbitan Certificate of Origin dan Sales Contract.`;
      
      const response = langDict[queryText] || defaultResp;
      appendAgentMessage(response);
    }, 600);
  }

  suggestButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-query');
      if (query) {
        handleAiQuery(query);
      }
    });
  });

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
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
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
      modal.classList.add('active');
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('active');
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
        ? 'Reach us at:<br><strong>Email:</strong> support@nusabridge.id<br><strong>WhatsApp Hotline:</strong> +62 812-3456-7890<br><strong>Address:</strong> SMK Antartika 1 Sidoarjo / Tim Arjika Labs'
        : 'Hubungi kami melalui:<br><strong>Email:</strong> support@nusabridge.id<br><strong>WhatsApp Hotline:</strong> +62 812-3456-7890<br><strong>Lokasi:</strong> SMK Antartika 1 Sidoarjo / Tim Arjika Labs';
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

  // Close modals listeners
  if (closeAuthModal) closeAuthModal.addEventListener('click', () => closeModal(authModal));
  if (closeDemoModal) closeDemoModal.addEventListener('click', () => closeModal(demoModal));
  if (closeInfoModal) closeInfoModal.addEventListener('click', () => closeModal(infoModal));
  if (btnOkInfo) btnOkInfo.addEventListener('click', () => closeModal(infoModal));

  // Close modal when clicking outside card
  [authModal, demoModal, infoModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
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
        fetch('http://localhost:5000/api/auth/register', {
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
    docs: document.getElementById('mockupViewDocs'),
    kyc: document.getElementById('mockupViewKyc'),
    rfq: document.getElementById('mockupViewRfq'),
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

      if (viewKey === 'products') {
        window.location.href = 'produk.html';
      } else if (viewKey === 'logistics') {
        switchMockupView('overview');
        document.querySelector('.marine-radar-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('🚢 Menampilkan Radar Logistik Maritim AIS Real-Time');
      } else {
        switchMockupView(viewKey);
        const viewLabels = {
          overview: '🏠 Dashboard Utama Ekspor',
          docs: '📄 AI Export Document Generator Sandbox Aktif',
          kyc: '🛡️ KYC Hub: Validasi NIB & NPWP OSS Sandbox Aktif',
          rfq: '🤖 AI RFQ Negotiation Studio Aktif',
          settings: '⚙️ Pengaturan Profil Usaha & Escrow Vault'
        };
        showToast(viewLabels[viewKey] || 'Sandbox Aktif');
      }
    });
  });

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

  if (btnPrintExportDoc) {
    btnPrintExportDoc.addEventListener('click', () => {
      showToast('📄 Men-generate dokumen resmi ekspor standar ICC...');
      setTimeout(() => {
        window.print();
      }, 350);
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
        alert(`Counter Offer USD ${counterPrice} / Kg berhasil dikirimkan ke Nordic Coffee Importers GmbH via AI Agent!`);
        showToast('💬 Penawaran tandingan terkirim.');
      }
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

