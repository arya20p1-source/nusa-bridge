/**
 * ==========================================================================
 * NUSABRIDGE - CARGO SHIP RADAR & MARITIME TELEMETRY ENGINE (FLIGHT RADAR STYLE)
 * File: js/radar.js
 * Deskripsi: Engine pelacakan kapal kargo maritim interaktif (Live AIS Vessel Tracker)
 * 
 * Konsep Belajar Pemrograman Web & Matematika Grafis:
 * 1. SVG Path Geodesic Navigation:
 *    Menggunakan metode native SVG `path.getTotalLength()` dan `path.getPointAtLength(distance)`
 *    untuk menggerakkan elemen secara mulus mengikuti jalur laut yang melengkung.
 * 2. Perhitungan Vektor Haluan Kapal (Heading Trigonometry):
 *    Menghitung sudut rotasi kapal dengan `Math.atan2(dy, dx) * 180 / Math.PI`, sehingga
 *    haluan kapal otomatis selalu menghadap ke arah jalurnya persis seperti pesawat di Flightradar24.
 * 3. Lat/Long Geolocation Telemetry:
 *    Simulasi konversi posisi pixel SVG ke koordinat maritim nyata (Derajat Menit Detik).
 * 4. State Management Interaktif:
 *    Pengaturan kecepatan (1x, 2x, 5x), status jeda/lanjut (Play/Pause), serta event delegasi.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. DATA DATABASE KAPAL KARGO AKTIF (AIS MARITIME LIVE TELEMETRY)
  // --------------------------------------------------------------------------
  const vesselsData = {
    baruna: {
      id: 'baruna',
      name: 'KM Baruna Nusantara',
      callSign: 'YBDA-9482104',
      status: '🟢 Berlayar (On Schedule)',
      origin: 'Tanjung Priok, Jakarta (ID)',
      destination: 'Port of Hamburg (DE)',
      route: 'Tanjung Priok, ID ➔ Hamburg, DE',
      speed: 19.4,
      baseSpeed: 19.4,
      progress: 0.68, // 68% perjalanan
      eta: '4 Hari Lagi (24 Okt 2026)',
      cargo: '20 Kontainer (500 MT) Kopi Arabika Gayo',
      fullRoute: 'Tanjung Priok ➔ Selat Sunda ➔ Samudera Hindia ➔ Terusan Suez ➔ Hamburg',
      heading: '285° WNW (Barat Laut)',
      temp: '21.5°C (Reefer Optimal)',
      humidity: '62%',
      routePathId: 'route1',
      modalRoutePathId: 'modalRoute1',
      vesselElId: 'vessel1',
      modalVesselElId: 'modalVessel1',
      color: '#10b981',
      latRange: [-6.1, 53.5],
      longRange: [106.8, 9.9]
    },
    samudera: {
      id: 'samudera',
      name: 'MV Samudera Raya',
      callSign: 'PKST-9628101',
      status: '🟢 Berlayar Menyeberang Pasifik',
      origin: 'Tanjung Perak, Surabaya (ID)',
      destination: 'Port of Los Angeles (US)',
      route: 'Tanjung Perak, ID ➔ Los Angeles, US',
      speed: 21.2,
      baseSpeed: 21.2,
      progress: 0.45, // 45% perjalanan
      eta: '9 Hari Lagi (29 Okt 2026)',
      cargo: '15 Kontainer Kerajinan Rotan & Furnitur Ramah Lingkungan',
      fullRoute: 'Tanjung Perak Surabaya ➔ Laut Banda ➔ Samudera Pasifik ➔ Port of Los Angeles',
      heading: '065° ENE (Timur Laut)',
      temp: '24.0°C (Dry Box Ventilated)',
      humidity: '58%',
      routePathId: 'route2',
      modalRoutePathId: 'modalRoute2',
      vesselElId: 'vessel2',
      modalVesselElId: 'modalVessel2',
      color: '#38bdf8',
      latRange: [-7.2, 33.7],
      longRange: [112.7, -118.2]
    },
    celebes: {
      id: 'celebes',
      name: 'KM Celebes Express',
      callSign: 'YBCE-9319800',
      status: '🟢 Mendekati Selat Taiwan',
      origin: 'Pelabuhan Belawan, Medan (ID)',
      destination: 'Port of Tokyo (JP)',
      route: 'Pelabuhan Belawan, ID ➔ Tokyo, JP',
      speed: 17.8,
      baseSpeed: 17.8,
      progress: 0.82, // 82% perjalanan
      eta: '2 Hari Lagi (20 Okt 2026)',
      cargo: '12 Kontainer Rempah Cengkeh & Minyak Atsiri Nilam',
      fullRoute: 'Belawan Medan ➔ Selat Malaka ➔ Laut Natuna ➔ Selat Taiwan ➔ Port of Tokyo',
      heading: '035° NNE (Utara Timur Laut)',
      temp: '22.8°C (Reefer Controlled)',
      humidity: '60%',
      routePathId: 'route3',
      modalRoutePathId: 'modalRoute3',
      vesselElId: 'vessel3',
      modalVesselElId: 'modalVessel3',
      color: '#f59e0b',
      latRange: [3.8, 35.6],
      longRange: [98.7, 139.8]
    }
  };

  // State Engine Radar
  let activeVesselKey = 'baruna';
  let isSimRunning = true;
  let simSpeedMultiplier = 1; // 1x, 2x, 5x

  // Elemen DOM HUD Telemetri
  const vthShipName = document.getElementById('vthShipName');
  const vthShipStatus = document.getElementById('vthShipStatus');
  const vthShipRoute = document.getElementById('vthShipRoute');
  const vthProgressPct = document.getElementById('vthProgressPct');
  const vthEtaLabel = document.getElementById('vthEtaLabel');
  const vthProgressFill = document.getElementById('vthProgressFill');
  const radModalCoords = document.getElementById('radModalCoords');

  // Floating Popover Tooltip
  const vesselFloatingTooltip = document.getElementById('vesselFloatingTooltip');
  const modalVesselFloatingTooltip = document.getElementById('modalVesselFloatingTooltip');

  // --------------------------------------------------------------------------
  // 2. FUNGSI HITUNG KOORDINAT LAT/LONG SIMULASI
  // --------------------------------------------------------------------------
  function calculateVesselCoords(vessel) {
    const p = vessel.progress;
    const lat = vessel.latRange[0] + (vessel.latRange[1] - vessel.latRange[0]) * p;
    const long = vessel.longRange[0] + (vessel.longRange[1] - vessel.longRange[0]) * p;

    const latDir = lat >= 0 ? 'N' : 'S';
    const longDir = long >= 0 ? 'E' : 'W';

    const latDeg = Math.floor(Math.abs(lat));
    const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);

    const longDeg = Math.floor(Math.abs(long));
    const longMin = Math.floor((Math.abs(long) - longDeg) * 60);

    return `Lat: ${String(latDeg).padStart(2, '0')}°${String(latMin).padStart(2, '0')}'${latDir} • Long: ${String(longDeg).padStart(3, '0')}°${String(longMin).padStart(2, '0')}'${longDir}`;
  }

  // --------------------------------------------------------------------------
  // 3. FUNGSI MEMILIH DAN MEMPERBARUI TELEMETRI KAPAL AKTIF
  // --------------------------------------------------------------------------
  function selectVessel(vKey, showToastMsg = false) {
    const v = vesselsData[vKey];
    if (!v) return;
    activeVesselKey = vKey;

    const pctDisplay = `${Math.round(v.progress * 100)}%`;

    // Perbarui teks di widget HUD Beranda
    if (vthShipName) vthShipName.innerText = v.name;
    if (vthShipStatus) vthShipStatus.innerText = v.status;
    if (vthShipRoute) {
      vthShipRoute.innerHTML = `<span>${v.route}</span><span class="vth-speed">Kecepatan: ${v.speed.toFixed(1)} knots</span>`;
    }
    if (vthProgressPct) vthProgressPct.innerText = pctDisplay;
    if (vthEtaLabel) vthEtaLabel.innerText = `ETA: ${v.eta}`;
    if (vthProgressFill) vthProgressFill.style.width = pctDisplay;

    // Perbarui koordinat live
    if (radModalCoords) {
      radModalCoords.innerText = `📍 ${calculateVesselCoords(v)}`;
    }

    // Sorot tombol switcher yang aktif
    document.querySelectorAll('.vqs-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-vessel') === vKey);
    });

    // Sorot kapal di peta SVG (Beranda & Modal)
    document.querySelectorAll('.vessel-icon-group').forEach(group => {
      const isMatch = group.getAttribute('data-vessel') === vKey;
      group.classList.toggle('active-vessel', isMatch);
    });

    // Highlight jalur pelayaran yang aktif (jalur lain meredup lembut)
    highlightActiveShippingLane(vKey);

    // Perbarui rincian di modal fullscreen
    updateModalTelemetry(v);

    // Tampilkan floating popover sebentar di atas kapal aktif
    showVesselTooltip(v, false);

    if (showToastMsg) {
      showFeedbackToast(`🚢 Radar AIS Terhubung: ${v.name}`);
    }
  }

  function highlightActiveShippingLane(activeKey) {
    const laneMap = {
      baruna: ['route1', 'modalRoute1'],
      samudera: ['route2', 'modalRoute2'],
      celebes: ['route3', 'modalRoute3']
    };

    ['route1', 'route2', 'route3', 'modalRoute1', 'modalRoute2', 'modalRoute3'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const isCurrent = laneMap[activeKey]?.includes(id);
      if (isCurrent) {
        el.classList.add('highlighted');
        el.classList.remove('dimmed');
      } else {
        el.classList.add('dimmed');
        el.classList.remove('highlighted');
      }
    });
  }

  function updateModalTelemetry(v) {
    const rTitle = document.getElementById('radModalShipTitle');
    const rCargo = document.getElementById('radModalCargo');
    const rRoute = document.getElementById('radModalRoute');
    const rSpeed = document.getElementById('radModalSpeed');
    const rEta = document.getElementById('radModalEta');

    if (rTitle) rTitle.innerText = `${v.name} (${v.callSign})`;
    if (rCargo) rCargo.innerText = v.cargo;
    if (rRoute) rRoute.innerText = v.fullRoute;
    if (rSpeed) rSpeed.innerText = `${v.speed.toFixed(1)} Knots • Haluan: ${v.heading}`;
    if (rEta) rEta.innerText = `${v.eta} (${Math.round(v.progress * 100)}% Selesai)`;
  }

  // --------------------------------------------------------------------------
  // 4. FLOATING POPOVER TOOLTIP (FLIGHTRADAR24 / MARINETRAFFIC STYLE)
  // --------------------------------------------------------------------------
  function showVesselTooltip(v, insideModal = false) {
    const targetTooltip = insideModal ? modalVesselFloatingTooltip : vesselFloatingTooltip;
    if (!targetTooltip) return;

    const vesselEl = insideModal ? document.getElementById(v.modalVesselElId) : document.getElementById(v.vesselElId);
    if (!vesselEl) return;

    // Baca posisi transform x & y kapal
    const transformAttr = vesselEl.getAttribute('transform') || '';
    const match = transformAttr.match(/translate\(\s*([\d\.-]+)\s*,\s*([\d\.-]+)\s*\)/);
    if (!match) return;

    const posX = parseFloat(match[1]);
    const posY = parseFloat(match[2]);

    targetTooltip.innerHTML = `
      <div class="vpt-header">
        <span class="vpt-name">${v.name}</span>
        <span class="vpt-speed">${v.speed.toFixed(1)} kn</span>
      </div>
      <div class="vpt-row"><span>Rute:</span> <strong>${v.origin.split(',')[0]} ➔ ${v.destination.split('(')[0]}</strong></div>
      <div class="vpt-row"><span>Muatan:</span> <strong>${v.cargo.split('(')[0]}</strong></div>
      <div class="vpt-row"><span>Status:</span> <strong style="color:#10b981;">AIS Real-Time</strong></div>
      <div class="vpt-row"><span>ETA:</span> <strong style="color:#f59e0b;">${v.eta.split('(')[0]}</strong></div>
    `;

    // Konversi koordinat SVG (viewBox 600 x 340) ke persentase container CSS
    targetTooltip.style.left = `${(posX / 600) * 100}%`;
    targetTooltip.style.top = `${(posY / 340) * 100}%`;
    targetTooltip.style.display = 'block';
    targetTooltip.style.opacity = '1';

    // Auto-hide tooltip setelah 4.5 detik kecuali jika di-hover
    clearTimeout(targetTooltip.hideTimer);
    targetTooltip.hideTimer = setTimeout(() => {
      targetTooltip.style.opacity = '0';
      setTimeout(() => { targetTooltip.style.display = 'none'; }, 200);
    }, 4500);
  }

  // --------------------------------------------------------------------------
  // 5. ENGINE ANIMASI KAPAL BERLAYAR MULUS (FLIGHT RADAR ENGINE)
  // --------------------------------------------------------------------------
  /**
   * Logika Matematika Animasi:
   * 1. Ambil path rute dengan `document.getElementById(routeId)`
   * 2. Hitung jarak sepanjang kurva: `currentDist = totalLength * progress`
   * 3. Dapatkan koordinat titik (x, y) saat ini dengan `path.getPointAtLength(currentDist)`
   * 4. Dapatkan koordinat titik 2 piksel di depannya untuk menghitung turunan vektor sudut arah
   * 5. Putar anak panah kapal dengan `transform="rotate(angle)"`
   * 6. Geser grup kapal dengan `transform="translate(x, y)"`
   */
  function updateShipPositionOnPath(vessel, pathId, elementId) {
    const path = document.getElementById(pathId);
    const vesselGroup = document.getElementById(elementId);
    if (!path || !vesselGroup) return;

    try {
      const totalLen = path.getTotalLength();
      const curDist = totalLen * vessel.progress;
      const pt = path.getPointAtLength(curDist);

      // Titik sedikit di depan untuk kalkulasi sudut rotasi haluan
      const nextDist = Math.min(totalLen, curDist + 2);
      const nextPt = path.getPointAtLength(nextDist);

      const dx = nextPt.x - pt.x;
      const dy = nextPt.y - pt.y;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Update posisi grup SVG kapal
      vesselGroup.setAttribute('transform', `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`);

      // Update rotasi arah haluan kapal
      const arrow = vesselGroup.querySelector('.vessel-arrow');
      if (arrow) {
        arrow.setAttribute('transform', `rotate(${angle.toFixed(1)})`);
      }
    } catch (e) {
      // Graceful fallback jika SVG path belum ter-render sempurna di DOM
    }
  }

  // Loop Animasi Utama (Real-time AIS Stream)
  function runRadarTick() {
    if (!isSimRunning) return;

    Object.keys(vesselsData).forEach(key => {
      const v = vesselsData[key];

      // Kapal berlayar maju perlahan: 0.0003 per tick dikali multiplier kecepatan
      v.progress += 0.00025 * simSpeedMultiplier;
      if (v.progress > 0.98) {
        v.progress = 0.02; // Loop kembali ke pelabuhan awal setelah tiba di tujuan
      }

      // Sedikit fluktuasi kecepatan knots agar realistis
      const speedDelta = (Math.random() - 0.5) * 0.08 * simSpeedMultiplier;
      v.speed = Math.max(16, Math.min(24, v.speed + speedDelta));

      // Update posisi kapal di widget Beranda
      updateShipPositionOnPath(v, v.routePathId, v.vesselElId);

      // Update posisi kapal di modal Fullscreen
      updateShipPositionOnPath(v, v.modalRoutePathId, v.modalVesselElId);
    });

    // Update data kapal aktif di HUD
    const curVessel = vesselsData[activeVesselKey];
    if (curVessel) {
      const pctDisplay = `${Math.round(curVessel.progress * 100)}%`;
      if (vthProgressPct) vthProgressPct.innerText = pctDisplay;
      if (vthProgressFill) vthProgressFill.style.width = pctDisplay;
      if (vthShipRoute) {
        vthShipRoute.innerHTML = `<span>${curVessel.route}</span><span class="vth-speed">Kecepatan: ${curVessel.speed.toFixed(1)} knots</span>`;
      }
      if (radModalCoords) {
        radModalCoords.innerText = `📍 ${calculateVesselCoords(curVessel)}`;
      }
    }
  }

  // Jalankan loop interval dengan frekuensi halus (30 FPS untuk animasi peta)
  const radarInterval = setInterval(runRadarTick, 35);

  // --------------------------------------------------------------------------
  // 6. EVENT LISTENERS: KLIK KAPAL, SWITCHER TABS & TOOLBAR
  // --------------------------------------------------------------------------

  // A. Tombol Quick Switcher Tabs di Bawah Radar HUD
  document.querySelectorAll('.vqs-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const vKey = btn.getAttribute('data-vessel');
      selectVessel(vKey, true);
    });
  });

  // B. Klik Langsung Pada Kapal di Peta SVG (Beranda & Modal)
  ['vessel1', 'vessel2', 'vessel3', 'modalVessel1', 'modalVessel2', 'modalVessel3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const vKey = el.getAttribute('data-vessel');
        if (vKey) {
          const isModal = id.startsWith('modal');
          selectVessel(vKey, true);
          showVesselTooltip(vesselsData[vKey], isModal);
        }
      });

      // Hover event untuk menampilkan popover seketika
      el.addEventListener('mouseenter', () => {
        const vKey = el.getAttribute('data-vessel');
        if (vKey) {
          const isModal = id.startsWith('modal');
          showVesselTooltip(vesselsData[vKey], isModal);
        }
      });
    }
  });

  // C. Toolbar Modal Radar (Play/Pause & Speed Simulator)
  const btnRadarPlayPause = document.getElementById('btnRadarPlayPause');
  const radarPlayPauseIcon = document.getElementById('radarPlayPauseIcon');
  const radarPlayPauseText = document.getElementById('radarPlayPauseText');

  if (btnRadarPlayPause) {
    btnRadarPlayPause.addEventListener('click', () => {
      isSimRunning = !isSimRunning;
      if (isSimRunning) {
        btnRadarPlayPause.classList.add('active');
        btnRadarPlayPause.classList.remove('paused');
        if (radarPlayPauseIcon) radarPlayPauseIcon.innerText = '⏸️';
        if (radarPlayPauseText) radarPlayPauseText.innerText = 'Live Streaming AIS';
        showFeedbackToast('▶️ Pelacakan Satelit AIS Dilanjutkan');
      } else {
        btnRadarPlayPause.classList.remove('active');
        btnRadarPlayPause.classList.add('paused');
        if (radarPlayPauseIcon) radarPlayPauseIcon.innerText = '▶️';
        if (radarPlayPauseText) radarPlayPauseText.innerText = 'Dijeda';
        showFeedbackToast('⏸️ Simulasi Pelayaran Maritim Dijeda');
      }
    });
  }

  // Tombol Pengatur Kecepatan Simulasi (1x, 2x, 5x)
  ['btnSpeed1x', 'btnSpeed2x', 'btnSpeed5x'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-speed-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        simSpeedMultiplier = parseInt(btn.getAttribute('data-speed'), 10) || 1;
        showFeedbackToast(`⚡ Kecepatan Radar Maritim: ${simSpeedMultiplier}x`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // 7. MODAL RADAR LAYAR PENUH (FULLSCREEN MODAL HANDLERS)
  // --------------------------------------------------------------------------
  const radarModal = document.getElementById('radarModal');
  const btnOpenRadarModal = document.getElementById('btnOpenRadarModal');
  const closeRadarModal = document.getElementById('closeRadarModal');

  if (btnOpenRadarModal && radarModal) {
    btnOpenRadarModal.addEventListener('click', () => {
      selectVessel(activeVesselKey);
      radarModal.classList.add('active');
      radarModal.classList.add('show');
      showFeedbackToast('🔭 Membuka Radar Maritim Resolusi Tinggi (Full View)');
    });
  }

  if (closeRadarModal && radarModal) {
    closeRadarModal.addEventListener('click', () => {
      radarModal.classList.remove('active');
      radarModal.classList.remove('show');
    });
  }

  if (radarModal) {
    radarModal.addEventListener('click', (e) => {
      if (e.target === radarModal) {
        radarModal.classList.remove('active');
        radarModal.classList.remove('show');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 8. MODAL DETAIL TRANSAKSI ESCROW INTERAKTIF
  // --------------------------------------------------------------------------
  const txData = {
    gayo: {
      title: 'Kontrak Ekspor #TRX-2026-GY-01',
      product: 'Kopi Arabika Gayo Specialty Grade 1',
      buyer: 'Hanseatic Coffee Importers GmbH (Hamburg, Jerman 🇩🇪)',
      value: 'USD 12,000 (FOB Belawan Port)',
      volume: '1,400 Kg (GrainPro Hermetic Bags)',
      status: 'Tahap Negosiasi Sales Contract Akhir',
      step: 1,
      escrowPaid: 'USD 3,600 (30% DP siap ditransfer buyer ke Escrow Vault)',
      docs: ['Draft Sales Contract #SC-088', 'Proforma Invoice #INV-049', 'Sertifikat Uji Organik ICO']
    },
    rempah: {
      title: 'Kontrak Ekspor #TRX-2026-RP-04',
      product: 'Cengkeh Lal Maluku Kering Pilihan (Cloves)',
      buyer: 'Spice Orient FZE (Dubai, Uni Emirat Arab 🇦🇪)',
      value: 'USD 8,750 (CIF Jebel Ali Port)',
      volume: '1,400 Kg (Double PP Bags)',
      status: 'Proses Dokumen Kepabeanan & PEB',
      step: 2,
      escrowPaid: 'USD 5,250 (Tahap 1 & 2 Tercairkan ke Rekening UMKM)',
      docs: ['Commercial Invoice Resmi', 'Packing List 56 Colly', 'Draft PEB Beacukai', 'Phytosanitary Cert']
    },
    tenun: {
      title: 'Kontrak Ekspor #TRX-2026-TN-09',
      product: 'Kain Tenun Ikat Pewarna Alami Sumba',
      buyer: 'Artisan Heritage Gallery (Amsterdam, Belanda 🇳🇱)',
      value: 'USD 24,000 (Air Freight Door to Port)',
      volume: '960 Lembar Tenun Pewarna Herbal',
      status: 'Dalam Pengiriman Kapal & Pelacakan Laut',
      step: 3,
      escrowPaid: 'USD 19,200 (80% Dana Berhasil Masuk Rekening UMKM)',
      docs: ['Bill of Lading #BL-99214', 'COO Form A/D', 'Maritime Insurance Policy', 'Customs Clearance NPE']
    }
  };

  const txDetailModal = document.getElementById('txDetailModal');
  const closeTxModal = document.getElementById('closeTxModal');
  const btnOkTx = document.getElementById('btnOkTx');
  const txModalTitle = document.getElementById('txModalTitle');
  const txModalSub = document.getElementById('txModalSub');
  const txModalBody = document.getElementById('txModalBody');

  function openTxModal(txKey) {
    const t = txData[txKey] || txData.gayo;
    if (!txDetailModal) return;

    if (txModalTitle) txModalTitle.innerText = t.title;
    if (txModalSub) txModalSub.innerText = `${t.product} • Nilai: ${t.value}`;

    if (txModalBody) {
      txModalBody.innerHTML = `
        <div style="background:var(--bg-card-subtle); padding:16px; border-radius:var(--radius-md); font-size:13px; display:flex; flex-direction:column; gap:8px; border:1px solid var(--border-light);">
          <div><strong>Global Buyer:</strong> ${t.buyer}</div>
          <div><strong>Volume Muatan:</strong> ${t.volume}</div>
          <div><strong>Status Transaksi:</strong> <span style="color:#10b981; font-weight:800;">${t.status}</span></div>
          <div><strong>Pencairan Dana Escrow:</strong> <strong style="color:var(--primary);">${t.escrowPaid}</strong></div>
        </div>

        <div style="margin-top:10px;">
          <h5 style="font-size:13px; color:var(--navy-title); margin-bottom:8px; font-weight:700;">Dokumen Terintegrasi AI Agent:</h5>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:12.5px;">
            ${t.docs.map(d => `
              <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:#f8fafc; border-radius:6px;">
                <span style="color:#10b981; font-weight:800;">✓</span> <span>${d}</span>
                <span style="font-size:10.5px; background:#eff6ff; color:#1b68f8; font-weight:700; padding:2px 8px; border-radius:12px; margin-left:auto;">Terverifikasi</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-top:12px;">
          <button class="btn btn-primary btn-block btn-download-tx-pdf" type="button">
            📄 Unduh Berkas Kontrak &amp; Dokumen Ekspor (PDF)
          </button>
        </div>
      `;

      const btnDl = txModalBody.querySelector('.btn-download-tx-pdf');
      if (btnDl) {
        btnDl.addEventListener('click', () => {
          const contractHtml = `
            <div class="header">
              <div>
                <div class="title">INTERNATIONAL EXPORT SALES CONTRACT</div>
                <div style="font-size:12px; color:#64748b; margin-top:4px;">No: ${t.title} &bull; Ref: NB-CONTRACT-2026-GTNIC</div>
              </div>
              <div class="seal">✓ NUSABRIDGE ESCROW PROTECTED</div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; font-size:12px; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">
              <div>
                <strong style="color:#0f172a; text-transform:uppercase;">Eksportir Terverifikasi:</strong>
                <p style="margin:4px 0 0; color:#334155;">
                  <strong>CV Kopi & Rempah Nusantara Mandiri</strong><br>
                  NIB: 1294801928415 &bull; NPWP: 01.234.567.8-012.000<br>
                  Indonesia &bull; Verified Global Exporter Shield
                </p>
              </div>
              <div>
                <strong style="color:#0f172a; text-transform:uppercase;">Global Buyer:</strong>
                <p style="margin:4px 0 0; color:#334155;">
                  <strong>${t.buyer}</strong><br>
                  Status Pembayaran: <strong style="color:#059669;">100% Escrow Deposited</strong><br>
                  Tahap Pencairan: ${t.escrowPaid}
                </p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Deskripsi Komoditas</th>
                  <th>Volume / Kuantitas</th>
                  <th>Status Ekspor</th>
                  <th>Nilai Kontrak</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${t.product}</strong><br><small style="color:#64748b;">Standar Mutu Ekspor &amp; Uji Mutu Sucofindo Lolos</small></td>
                  <td>${t.volume}</td>
                  <td><span style="color:#059669; font-weight:700;">${t.status}</span></td>
                  <td><strong style="color:#1e3a8a;">${t.value}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top:14px;">
              <h5 style="font-size:13px; color:#0f172a; margin-bottom:8px; font-weight:700;">Dokumen Kepatuhan &amp; Legalitas yang Disertakan:</h5>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px;">
                ${t.docs.map(d => `<div style="padding:6px 10px; background:#f1f5f9; border-radius:4px;">✓ <strong>${d}</strong> (Tervalidasi)</div>`).join('')}
              </div>
            </div>

            <div style="margin-top:18px; font-size:11.5px; color:#475569; background:#ecfdf5; border:1px solid #a7f3d0; padding:10px 14px; border-radius:6px;">
              <strong>Klausul Escrow Vault 4 Tahap:</strong> Seluruh pembayaran telah dijamin oleh NusaBridge Escrow Vault berstandar smart contract ICC Incoterms 2020. Dana dicairkan bertahap sesuai telemetri kapal kargo (30% DP &bull; 30% PEB Bea Cukai &bull; 20% Bill of Lading &bull; 20% Sandar di Pelabuhan Tujuan).
            </div>

            <div class="footer">
              <div>
                <span>Digital Signatures Verified by NusaBridge AI</span><br>
                <span>Timestamp: ${new Date().toLocaleString('id-ID')}</span>
              </div>
              <div style="text-align:right;">
                <span>Authorized by International Chamber of Commerce (ICC) Model</span><br>
                <strong>NusaBridge Global Trade Settlement</strong>
              </div>
            </div>
          `;
          downloadHtmlFile(`Kontrak-Ekspor-${t.product.replace(/[^a-zA-Z0-9]/g, '-')}.html`, `Kontrak Ekspor - ${t.product}`, contractHtml);
          showFeedbackToast('📄 Dokumen ekspor resmi berhasil diunduh ke perangkat Anda!');
        });
      }
    }

    txDetailModal.classList.add('active');
    txDetailModal.classList.add('show');
  }

  function downloadHtmlFile(filename, title, bodyHtml) {
    const fullDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; background: #fff; }
    .container { max-width: 800px; margin: 0 auto; border: 2px solid #0f172a; padding: 28px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: 800; color: #1e3a8a; }
    .seal { font-size: 11px; font-weight: 800; color: #1b68f8; border: 1.5px solid #1b68f8; padding: 4px 10px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12.5px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; color: #1e293b; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
    .btn-print { background: #1b68f8; color: #fff; border: none; padding: 8px 16px; font-weight: 700; border-radius: 6px; cursor: pointer; margin-bottom: 16px; font-size: 13px; }
    @media print { .btn-print { display: none; } body { margin: 0; } .container { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div style="text-align: right; max-width: 800px; margin: 0 auto;">
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

  // Listener tombol download manifest maritim di modal radar
  const btnDownloadManifest = document.getElementById('btnDownloadManifest');
  if (btnDownloadManifest) {
    btnDownloadManifest.addEventListener('click', () => {
      const activeVesselKey = currentVesselKey || 'baruna';
      const vessel = AIS_VESSELS[activeVesselKey] || AIS_VESSELS.baruna;

      const manifestHtml = `
        <div class="header">
          <div>
            <div class="title">OFFICIAL MARITIME CARGO MANIFEST</div>
            <div style="font-size:12px; color:#64748b;">No: MAN-${Date.now()} &bull; Tanggal: ${new Date().toLocaleDateString('id-ID')}</div>
          </div>
          <div class="seal">🛡️ VERIFIED BY NUSABRIDGE AIS</div>
        </div>
        <p><strong>Kapal Pengangkut:</strong> ${vessel.name} (${vessel.callsign})<br>
        <strong>Rute Pelayaran:</strong> ${vessel.route}<br>
        <strong>Posisi AIS:</strong> Koordinat ${vessel.coords} &bull; Kecepatan: ${vessel.speed}</p>
        <table>
          <thead>
            <tr>
              <th>Deskripsi Muatan Kontainer</th>
              <th>Volume / Berat</th>
              <th>Pelabuhan Muat (POL)</th>
              <th>Pelabuhan Bongkar (POD)</th>
              <th>Estimasi Kedatangan (ETA)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${vessel.cargo}</strong></td>
              <td>1 x 20ft FCL (Standard Container)</td>
              <td>Tanjung Priok Port (ID)</td>
              <td>${vessel.destination}</td>
              <td><strong style="color:#059669;">${vessel.eta}</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <div>Status Pelayaran: <strong>ON SCHEDULE (68% Selesai)</strong></div>
          <div>Otoritas Pelayaran: <strong>NusaBridge Maritime Tracking Suite</strong></div>
        </div>
      `;

      downloadHtmlFile(`Manifest-Pelayaran-${vessel.name.replace(/\s+/g, '-')}.html`, `Manifest Pelayaran - ${vessel.name}`, manifestHtml);
      showFeedbackToast('🚢 Manifest pelayaran maritim resmi berhasil diunduh ke perangkat Anda!');
    });
  }

  document.querySelectorAll('.interactive-tx').forEach(row => {
    row.addEventListener('click', () => {
      const key = row.getAttribute('data-tx');
      openTxModal(key);
    });
  });

  const btnLihatSemuaTx = document.getElementById('btnLihatSemuaTx');
  if (btnLihatSemuaTx) {
    btnLihatSemuaTx.addEventListener('click', () => {
      openTxModal('gayo');
    });
  }

  if (closeTxModal) {
    closeTxModal.addEventListener('click', () => {
      txDetailModal.classList.remove('active');
      txDetailModal.classList.remove('show');
    });
  }

  if (btnOkTx) {
    btnOkTx.addEventListener('click', () => {
      txDetailModal.classList.remove('active');
      txDetailModal.classList.remove('show');
    });
  }

  if (txDetailModal) {
    txDetailModal.addEventListener('click', (e) => {
      if (e.target === txDetailModal) {
        txDetailModal.classList.remove('active');
        txDetailModal.classList.remove('show');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. HELPER TOAST NOTIFIKASI FEEDBACK
  // --------------------------------------------------------------------------
  function showFeedbackToast(msg) {
    const toast = document.getElementById('langToast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // Inisialisasi awal saat halaman selesai dimuat
  selectVessel('baruna', false);

});
