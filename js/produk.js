/**
 * ==========================================================================
 * NUSABRIDGE - LOGIKA HALAMAN KATALOG PRODUK
 * File: js/produk.js
 * Deskripsi: Mesin pencarian, filter kategori, pengurutan, dan pengajuan RFQ
 * 
 * Konsep Belajar JavaScript:
 * 1. Filtering Array: Memfilter elemen DOM berdasarkan atribut data (data-*)
 * 2. Sorting Array: Mengurutkan elemen berdasarkan harga (parseFloat)
 * 3. Dynamic Modal Generation: Merender HTML spesifikasi lab secara on-the-fly
 * 4. URL Encoding: Membuat tautan pesan WhatsApp otomatis (encodeURIComponent)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. ELEMEN DOM UTAMA
  // --------------------------------------------------------------------------
  const searchInput = document.getElementById('productSearchInput');
  const sortSelect = document.getElementById('sortSelect');
  const filterChips = document.querySelectorAll('.filter-chip');
  const cards = Array.from(document.querySelectorAll('.catalog-card'));
  const activeCount = document.getElementById('activeProductCount');
  const grid = document.getElementById('productsCatalogGrid');

  let currentCategory = 'all';

  // --------------------------------------------------------------------------
  // 2. FUNGSI FILTER & SORTING REAL-TIME
  // --------------------------------------------------------------------------
  function filterAndSort() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const sortBy = sortSelect ? sortSelect.value : 'featured';
    let visibleCount = 0;

    // Filter setiap kartu produk
    cards.forEach(card => {
      const cat = card.getAttribute('data-category');
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      const desc = card.querySelector('.card-item-desc')?.innerText.toLowerCase() || '';
      const loc = card.querySelector('.card-location')?.innerText.toLowerCase() || '';

      const matchesCat = currentCategory === 'all' || cat === currentCategory;
      const matchesQuery = !query || name.includes(query) || desc.includes(query) || loc.includes(query);

      if (matchesCat && matchesQuery) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (activeCount) activeCount.innerText = visibleCount;

    // Tampilkan Empty State jika hasil pencarian nihil
    let emptyState = document.getElementById('emptyCatalogState');
    if (visibleCount === 0) {
      if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.id = 'emptyCatalogState';
        emptyState.className = 'empty-catalog-state';
        emptyState.innerHTML = `
          <div class="empty-catalog-icon">🔍</div>
          <h4>Produk Tidak Ditemukan</h4>
          <p>Coba gunakan kata kunci lain seperti "Kopi", "Cengkeh", "Rotan", atau pilih kategori "Semua Komoditas".</p>
          <button class="btn btn-outline btn-sm" id="btnResetFilter">Reset Pencarian</button>
        `;
        grid.appendChild(emptyState);

        document.getElementById('btnResetFilter')?.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          currentCategory = 'all';
          filterChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-cat') === 'all'));
          filterAndSort();
        });
      }
    } else {
      if (emptyState) emptyState.remove();
    }

    // Urutkan (Sorting) elemen kartu produk
    const sorted = cards.slice().sort((a, b) => {
      const priceA = parseFloat(a.getAttribute('data-price')) || 0;
      const priceB = parseFloat(b.getAttribute('data-price')) || 0;
      const moqA = parseFloat(a.getAttribute('data-moq')) || 0;
      const moqB = parseFloat(b.getAttribute('data-moq')) || 0;

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'moq-low') return moqA - moqB;
      return 0; // default featured
    });

    sorted.forEach(c => grid.appendChild(c));
  }

  // Event Listener Tab Kategori
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.getAttribute('data-cat');
      filterAndSort();
    });
  });

  // Event Listener Input Pencarian & Dropdown Urutan
  if (searchInput) searchInput.addEventListener('input', filterAndSort);
  if (sortSelect) sortSelect.addEventListener('change', filterAndSort);

  // --------------------------------------------------------------------------
  // 3. DATABASE SPESIFIKASI MUTU LAB & DOKUMEN EKSPOR
  // --------------------------------------------------------------------------
  const prodSpecs = {
    gayo: {
      title: 'Kopi Arabika Gayo Specialty Grade 1',
      origin: 'Takengon, Aceh Tengah, Indonesia (1.400 mdpl)',
      hsCode: '0901.11.10 (Biji Kopi Arabika Mentah Belum Dipanggang)',
      varietal: 'Ateng, Tim-Tim, Bourbon',
      process: 'Semi-Washed & Full Washed Double Handpicked',
      specs: [
        { k: 'Kadar Air (Moisture)', v: '11.8% - 12.5%' },
        { k: 'Defect Rate', v: '< 4% (Triase Grade 1 Internasional)' },
        { k: 'Cupping Score', v: '84.75 (SCA Certified)' },
        { k: 'Kemasan', v: 'GrainPro Hermetic Bag + Karung Goni 60 Kg' },
        { k: 'Pelabuhan Pemuatan', v: 'Pelabuhan Belawan, Medan (FOB/CIF)' }
      ],
      certs: ['USDA Organic', 'EU Organic', 'Rainforest Alliance', 'Halal BPJPH ID']
    },
    cengkeh: {
      title: 'Cengkeh Lal Maluku Pilihan (Cloves)',
      origin: 'Kepulauan Maluku, Indonesia',
      hsCode: '0907.10.00 (Cengkeh Belum Dihancurkan/Ditumbuk)',
      varietal: 'Cengkeh Lal Maluku & Zanzibar Super',
      process: 'Penjemuran Sinar Matahari Alami (Sun-Dried)',
      specs: [
        { k: 'Kadar Minyak Atsiri', v: '> 19.5% (High Eugenol Content)' },
        { k: 'Kadar Air', v: 'Max 11.2%' },
        { k: 'Benda Asing', v: '< 0.5% (Bebas Batang & Jamur)' },
        { k: 'Kemasan', v: 'Double Polypropylene Bag 25 / 50 Kg' },
        { k: 'Pelabuhan Pemuatan', v: 'Tanjung Perak, Surabaya / Makassar' }
      ],
      certs: ['Phytosanitary Certificate', 'Certificate of Origin (COO Form D/AK)', 'Halal BPJPH ID']
    },
    rotan: {
      title: 'Furnitur & Dekorasi Rotan Alami Cirebon',
      origin: 'Cirebon, Jawa Barat, Indonesia',
      hsCode: '9401.52.00 (Tempat Duduk dari Rotan)',
      varietal: 'Rotan Manau & Kubu Grey Alami',
      process: 'Anyaman Tangan + Oven Kiln Dry Treatment',
      specs: [
        { k: 'Kadar Air Rangka', v: '< 12% (Anti Rapuh)' },
        { k: 'Finishing', v: 'Eco-Friendly Non-Toxic Water Base Coating' },
        { k: 'Fumigasi', v: 'Methyl Bromide Standar AQIS Australia & Uni Eropa' },
        { k: 'Kemasan', v: 'Corrugated Paper + Bubble Wrap + Silica Gel' },
        { k: 'Pelabuhan Pemuatan', v: 'Tanjung Priok, Jakarta' }
      ],
      certs: ['V-Legal SVLK Kayu & Rotan', 'Fumigation Certificate', 'ISPM 15']
    },
    tenun: {
      title: 'Kain Tenun Ikat Pewarna Alami Sumba',
      origin: 'Sumba Timur, Nusa Tenggara Timur, Indonesia',
      hsCode: '5208.52.00 (Kain Tenun Kapas Tradisional Cetak Motif)',
      varietal: 'Benang Katun Pintal Tradisional',
      process: 'Tenun Gedogan Tradisional (2-3 Bulan Pembuatan)',
      specs: [
        { k: 'Dimensi', v: '240 cm x 110 cm (Toleransi 2 cm)' },
        { k: 'Pewarnaan', v: '100% Akar Mengkudu (Merah) & Indigofera (Biru Tua)' },
        { k: 'Ketahanan Warna', v: 'Grade 4-5 (Tahan Cuci Tangan)' },
        { k: 'Kemasan', v: 'Kotak Kraft Ramah Lingkungan + Desiccant' },
        { k: 'Pelabuhan Pemuatan', v: 'Tanjung Perak, Surabaya' }
      ],
      certs: ['Sertifikasi Indikasi Geografis (IG)', 'Eco-Textile Fair Trade Certificate']
    },
    gula: {
      title: 'Gula Semut Aren Organik (Organic Palm Sugar)',
      origin: 'Banyumas & Cilacap, Jawa Tengah, Indonesia',
      hsCode: '1702.90.99 (Gula Aren Kristal Alami)',
      varietal: 'Nira Aren Hutan Liar Pegunungan',
      process: 'Kristalisasi Tradisional Higienis & Ayak Mesh 18',
      specs: [
        { k: 'Kadar Air', v: 'Max 1.8%' },
        { k: 'Kadar Sukrosa', v: '> 82%' },
        { k: 'Indeks Glikemik', v: '35 (Low Glycemic Index)' },
        { k: 'Kemasan', v: 'Aluminium Foil Inner Bag + Karton Ekspor 20 Kg' },
        { k: 'Pelabuhan Pemuatan', v: 'Tanjung Priok, Jakarta / Tanjung Perak' }
      ],
      certs: ['USDA NOP Organic', 'EU Organic', 'HACCP Codex Alimentarius', 'Halal BPJPH ID']
    },
    nilam: {
      title: 'Minyak Nilam Murni (Patchouli Essential Oil)',
      origin: 'Aceh & Sulawesi, Indonesia',
      hsCode: '3301.29.90 (Minyak Atsiri Nilam)',
      varietal: 'Pogostemon cablin Benth',
      process: 'Distilasi Uap Daun Nilam Kering Bertekanan Rendah',
      specs: [
        { k: 'Patchouli Alcohol (PA)', v: 'Min 32.5% (Standar Industri Parfum Eropa)' },
        { k: 'Berat Jenis (20°C)', v: '0.950 - 0.975' },
        { k: 'Warna', v: 'Kuning Jernih hingga Cokelat Kemerahan' },
        { k: 'Kemasan', v: 'Drum Baja Galvanis Lapisan Khusus 25 Kg / 200 Kg' },
        { k: 'Pelabuhan Pemuatan', v: 'Pelabuhan Belawan / Tanjung Priok' }
      ],
      certs: ['GC-MS Certificate of Analysis (CoA)', 'MSDS / SDS Ekspor', 'IFRA Statement']
    },
    briket: {
      title: 'Briket Tempurung Kelapa Shisha / BBQ Premium',
      origin: 'Sulawesi & Jawa Timur, Indonesia',
      hsCode: '4402.90.10 (Briket Arang Batok Kelapa)',
      varietal: '100% Tempurung Kelapa Matang Alami',
      process: 'Karbonisasi Suhu Tinggi + Perekat Tapioka 3%',
      specs: [
        { k: 'Kalori Pembakaran', v: '7.300 - 7.500 Kcal/kg' },
        { k: 'Kadar Abu (Ash Content)', v: 'Max 2.2% (White Ash)' },
        { k: 'Lama Pembakaran', v: '2.0 - 2.5 Jam Stabil' },
        { k: 'Kemasan', v: 'Inner Plastic + Master Box 10 Kg / 20 Kg' },
        { k: 'Pelabuhan Pemuatan', v: 'Tanjung Perak, Surabaya' }
      ],
      certs: ['SHTC Non-DGR (Aman Pengapalan Laut)', 'RoHS Test Report', 'MSDS']
    },
    vanilla: {
      title: 'Vanilla Beans Planifolia Grade A Gourmet',
      origin: 'Bali & Alor, Nusa Tenggara Timur, Indonesia',
      hsCode: '0905.10.00 (Vanili Polong Utuh)',
      varietal: 'Vanilla planifolia Andrews',
      process: 'Sweating Tradisional & Curing Matahari 3 Bulan',
      specs: [
        { k: 'Panjang Polong', v: '16 - 20 cm (Gourmet Grade A)' },
        { k: 'Kadar Vanillin Alami', v: '2.2% - 2.6%' },
        { k: 'Kadar Kelembapan', v: '30% - 33% (Lentur & Berminyak)' },
        { k: 'Kemasan', v: 'Vacuum Pack Food Grade 1 Kg + Kotak Karton' },
        { k: 'Pengiriman', v: 'Air Freight Express (Door to Port / FOB Ngurah Rai)' }
      ],
      certs: ['USDA Organic', 'Phytosanitary', 'FDA Registration Verified', 'Halal BPJPH ID']
    }
  };

  // --------------------------------------------------------------------------
  // 4. MODAL DETAIL SPESIFIKASI MUTU & LAB
  // --------------------------------------------------------------------------
  const specModal = document.getElementById('productSpecModal');
  const closeSpecModal = document.getElementById('closeSpecModal');
  const btnTutupSpec = document.getElementById('btnTutupSpec');
  const specContent = document.getElementById('specModalContent');
  const btnLanjutRFQ = document.getElementById('btnLanjutRFQ');

  let currentSelectedProd = null;

  document.querySelectorAll('.btn-detail-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-prod');
      const data = prodSpecs[key];
      if (!data) return;
      currentSelectedProd = data;

      document.getElementById('specModalTitle').innerText = data.title;
      document.getElementById('specModalSubtitle').innerText = `${data.origin} • HS Code: ${data.hsCode}`;

      let html = `
        <div class="spec-detail-grid">
          <div class="spec-col-left">
            <h4>Parameter Fisik &amp; Uji Mutu Lab</h4>
            <table class="spec-table">
              <tbody>
                ${data.specs.map(s => `<tr><th>${s.k}</th><td><strong>${s.v}</strong></td></tr>`).join('')}
                <tr><th>Proses Pengolahan</th><td>${data.process}</td></tr>
                <tr><th>Varietas/Material</th><td>${data.varietal}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="spec-col-right">
            <h4>Sertifikasi &amp; Dokumen Legal</h4>
            <div class="spec-cert-list">
              ${data.certs.map(c => `<div class="spec-cert-item"><span class="sci-check">✓</span> ${c}</div>`).join('')}
            </div>
            <div class="spec-ai-note">
              <div class="san-icon">🤖</div>
              <div class="san-text">
                <strong>Rekomendasi AI Agent:</strong><br>
                Produk ini memenuhi ketentuan regulasi ekspor negara tujuan Eropa (EU Regulation) dan Amerika Serikat (FDA &amp; USDA). Dokumen Certificate of Origin (COO) dan PEB dapat dibuat otomatis dalam 5 menit.
              </div>
            </div>
          </div>
        </div>
      `;
      if (specContent) specContent.innerHTML = html;
      if (specModal) specModal.classList.add('show');
    });
  });

  if (closeSpecModal) closeSpecModal.addEventListener('click', () => specModal.classList.remove('show'));
  if (btnTutupSpec) btnTutupSpec.addEventListener('click', () => specModal.classList.remove('show'));

  // --------------------------------------------------------------------------
  // 5. MODAL FORM REQUEST FOR QUOTATION (RFQ)
  // --------------------------------------------------------------------------
  const rfqModal = document.getElementById('rfqModal');
  const closeRfqModal = document.getElementById('closeRfqModal');
  const rfqProdName = document.getElementById('rfqProdName');
  const rfqForm = document.getElementById('rfqForm');

  function openRfq(prodTitle) {
    if (specModal) specModal.classList.remove('show');
    if (rfqProdName) rfqProdName.value = prodTitle;
    if (rfqModal) rfqModal.classList.add('show');
  }

  document.querySelectorAll('.btn-rfq-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-prod');
      const data = prodSpecs[key];
      if (data) openRfq(data.title);
    });
  });

  if (btnLanjutRFQ) {
    btnLanjutRFQ.addEventListener('click', () => {
      if (currentSelectedProd) openRfq(currentSelectedProd.title);
    });
  }

  if (closeRfqModal) closeRfqModal.addEventListener('click', () => rfqModal.classList.remove('show'));

  // Submit RFQ Form -> Hubungkan Otomatis ke WhatsApp
  if (rfqForm) {
    rfqForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pName = rfqProdName.value;
      const qty = document.getElementById('rfqQty').value;
      const terms = document.getElementById('rfqIncoterms').value;
      const port = document.getElementById('rfqPort').value;

      rfqModal.classList.remove('show');
      
      const textMsg = `Halo Tim NusaBridge AI, saya ingin mengajukan penawaran ekspor resmi:\n\n` +
        `• Produk: ${pName}\n` +
        `• Kuantitas: ${qty} Unit/Kg\n` +
        `• Pilihan Incoterms: ${terms}\n` +
        `• Pelabuhan Tujuan: ${port}\n\n` +
        `Mohon buatkan simulasi kalkulasi Proforma Invoice dan verifikasi jadwal pelayaran. Terima kasih!`;
      
      const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(textMsg)}`;
      
      alert(`Permintaan RFQ untuk "${pName}" berhasil dianalisis AI Agent NusaBridge!\n\nSistem mengarahkan Anda ke WhatsApp Hotline resmi tim ekspor.`);
      window.open(waUrl, '_blank');
    });
  }

  // Tutup modal jika klik di luar kartu
  [specModal, rfqModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) {
          m.classList.remove('active');
          m.classList.remove('show');
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // 5. URL PARAMETER DEEP LINKING (?search=... atau ?category=...)
  // --------------------------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  const catParam = urlParams.get('category');

  if (searchParam && searchInput) {
    searchInput.value = searchParam;
    filterAndSort();
  } else if (catParam) {
    const targetChip = document.querySelector(`.filter-chip[data-cat="${catParam}"]`);
    if (targetChip) {
      filterChips.forEach(c => c.classList.remove('active'));
      targetChip.classList.add('active');
      currentCategory = catParam;
      filterAndSort();
    }
  }

});
