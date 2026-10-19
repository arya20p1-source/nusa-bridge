/**
 * ==========================================================================
 * NUSABRIDGE - LOGIKA HALAMAN HARGA & SISTEM UNDIAN KEBERUNTUNGAN UMKM
 * File: js/harga.js
 * Deskripsi: 
 * 1. Sistem Undian Hoki Diskon Perusahaan (5% s/d 25%+) real-time
 * 2. Pemotongan harga otomatis Paket 5 Bulan (Rp 350.000) & Paket 1 Tahun (Rp 845.000)
 * 3. Persistensi kupon di localStorage & integrasi modal pendaftaran
 * 4. Mode Demo Juri (Undi Ulang) untuk presentasi lomba GTNIC 2026
 * 5. Kalkulator Margin Ekspor & Accordion FAQ
 * 
 * Konsep Belajar Siswa:
 * - Event Handling: Menerima klik tombol undian & pemilihan paket
 * - Math Operations & Currency Formatting: Menghitung persentase diskon & format Rupiah
 * - Animation & Timing: setInterval untuk animasi rolling slot angka
 * - Web Storage API: localStorage untuk menyimpan hasil undian pengunjung
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. DATA MASTER HARGA & STATE APLIKASI
  // --------------------------------------------------------------------------
  const BASE_PRICE_5_BULAN = 350000; // Rp 350.000 untuk 5 Bulan
  const BASE_PRICE_1_TAHUN = 845000; // Rp 845.000 untuk 1 Tahun

  // Pool persentase diskon acak (5% s/d 25%+)
  const LUCKY_DISCOUNT_POOL = [5, 10, 12, 15, 20, 25];

  let currentDiscount = 0;
  let currentPromoCode = '';

  // Helper pemformat angka ke format mata uang Rupiah Indonesia
  function formatNumber(num) {
    return Number(num).toLocaleString('id-ID');
  }

  // --------------------------------------------------------------------------
  // 2. ELEMEN DOM SISTEM UNDIAN & KARTU HARGA
  // --------------------------------------------------------------------------
  const btnSpinLucky = document.getElementById('btnSpinLucky');
  const btnResetLucky = document.getElementById('btnResetLucky');
  const luckySlotVal = document.getElementById('luckySlotVal');
  const luckySlotSub = document.getElementById('luckySlotSub');
  const luckyAnnouncementBar = document.getElementById('luckyAnnouncementBar');
  const luckyAnnouncementTitle = document.getElementById('luckyAnnouncementTitle');
  const luckyAnnouncementMsg = document.getElementById('luckyAnnouncementMsg');

  // Kartu Paket 5 Bulan
  const price5Bulan = document.getElementById('price5Bulan');
  const originWrap5Bulan = document.getElementById('originWrap5Bulan');
  const saveBadge5Bulan = document.getElementById('saveBadge5Bulan');

  // Kartu Paket 1 Tahun
  const price1Tahun = document.getElementById('price1Tahun');
  const originWrap1Tahun = document.getElementById('originWrap1Tahun');
  const saveBadge1Tahun = document.getElementById('saveBadge1Tahun');

  // Input modal pendaftaran
  const appliedDiscountInput = document.getElementById('appliedDiscountInput');
  const selectedPlanInput = document.getElementById('selectedPlanInput');
  const authModal = document.getElementById('authModal');

  // --------------------------------------------------------------------------
  // 3. FUNGSI APLIKASI DISKON REAL-TIME KE SEMUA KARTU & FORM
  // --------------------------------------------------------------------------
  function applyDiscount(discountPct, promoCode) {
    currentDiscount = discountPct;
    currentPromoCode = promoCode;

    if (discountPct > 0) {
      // Hitung potongan Paket 5 Bulan
      const disc5 = Math.round(BASE_PRICE_5_BULAN * (discountPct / 100));
      const final5 = BASE_PRICE_5_BULAN - disc5;
      if (price5Bulan) price5Bulan.innerText = formatNumber(final5);
      if (originWrap5Bulan) originWrap5Bulan.style.display = 'flex';
      if (saveBadge5Bulan) saveBadge5Bulan.innerText = `Hemat ${discountPct}% (-Rp ${formatNumber(disc5)})`;

      // Hitung potongan Paket 1 Tahun
      const disc1 = Math.round(BASE_PRICE_1_TAHUN * (discountPct / 100));
      const final1 = BASE_PRICE_1_TAHUN - disc1;
      if (price1Tahun) price1Tahun.innerText = formatNumber(final1);
      if (originWrap1Tahun) originWrap1Tahun.style.display = 'flex';
      if (saveBadge1Tahun) saveBadge1Tahun.innerText = `Hemat ${discountPct}% (-Rp ${formatNumber(disc1)})`;

      // Update Tampilan Widget Undian
      if (luckySlotVal) luckySlotVal.innerText = `${discountPct}%`;
      if (luckySlotSub) luckySlotSub.innerText = `Kupon: ${promoCode}`;

      // Update Bar Pengumuman
      if (luckyAnnouncementBar) luckyAnnouncementBar.style.display = 'flex';
      if (luckyAnnouncementTitle) luckyAnnouncementTitle.innerText = `🎉 Hoki Terverifikasi! Diskon ${discountPct}% Aktif!`;
      if (luckyAnnouncementMsg) {
        luckyAnnouncementMsg.innerText = `Kupon ${promoCode} berhasil memotong harga Paket 5 Bulan (menjadi Rp ${formatNumber(final5)}) dan Paket 1 Tahun (menjadi Rp ${formatNumber(final1)}). Potongan otomatis berlaku di form pendaftaran!`;
      }

      // Update Input Tersembunyi di Formulir Modal
      if (appliedDiscountInput) {
        appliedDiscountInput.value = `Diskon ${discountPct}% (${promoCode}) - Hemat s/d Rp ${formatNumber(disc1)}`;
      }

      // Toggle Tombol Spin & Reset (Mode Demo Juri)
      if (btnSpinLucky) btnSpinLucky.style.display = 'none';
      if (btnResetLucky) btnResetLucky.style.display = 'inline-flex';
    }
  }

  // --------------------------------------------------------------------------
  // 4. FUNGSI RESET DISKON (UNTUK DEMO PENILAIAN JURI LOMBA)
  // --------------------------------------------------------------------------
  function resetDiscount() {
    currentDiscount = 0;
    currentPromoCode = '';
    localStorage.removeItem('nusabridge_lucky_discount');

    // Kembalikan widget ke posisi awal
    if (luckySlotVal) luckySlotVal.innerText = '0%';
    if (luckySlotSub) luckySlotSub.innerText = 'Siap diundi';
    if (luckyAnnouncementBar) luckyAnnouncementBar.style.display = 'none';

    // Kembalikan harga Paket 5 Bulan ke normal
    if (originWrap5Bulan) originWrap5Bulan.style.display = 'none';
    if (price5Bulan) price5Bulan.innerText = formatNumber(BASE_PRICE_5_BULAN);

    // Kembalikan harga Paket 1 Tahun ke normal
    if (originWrap1Tahun) originWrap1Tahun.style.display = 'none';
    if (price1Tahun) price1Tahun.innerText = formatNumber(BASE_PRICE_1_TAHUN);

    // Reset status di formulir
    if (appliedDiscountInput) appliedDiscountInput.value = 'Tanpa Diskon Tambahan';

    // Toggle tombol kembali
    if (btnSpinLucky) {
      btnSpinLucky.style.display = 'inline-flex';
      btnSpinLucky.disabled = false;
    }
    if (btnResetLucky) btnResetLucky.style.display = 'none';
  }

  // --------------------------------------------------------------------------
  // 5. EVENT LISTENER PUTAR UNDIAN DISKON (SLOT MACHINE ROLLER)
  // --------------------------------------------------------------------------
  if (btnSpinLucky) {
    btnSpinLucky.addEventListener('click', () => {
      // Cegah klik ganda selama proses rolling
      btnSpinLucky.disabled = true;
      if (luckySlotVal) luckySlotVal.classList.add('rolling');
      if (luckySlotSub) luckySlotSub.innerText = 'Mengacak diskon hoki...';

      let rollCount = 0;
      const rollInterval = setInterval(() => {
        // Tampilkan angka acak cepat saat animasi rolling
        const randomTemp = LUCKY_DISCOUNT_POOL[Math.floor(Math.random() * LUCKY_DISCOUNT_POOL.length)];
        if (luckySlotVal) luckySlotVal.innerText = `${randomTemp}%`;
        rollCount++;

        // Hentikan putaran setelah ~1.1 detik (15 putaran x 75ms)
        if (rollCount >= 15) {
          clearInterval(rollInterval);
          if (luckySlotVal) luckySlotVal.classList.remove('rolling');

          // Pilih diskon final secara adil
          const finalDiscount = LUCKY_DISCOUNT_POOL[Math.floor(Math.random() * LUCKY_DISCOUNT_POOL.length)];
          const finalCode = `HOKI${finalDiscount}EX`;

          // Simpan ke localStorage agar tidak hilang saat reload halaman
          try {
            localStorage.setItem('nusabridge_lucky_discount', JSON.stringify({
              discount: finalDiscount,
              code: finalCode,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.warn('LocalStorage error:', e);
          }

          // Terapkan diskon ke UI
          applyDiscount(finalDiscount, finalCode);
        }
      }, 75);
    });
  }

  // Tombol Reset untuk Presentasi Lomba
  if (btnResetLucky) {
    btnResetLucky.addEventListener('click', resetDiscount);
  }

  // Periksa apakah user sudah pernah memutar undian sebelumnya di browser ini
  try {
    const savedPromo = localStorage.getItem('nusabridge_lucky_discount');
    if (savedPromo) {
      const parsed = JSON.parse(savedPromo);
      if (parsed && parsed.discount) {
        applyDiscount(parsed.discount, parsed.code);
      }
    }
  } catch (e) {
    console.warn('Error reading saved promo:', e);
  }

  // --------------------------------------------------------------------------
  // 6. EVENT LISTENER PILIH PAKET (BUKA MODAL AUTH & ISI STATUS DISKON)
  // --------------------------------------------------------------------------
  document.querySelectorAll('.btn-select-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const planName = btn.getAttribute('data-plan') || 'Paket Ekspor';
      const basePrice = parseInt(btn.getAttribute('data-price') || '0', 10);

      let summaryText = planName;
      if (basePrice === 0) {
        summaryText = `${planName} - Gratis 30 Hari Pertama`;
      } else if (currentDiscount > 0) {
        const discAmount = Math.round(basePrice * (currentDiscount / 100));
        const finalPrice = basePrice - discAmount;
        summaryText = `${planName} - Rp ${formatNumber(finalPrice)} (Diskon ${currentDiscount}% Hemat Rp ${formatNumber(discAmount)})`;
      } else {
        summaryText = `${planName} - Rp ${formatNumber(basePrice)}`;
      }

      if (selectedPlanInput) {
        selectedPlanInput.value = summaryText;
      }

      // Tampilkan Modal Pendaftaran
      if (authModal) {
        authModal.classList.add('active');
        authModal.classList.add('show');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 7. KALKULATOR ESTIMASI MARGIN & KEUNTUNGAN EKSPOR UMKM
  // --------------------------------------------------------------------------
  const calcContractVal = document.getElementById('calcContractVal');
  const calcProdCost = document.getElementById('calcProdCost');
  const calcFreightCost = document.getElementById('calcFreightCost');
  const calcEscrowFee = document.getElementById('calcEscrowFee');
  const calcNetProfitUSD = document.getElementById('calcNetProfitUSD');
  const calcNetProfitIDR = document.getElementById('calcNetProfitIDR');
  const calcMarginPct = document.getElementById('calcMarginPct');
  const calcDpAmount = document.getElementById('calcDpAmount');

  // Kurs referensi pasar (1 USD = Rp 16.000)
  const USD_TO_IDR = 16000;

  function recalculateMargin() {
    const contract = parseFloat(calcContractVal?.value) || 0;
    const prod = parseFloat(calcProdCost?.value) || 0;
    const freight = parseFloat(calcFreightCost?.value) || 0;

    // Biaya Administrasi Escrow Vault NusaBridge = 1.2%
    const escrow = contract * 0.012;
    const totalCost = prod + freight + escrow;
    const netProfit = Math.max(0, contract - totalCost);
    const marginPct = contract > 0 ? ((netProfit / contract) * 100).toFixed(1) : '0';
    const dp = contract * 0.3; // 30% Down Payment Tahap 1

    if (calcEscrowFee) {
      calcEscrowFee.value = `USD ${escrow.toLocaleString('en-US', { maximumFractionDigits: 1 })}`;
    }
    if (calcNetProfitUSD) {
      calcNetProfitUSD.innerText = `USD ${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    if (calcNetProfitIDR) {
      calcNetProfitIDR.innerText = `≈ Rp ${(netProfit * USD_TO_IDR).toLocaleString('id-ID')} ,-`;
    }
    if (calcMarginPct) {
      calcMarginPct.innerText = `${marginPct}%`;
    }
    if (calcDpAmount) {
      calcDpAmount.innerText = `USD ${dp.toLocaleString('en-US')} (Rp ${(dp * USD_TO_IDR / 1000000).toFixed(1)} Jt)`;
    }
  }

  // Hitung ulang setiap kali ada input angka yang diubah pengguna
  [calcContractVal, calcProdCost, calcFreightCost].forEach(inp => {
    if (inp) inp.addEventListener('input', recalculateMargin);
  });

  // Tombol Konsultasi Hasil Simulasi ke WhatsApp Tim NusaBridge
  const btnKonsul = document.getElementById('btnKonsultasiKalkulator');
  if (btnKonsul) {
    btnKonsul.addEventListener('click', () => {
      const contract = calcContractVal ? calcContractVal.value : '15000';
      const profit = calcNetProfitUSD ? calcNetProfitUSD.innerText : 'USD 5,120';
      const discInfo = currentDiscount > 0 ? ` (Dapat Kupon Diskon Hoki: ${currentPromoCode} - ${currentDiscount}%)` : '';
      const waMsg = `Halo Tim NusaBridge, saya pelaku UMKM telah menghitung estimasi transaksi ekspor senilai USD ${contract} dengan estimasi net profit ${profit}${discInfo}. Mohon asistensi untuk eksekusi kontrak ini. Terima kasih!`;
      const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(waMsg)}`;
      window.open(waUrl, '_blank');
    });
  }

  // --------------------------------------------------------------------------
  // 8. ACCORDION FAQ (PERTANYAAN UMUM)
  // --------------------------------------------------------------------------
  document.querySelectorAll('.faq-question').forEach(qBtn => {
    qBtn.addEventListener('click', () => {
      const item = qBtn.parentElement;
      const isActive = item.classList.contains('active');

      // Tutup accordion lain agar tampilan tetap rapi
      document.querySelectorAll('.faq-item').forEach(other => {
        other.classList.remove('active');
      });

      // Buka/tutup yang diklik
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

});
