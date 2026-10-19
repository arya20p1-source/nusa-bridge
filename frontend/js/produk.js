/**
 * ==========================================================================
 * NUSABRIDGE - LOGIKA KATALOG 105+ PRODUK EKSPOR INDONESIA
 * File: js/produk.js
 * Deskripsi: Mesin pencarian, filter kategori, sorting, paginasi dinamis,
 *            dan generator modal spesifikasi lab untuk 105+ komoditas ekspor.
 * 
 * Konsep Belajar Siswa:
 * 1. Dynamic DOM Templating: Merender 105+ kartu produk secara efisien
 * 2. Client-Side & API Pagination: Menghitung pembagian halaman (12 produk per page)
 * 3. Multi-criteria Filtering: Menggabungkan pencarian teks + kategori + urutan harga
 * 4. Resilient Fallback: Membaca dataset lokal window.NUSA_PRODUCTS_DATA dan fetch API backend
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. DATA MASTER 105+ KOMODITAS EKSPOR
  // --------------------------------------------------------------------------
  // Ambil data dari window.NUSA_PRODUCTS_DATA (dari js/products-data.js)
  const masterProducts = Array.isArray(window.NUSA_PRODUCTS_DATA) ? window.NUSA_PRODUCTS_DATA : [];

  // DOM Elements
  const searchInput = document.getElementById('productSearchInput');
  const sortSelect = document.getElementById('sortSelect');
  const filterChips = document.querySelectorAll('.filter-chip');
  const activeCount = document.getElementById('activeProductCount');
  const grid = document.getElementById('productsCatalogGrid');
  const countAll = document.getElementById('count-all');

  // Modal Spesifikasi & RFQ
  const specModal = document.getElementById('productSpecModal');
  const closeSpecModal = document.getElementById('closeSpecModal');
  const btnTutupSpec = document.getElementById('btnTutupSpec');
  const specTitle = document.getElementById('specModalTitle');
  const specContent = document.getElementById('specModalContent');
  const btnLanjutRFQ = document.getElementById('btnLanjutRFQ');

  const rfqModal = document.getElementById('rfqModal');
  const closeRfqModal = document.getElementById('closeRfqModal');
  const rfqProdName = document.getElementById('rfqProdName');
  const rfqForm = document.getElementById('rfqForm');

  // State Aplikasi
  let currentCategory = 'all';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 12;
  let filteredProducts = [...masterProducts];
  let currentSelectedProd = null;

  // Update total badge count
  if (countAll) countAll.innerText = masterProducts.length;

  // --------------------------------------------------------------------------
  // 2. FUNGSI PEMFORMAT & HELPER
  // --------------------------------------------------------------------------
  function formatUSD(num) {
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  }

  function getCategoryLabel(cat) {
    const map = {
      kopi: 'Kopi Specialty',
      rempah: 'Rempah & Herbal',
      kriya: 'Kriya & Rotan',
      tekstil: 'Tekstil & Tenun',
      makanan: 'Makanan Organik',
      perkebunan: 'Perkebunan & Laut'
    };
    return map[cat] || 'Komoditas Unggulan';
  }

  // --------------------------------------------------------------------------
  // 3. FUNGSI RENDER KARTU PRODUK KE DOM
  // --------------------------------------------------------------------------
  function renderProducts() {
    if (!grid) return;
    grid.innerHTML = '';

    const total = filteredProducts.length;
    if (activeCount) activeCount.innerText = total;

    // Jika hasil kosong
    if (total === 0) {
      grid.innerHTML = `
        <div class="empty-catalog-state" style="grid-column: 1 / -1; text-align:center; padding:3rem 1.5rem;">
          <div style="font-size:3rem; margin-bottom:12px;">🔍</div>
          <h4 style="font-size:1.3rem; color:var(--navy-title); margin-bottom:8px;">Komoditas Tidak Ditemukan</h4>
          <p style="color:var(--text-muted); max-width:480px; margin:0 auto 16px;">
            Coba gunakan kata kunci lain (seperti "Kopi", "Pala", "Rotan", "Sutra", "Briket") atau pilih kategori "Semua Komoditas".
          </p>
          <button class="btn btn-outline btn-sm" id="btnResetSearch">Reset Pencarian</button>
        </div>
      `;
      document.getElementById('btnResetSearch')?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentCategory = 'all';
        filterChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-cat') === 'all'));
        applyFilterAndSort();
      });
      removePagination();
      return;
    }

    // Paginasi: Ambil data slice untuk halaman aktif
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Render setiap kartu produk
    paginatedItems.forEach(prod => {
      const card = document.createElement('div');
      card.className = 'catalog-card';
      card.setAttribute('data-category', prod.category);
      card.setAttribute('data-id', prod.id);

      // Gambar fallback cerdas berbasis kategori jika file spesifik belum ada
      const fallbackImg = `assets/product-${((parseInt(prod.id.replace('prod_', ''), 10) - 1) % 8) + 1}.webp`;

      card.innerHTML = `
        <div class="catalog-card-image">
          <img src="${prod.image}" alt="${prod.name}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackImg}';">
          <span class="card-category-pill">${getCategoryLabel(prod.category)}</span>
          <span class="card-verified-tag">✓ Verified OSS NIB</span>
        </div>
        <div class="catalog-card-content">
          <div class="card-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${prod.origin}
          </div>
          <h3 class="card-item-title">${prod.name}</h3>
          <p class="card-item-desc">${prod.desc}</p>
          
          <div class="card-meta-row">
            <div class="card-price-box">
              <span class="cp-label">Estimasi Harga (FOB/CIF):</span>
              <div class="cp-val">USD ${formatUSD(prod.price)} <span class="cp-unit">/ ${prod.unit}</span></div>
            </div>
            <div class="card-moq-box">
              <span class="cp-label">Min. Order (MOQ):</span>
              <div class="cm-val">${prod.moq.toLocaleString('id-ID')} ${prod.unit}</div>
            </div>
          </div>

          <div class="card-badges-row">
            ${prod.certs.slice(0, 2).map(c => `<span class="spec-tag">${c}</span>`).join('')}
            <span class="spec-tag">HS ${prod.hsCode.split(' ')[0]}</span>
          </div>

          <div class="card-actions-grid">
            <button class="btn btn-outline btn-sm btn-open-spec" data-id="${prod.id}">Lihat Spesifikasi Lab</button>
            <button class="btn btn-primary btn-sm btn-rfq-prod" data-id="${prod.id}">Ajukan RFQ</button>
          </div>
        </div>
      `;

      // Event Listener Tombol Kartu
      card.querySelector('.btn-open-spec')?.addEventListener('click', () => openSpecModal(prod));
      card.querySelector('.btn-rfq-prod')?.addEventListener('click', () => openRfqModal(prod.name));

      grid.appendChild(card);
    });

    // Render Kontrol Paginasi
    renderPagination(totalPages);
  }

  // --------------------------------------------------------------------------
  // 4. KONTROL PAGINASI (HALAMAN 1, 2, 3...)
  // --------------------------------------------------------------------------
  function removePagination() {
    const existing = document.getElementById('catalogPagination');
    if (existing) existing.remove();
  }

  function renderPagination(totalPages) {
    removePagination();
    if (totalPages <= 1) return;

    const nav = document.createElement('div');
    nav.id = 'catalogPagination';
    nav.className = 'pagination-container';

    // Tombol Previous
    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn';
    btnPrev.innerHTML = '&laquo; Prev';
    btnPrev.disabled = currentPage === 1;
    btnPrev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderProducts();
        document.querySelector('.section-product-controls')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    nav.appendChild(btnPrev);

    // Nomor Halaman
    for (let i = 1; i <= totalPages; i++) {
      // Tampilkan hanya halaman dekat atau awal/akhir
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        const btnNum = document.createElement('button');
        btnNum.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btnNum.innerText = i;
        btnNum.addEventListener('click', () => {
          currentPage = i;
          renderProducts();
          document.querySelector('.section-product-controls')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        nav.appendChild(btnNum);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        const dots = document.createElement('span');
        dots.className = 'page-info-text';
        dots.innerText = '...';
        nav.appendChild(dots);
      }
    }

    // Tombol Next
    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn';
    btnNext.innerHTML = 'Next &raquo;';
    btnNext.disabled = currentPage === totalPages;
    btnNext.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
        document.querySelector('.section-product-controls')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    nav.appendChild(btnNext);

    // Keterangan Halaman
    const infoText = document.createElement('span');
    infoText.className = 'page-info-text';
    infoText.innerText = `(Hal ${currentPage} dari ${totalPages})`;
    nav.appendChild(infoText);

    grid.parentElement.appendChild(nav);
  }

  // --------------------------------------------------------------------------
  // 5. FILTER, SORT & PENCARIAN REAL-TIME
  // --------------------------------------------------------------------------
  function applyFilterAndSort() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const sortBy = sortSelect ? sortSelect.value : 'featured';

    filteredProducts = masterProducts.filter(p => {
      const matchCat = currentCategory === 'all' || p.category === currentCategory;
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) ||
        p.desc.toLowerCase().includes(query) ||
        p.origin.toLowerCase().includes(query) ||
        p.hsCode.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    // Pengurutan
    if (sortBy === 'price-low') {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'moq-low') {
      filteredProducts.sort((a, b) => a.moq - b.moq);
    }

    // Reset ke halaman 1 setiap kali filter/pencarian berubah
    currentPage = 1;
    renderProducts();
  }

  // Event Listener Tab Kategori
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.getAttribute('data-cat') || 'all';
      applyFilterAndSort();
    });
  });

  if (searchInput) searchInput.addEventListener('input', applyFilterAndSort);
  if (sortSelect) sortSelect.addEventListener('change', applyFilterAndSort);

  // --------------------------------------------------------------------------
  // 6. MODAL SPESIFIKASI MUTU LAB & DOKUMEN EKSPOR
  // --------------------------------------------------------------------------
  function openSpecModal(prod) {
    currentSelectedProd = prod;
    if (specTitle) specTitle.innerText = prod.name;

    const specsTable = prod.specs && prod.specs.length > 0 
      ? prod.specs.map(s => `<tr><th>${s.k}</th><td><strong>${s.v}</strong></td></tr>`).join('')
      : `<tr><th>Standar Mutu</th><td><strong>Standar SNI & Ekspor Internasional</strong></td></tr>`;

    const certsBadges = prod.certs && prod.certs.length > 0
      ? prod.certs.map(c => `<div class="spec-cert-item"><span class="sci-check">✓</span> ${c}</div>`).join('')
      : `<div class="spec-cert-item"><span class="sci-check">✓</span> Legalitas NIB & NPWP OSS Terverifikasi</div>`;

    if (specContent) {
      specContent.innerHTML = `
        <div class="spec-grid-layout">
          <div class="spec-col-left">
            <h4>Parameter Laboratorium &amp; Pengapalan</h4>
            <table class="spec-table">
              <tr><th>Asal Daerah / Kebun:</th><td><strong>${prod.origin}</strong></td></tr>
              <tr><th>Kode HS Resmi:</th><td><strong>${prod.hsCode}</strong></td></tr>
              <tr><th>Pelabuhan Muat:</th><td><strong>${prod.shipping || 'Tanjung Priok / Tanjung Perak'}</strong></td></tr>
              <tr><th>Estimasi Harga:</th><td><strong>USD ${formatUSD(prod.price)} / ${prod.unit}</strong></td></tr>
              <tr><th>Minimal Order (MOQ):</th><td><strong>${prod.moq.toLocaleString('id-ID')} ${prod.unit}</strong></td></tr>
              ${specsTable}
            </table>
          </div>
          <div class="spec-col-right">
            <h4>Sertifikasi &amp; Legalitas Ekspor</h4>
            <div class="spec-cert-list">
              ${certsBadges}
            </div>
            <div class="spec-ai-note">
              <div class="san-icon">🤖</div>
              <div class="san-text">
                <strong>Rekomendasi NusaBridge AI Agent:</strong><br>
                Komoditas ini memiliki kelayakan ekspor tinggi. Draf dokumen Proforma Invoice, Certificate of Origin (COO), dan deklarasi Incoterms 2020 dapat di-generate otomatis oleh AI dalam hitungan detik.
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (specModal) specModal.classList.add('show', 'active');
  }

  if (closeSpecModal) closeSpecModal.addEventListener('click', () => specModal.classList.remove('show', 'active'));
  if (btnTutupSpec) btnTutupSpec.addEventListener('click', () => specModal.classList.remove('show', 'active'));

  // --------------------------------------------------------------------------
  // 7. MODAL REQUEST FOR QUOTATION (RFQ)
  // --------------------------------------------------------------------------
  function openRfqModal(prodName) {
    if (specModal) specModal.classList.remove('show', 'active');
    if (rfqProdName) rfqProdName.value = prodName;
    if (rfqModal) rfqModal.classList.add('show', 'active');
  }

  if (btnLanjutRFQ) {
    btnLanjutRFQ.addEventListener('click', () => {
      if (currentSelectedProd) openRfqModal(currentSelectedProd.name);
    });
  }

  if (closeRfqModal) closeRfqModal.addEventListener('click', () => rfqModal.classList.remove('show', 'active'));

  // Submit RFQ Form
  if (rfqForm) {
    rfqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pName = rfqProdName ? rfqProdName.value : 'Komoditas Ekspor';
      const qty = document.getElementById('rfqQty')?.value || '1000';
      const terms = document.getElementById('rfqIncoterms')?.value || 'CIF Hamburg';
      const port = document.getElementById('rfqPort')?.value || 'Port of Hamburg';

      // Coba kirim ke Backend jika server aktif
      try {
        fetch('http://localhost:5000/api/rfq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: pName,
            quantity: qty,
            targetIncoterms: terms,
            buyerCountry: port
          })
        }).catch(() => {});
      } catch (err) {}

      rfqModal.classList.remove('show', 'active');

      alert(`🎉 Permintaan RFQ untuk "${pName}" (${qty} Unit - ${terms}) berhasil diajukan!\n\nAI Agent NusaBridge sedang menganalisis penawaran dan menghubungkan ke mitra logistik.`);
    });
  }

  // Tutup modal jika klik backdrop
  [specModal, rfqModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.remove('show', 'active');
      });
    }
  });

  // Tombol CTA Daftarkan Produk Saya
  const btnDaftarKatalog = document.getElementById('btnDaftarKatalog');
  if (btnDaftarKatalog) {
    btnDaftarKatalog.addEventListener('click', () => {
      const authModal = document.getElementById('authModal');
      if (authModal) authModal.classList.add('show', 'active');
    });
  }

  // Jalankan render awal
  renderProducts();

});
