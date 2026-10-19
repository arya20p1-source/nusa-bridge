/**
 * ==========================================================================
 * NUSABRIDGE - LOGIKA SIMULATOR EKSPOR AI
 * File: js/solusi.js
 * Deskripsi: Mesin kalkulasi rute, dokumen wajib, dan tarif bea masuk ekspor
 * 
 * Konsep Belajar JavaScript:
 * 1. Nested Data Structure: Objek bertingkat (Komoditas -> Negara Tujuan)
 * 2. Asynchronous Simulation: Menggunakan setTimeout untuk simulasi loading AI
 * 3. Dynamic Template Literal: Merender komponen HTML menggunakan backticks (`)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. DATABASE PENGETAHUAN SIMULATOR EKSPOR
  // --------------------------------------------------------------------------
  const simDatabase = {
    kopi: {
      hs: '0901.11.10 (Biji Kopi Arabika)',
      jerman: {
        route: 'Belawan ➔ Singapore ➔ Port of Rotterdam / Hamburg',
        transit: '26 - 28 Hari Pelayaran Laut',
        docs: [
          'Commercial Invoice & Packing List',
          'Certificate of Origin (COO Form A/D)',
          'Phytosanitary Certificate Badan Karantina',
          'Sertifikat Uji Residu Bebas Pestisida Uni Eropa'
        ],
        duty: '0% (Skema GSP / Fasilitas Bebas Bea Kopi Mentah)',
        compliance: 'EUDR (European Union Deforestation Regulation) Geolocation Tagging'
      },
      usa: {
        route: 'Tanjung Priok ➔ Selat Sunda ➔ Port of Los Angeles',
        transit: '22 - 25 Hari Pelayaran Laut Pasifik',
        docs: [
          'FDA Prior Notice Confirmation Number',
          'Commercial Invoice & Packing List',
          'Bill of Lading Resmi (Clean On Board)',
          'Sertifikat Uji Bebas Mikotoksin Ochratoxin A'
        ],
        duty: '0% Tarif Masuk untuk Biji Kopi Indonesia',
        compliance: 'Registrasi Fasilitas Pangan FDA USA & Bioterrorism Act Compliance'
      },
      jepang: {
        route: 'Tanjung Priok ➔ Laut Natuna ➔ Tokyo / Yokohama Port',
        transit: '12 - 14 Hari Pelayaran Laut',
        docs: [
          'Certificate of Origin (Form IJEPA Indonesia-Japan)',
          'Phytosanitary Certificate Karantina Tumbuhan',
          'Certificate of Analysis (CoA) Lab Akreditasi'
        ],
        duty: '0% dengan Tarif Preferensi IJEPA',
        compliance: 'Pemeriksaan Positive List System (Residu Pestisida MHLW Jepang)'
      },
      uea: {
        route: 'Tanjung Priok ➔ Selat Malaka ➔ Port of Jebel Ali (Dubai)',
        transit: '14 - 16 Hari Pelayaran Laut',
        docs: [
          'Commercial Invoice Disahkan Kedutaan/Kadin',
          'Certificate of Origin (Form I-UAE CEPA)',
          'Sertifikat Halal Resmi BPJPH Indonesia'
        ],
        duty: '0% dengan Skema Perjanjian Dagang IUAE-CEPA',
        compliance: 'Standar Mutu ESMA Uni Emirat Arab & Bebas Serangga'
      },
      australia: {
        route: 'Tanjung Perak Surabaya ➔ Fremantle / Sydney Port',
        transit: '9 - 12 Hari Pelayaran Laut',
        docs: [
          'Certificate of Origin (Form IA-CEPA)',
          'Sertifikat Fumigasi Standar AFAS / AQIS Australia',
          'Phytosanitary Certificate'
        ],
        duty: '0% di Bawah Perjanjian Komprehensif IA-CEPA',
        compliance: 'Pemeriksaan Biosecurity Sangat Ketat Departemen Pertanian Australia'
      }
    },
    rempah: {
      hs: '0907.10.00 (Cengkeh) / 0908.11.00 (Pala)',
      jerman: {
        route: 'Tanjung Perak Surabaya ➔ Hamburg Port, Germany',
        transit: '28 Hari Pelayaran Laut',
        docs: [
          'Commercial Invoice & Packing List',
          'Phytosanitary Certificate Bebas Serangga Hidup',
          'Aflatoxin & Heavy Metals Lab Test Certificate'
        ],
        duty: '0% Tarif Masuk',
        compliance: 'Batas Maksimum Kontaminasi Aflatoksin B1 < 5 ppb'
      },
      usa: {
        route: 'Tanjung Priok ➔ Port of Newark / New York',
        transit: '30 - 32 Hari (via Terusan Suez)',
        docs: [
          'FDA Registration & Food Facility Verification',
          'Phytosanitary Certificate',
          'Bill of Lading & Commercial Invoice'
        ],
        duty: '0% Tarif Masuk',
        compliance: 'Standar Kebersihan Rempah ASTA (American Spice Trade Association)'
      },
      jepang: {
        route: 'Makassar ➔ Tokyo Port',
        transit: '14 Hari Pelayaran Laut',
        docs: [
          'COO Form IJEPA',
          'Phytosanitary Certificate',
          'Uji Kadar Air < 11%'
        ],
        duty: '0%',
        compliance: 'Food Sanitation Act MHLW Jepang'
      }
    },
    rotan: {
      hs: '9401.52.00 (Tempat Duduk/Furnitur Rotan)',
      jerman: {
        route: 'Tanjung Priok Jakarta ➔ Rotterdam / Hamburg',
        transit: '26 Hari Pelayaran Laut',
        docs: [
          'V-Legal SVLK (Sistem Verifikasi Legalitas Kayu & Rotan)',
          'Fumigation Certificate (Methyl Bromide Bebas Jamur)',
          'Commercial Invoice & Packing List'
        ],
        duty: '0% Tarif Masuk',
        compliance: 'FLEGT Regulation & Bebas Pengawet Logam Berbahaya'
      },
      usa: {
        route: 'Tanjung Priok ➔ Long Beach / Los Angeles Port',
        transit: '24 Hari Pelayaran Laut',
        docs: [
          'Lacey Act Declaration',
          'Fumigation Certificate',
          'Commercial Invoice & Packing List'
        ],
        duty: '0% - 2.5%',
        compliance: 'Kepatuhan Pelaporan Deklarasi Bahan Kayu/Rotan Hayati'
      }
    },
    nilam: {
      hs: '3301.29.90 (Minyak Atsiri Nilam Patchouli)',
      jerman: {
        route: 'Belawan Medan ➔ Le Havre (Prancis) / Hamburg (DE)',
        transit: '24 Hari Pelayaran Laut',
        docs: [
          'Certificate of Analysis GC-MS (Gas Chromatography)',
          'Safety Data Sheet (MSDS / SDS Ekspor)',
          'IFRA Certificate of Conformity'
        ],
        duty: '0%',
        compliance: 'Kepatuhan Regulasi Kosmetik & Wewangian IFRA / EU REACH'
      },
      usa: {
        route: 'Belawan ➔ Port of New York / New Jersey',
        transit: '28 Hari Pelayaran Laut',
        docs: [
          'CoA Uji Patchouli Alcohol > 32%',
          'MSDS Dokumen Pengapalan Non-Hazardous',
          'Invoice & Packing List'
        ],
        duty: '0%',
        compliance: 'FEMA / FDA Essential Oil Standard'
      }
    },
    makanan: {
      hs: '1702.90.99 (Gula Semut Aren Organik)',
      jerman: {
        route: 'Tanjung Priok ➔ Rotterdam Port',
        transit: '25 Hari Pelayaran Laut',
        docs: [
          'EU Organic Certificate of Inspection (COI Traces)',
          'HACCP Codex Alimentarius Certificate',
          'Certificate of Origin (COO Form A)'
        ],
        duty: '0%',
        compliance: 'EU Organic Farming Standard Tanpa Residu Sulfit Kimia'
      },
      usa: {
        route: 'Tanjung Priok ➔ Port of Los Angeles',
        transit: '22 Hari Pelayaran Laut',
        docs: [
          'USDA NOP Organic Certificate',
          'FDA Food Facility Registration',
          'Nutrition Facts Label (US FDA Format)'
        ],
        duty: '0%',
        compliance: 'FSMA (Food Safety Modernization Act) Verification'
      }
    }
  };

  // --------------------------------------------------------------------------
  // 2. FUNGSI ANALISIS SIMULATOR
  // --------------------------------------------------------------------------
  const btnRun = document.getElementById('btnRunSimulator');
  const sopGrid = document.getElementById('sopGridContent');

  function renderAnalysis() {
    const comm = document.getElementById('simCommodity')?.value || 'kopi';
    const country = document.getElementById('simCountry')?.value || 'jerman';
    const vol = document.getElementById('simVolume')?.value || '2.000 Kg';

    const dataComm = simDatabase[comm] || simDatabase.kopi;
    const dataCountry = dataComm[country] || dataComm.jerman || simDatabase.kopi.jerman;

    if (!sopGrid) return;

    sopGrid.innerHTML = `
      <div class="sop-col">
        <h5>Jalur &amp; Estimasi Transit</h5>
        <div class="sop-val-big">${dataCountry.transit}</div>
        <p class="sop-desc"><strong>Rute Pelayaran:</strong> ${dataCountry.route}</p>
        <p class="sop-desc"><strong>Volume Muatan:</strong> ${vol}</p>
        <div class="sop-badge green">🚢 Jalur Pelayaran Terverifikasi AIS</div>
      </div>
      <div class="sop-col">
        <h5>Dokumen Ekspor yang Wajib Diterbitkan AI:</h5>
        <ul class="sop-list">
          ${dataCountry.docs.map(d => `<li><span>✓</span> ${d}</li>`).join('')}
        </ul>
      </div>
      <div class="sop-col">
        <h5>Tarif Bea Cukai &amp; Kepatuhan Mutu:</h5>
        <div class="sop-highlight-box">
          <div class="shb-row"><span>Perkiraan Bea Masuk:</span> <strong>${dataCountry.duty}</strong></div>
          <div class="shb-row"><span>Ketentuan Khusus:</span> <strong>${dataCountry.compliance}</strong></div>
          <div class="shb-row"><span>HS Code Rekomendasi:</span> <code>${dataComm.hs || '0901.11.10'}</code></div>
        </div>
        <div class="sop-btn-wrap" style="margin-top:10px;">
          <a href="https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Tim NusaBridge AI, saya telah menjalankan simulasi ekspor komoditas ${comm} ke negara ${country} volume ${vol}. Mohon asistensi penerbitan dokumen ekspor.`)}" target="_blank" class="btn btn-primary btn-sm btn-block">
            Konsultasikan Hasil via WhatsApp
          </a>
        </div>
      </div>
    `;
  }

  if (btnRun) {
    btnRun.addEventListener('click', () => {
      btnRun.innerHTML = '<span>Menganalisis Parameter...</span>';
      setTimeout(() => {
        renderAnalysis();
        btnRun.innerHTML = `
          <span>Jalankan Analisis AI Agent</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        `;
        document.getElementById('simOutputPanel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    });
  }

  // Jalankan render awal
  renderAnalysis();

  // Tombol CTA Daftar Solusi
  const btnDaftarSolusi = document.getElementById('btnDaftarSolusi');
  if (btnDaftarSolusi) {
    btnDaftarSolusi.addEventListener('click', () => {
      const authModal = document.getElementById('authModal');
      if (authModal) authModal.classList.add('show', 'active');
    });
  }

});
