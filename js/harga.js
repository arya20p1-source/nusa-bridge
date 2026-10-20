/**
 * ==========================================================================
 * NUSABRIDGE - LOGIKA HALAMAN HARGA & SISTEM SUBSIDI EKSPOR UMKM
 * File: js/harga.js
 * Deskripsi:
 * 1. Pilihan durasi fleksibel (1 Bulan, 5 Bulan, 1 Tahun) dengan harga makin lama makin murah
 *    - 1 Bulan : Rp 120.000 / bln (Total: Rp 120.000)
 *    - 5 Bulan : Rp 90.000 / bln (Total: Rp 450.000 — Hemat 25%)
 *    - 1 Tahun : Rp 58.300 / bln (Total: Rp 700.000 — Hemat 51%)
 * 2. Sistem Kupon Voucher Subsidi UMKM Resmi (15% Subsidi Digitalisasi)
 * 3. Transparansi PPN 11% & Kebijakan Garansi Uang Kembali 7 Hari Penuh + Prorata Refund
 * 4. Kalkulator Estimasi Margin Ekspor & Accordion FAQ
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. DATA MASTER DURASI & HARGA PAKET PROFESSIONAL
  // --------------------------------------------------------------------------
  const PLANS_DATA = {
    '1': {
      months: 1,
      label: 'Paket UMKM Eksportir (1 Bulan)',
      baseTotal: 120000,
      monthlyRate: 120000,
      savingsText: 'Ditagih bulanan Rp 120.000 &bull; Fleksibel tanpa komitmen jangka panjang',
      monthlyDisplay: '120.000',
      periodDisplay: '/ bulan'
    },
    '5': {
      months: 5,
      label: 'Paket UMKM Eksportir (5 Bulan)',
      baseTotal: 450000,
      monthlyRate: 90000,
      savingsText: 'Ditagih Rp 450.000 / 5 bulan &bull; Hemat Rp 150.000 dibanding bulanan',
      monthlyDisplay: '90.000',
      periodDisplay: '/ bulan'
    },
    '12': {
      months: 12,
      label: 'Paket UMKM Eksportir (1 Tahun)',
      baseTotal: 700000,
      monthlyRate: 58333,
      savingsText: 'Ditagih Rp 700.000 / tahun &bull; Hemat Rp 740.000 vs bulanan (Paling Hemat)',
      monthlyDisplay: '58.300',
      periodDisplay: '/ bulan'
    }
  };

  let activeDuration = '12'; // Default: 1 Tahun (Paling Populer & Paling Hemat)
  let voucherClaimed = false;
  const VOUCHER_DISCOUNT_PCT = 15;
  const VOUCHER_CODE = 'SUBSIDI-UMKM-15';

  function formatIDR(num) {
    return Number(num).toLocaleString('id-ID');
  }

  // --------------------------------------------------------------------------
  // 2. ELEMEN DOM KARTU HARGA & SWITCHER DURASI
  // --------------------------------------------------------------------------
  const bdsButtons = document.querySelectorAll('.bds-btn');
  const priceAmountDisplay = document.getElementById('priceAmountDisplay');
  const pricePeriodDisplay = document.getElementById('pricePeriodDisplay');
  const billingSummaryText = document.getElementById('billingSummaryText');
  const originWrapProfessional = document.getElementById('originWrapProfessional');
  const pobStrikePrice = document.getElementById('pobStrikePrice');
  const saveBadgeProfessional = document.getElementById('saveBadgeProfessional');
  const btnSelectPlanDynamic = document.getElementById('btnSelectPlanDynamic');

  // Widget Voucher Subsidi
  const btnSpinLucky = document.getElementById('btnSpinLucky');
  const luckySlotVal = document.getElementById('luckySlotVal');
  const luckySlotSub = document.getElementById('luckySlotSub');
  const luckyAnnouncementBar = document.getElementById('luckyAnnouncementBar');
  const luckyAnnouncementTitle = document.getElementById('luckyAnnouncementTitle');
  const luckyAnnouncementMsg = document.getElementById('luckyAnnouncementMsg');

  // Input modal
  const appliedDiscountInput = document.getElementById('appliedDiscountInput');
  const selectedPlanInput = document.getElementById('selectedPlanInput');
  const authModal = document.getElementById('authModal');

  // --------------------------------------------------------------------------
  // 3. FUNGSI UPDATE TAMPILAN KARTU HARGA PROFESSIONAL
  // --------------------------------------------------------------------------
  function updateProfessionalCard() {
    const plan = PLANS_DATA[activeDuration] || PLANS_DATA['12'];
    const hasDiscount = voucherClaimed && (activeDuration === '5' || activeDuration === '12');

    let finalTotal = plan.baseTotal;
    let finalMonthly = plan.monthlyRate;

    if (hasDiscount) {
      const discAmt = Math.round(plan.baseTotal * (VOUCHER_DISCOUNT_PCT / 100));
      finalTotal = plan.baseTotal - discAmt;
      finalMonthly = Math.round(finalTotal / plan.months);

      if (originWrapProfessional) originWrapProfessional.style.display = 'flex';
      if (pobStrikePrice) pobStrikePrice.innerText = `Rp ${formatIDR(plan.baseTotal)}`;
      if (saveBadgeProfessional) {
        saveBadgeProfessional.innerText = `Subsidi 15% (-Rp ${formatIDR(discAmt)})`;
      }
      if (billingSummaryText) {
        billingSummaryText.innerHTML = `Ditagih <strong>Rp ${formatIDR(finalTotal)}</strong> (Potongan Subsidi Kupon Rp ${formatIDR(discAmt)}) &bull; Hemat Maksimal!`;
      }
      if (appliedDiscountInput) {
        appliedDiscountInput.value = `Voucher Subsidi 15% (${VOUCHER_CODE}) - Hemat Rp ${formatIDR(discAmt)}`;
      }
    } else {
      if (originWrapProfessional) originWrapProfessional.style.display = 'none';
      if (billingSummaryText) billingSummaryText.innerHTML = plan.savingsText;
      if (appliedDiscountInput && !voucherClaimed) {
        appliedDiscountInput.value = 'Tanpa Diskon Tambahan';
      }
    }

    if (priceAmountDisplay) {
      priceAmountDisplay.innerText = formatIDR(finalMonthly);
      priceAmountDisplay.classList.add('discount-highlight');
      setTimeout(() => priceAmountDisplay.classList.remove('discount-highlight'), 800);
    }

    if (pricePeriodDisplay) pricePeriodDisplay.innerText = plan.periodDisplay;

    if (btnSelectPlanDynamic) {
      btnSelectPlanDynamic.setAttribute('data-plan', plan.label);
      btnSelectPlanDynamic.setAttribute('data-price', finalTotal);
      btnSelectPlanDynamic.innerText = `Pilih ${plan.label} - Rp ${formatIDR(finalTotal)}`;
    }
  }

  // --------------------------------------------------------------------------
  // 4. EVENT LISTENER SWITCHER DURASI
  // --------------------------------------------------------------------------
  bdsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bdsButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const dur = btn.getAttribute('data-dur') || '12';
      activeDuration = dur;
      updateProfessionalCard();
    });
  });

  // --------------------------------------------------------------------------
  // 5. EVENT LISTENER KLAIM VOUCHER SUBSIDI (15% PASTI)
  // --------------------------------------------------------------------------
  function activateVoucherSubsidy(showSuccessAlert = true) {
    voucherClaimed = true;

    try {
      localStorage.setItem('nusabridge_voucher_claimed', 'true');
    } catch (e) {}

    if (btnSpinLucky) {
      btnSpinLucky.disabled = true;
      btnSpinLucky.innerHTML = '<span>✅ Voucher Subsidi 15% Aktif</span>';
      btnSpinLucky.style.background = '#059669';
    }

    if (luckySlotVal) luckySlotVal.innerText = '15%';
    if (luckySlotSub) luckySlotSub.innerText = `Kode Aktif: ${VOUCHER_CODE}`;

    if (showSuccessAlert && luckyAnnouncementBar) {
      luckyAnnouncementBar.style.display = 'flex';
      if (luckyAnnouncementTitle) luckyAnnouncementTitle.innerText = '✅ Voucher Subsidi 15% Berhasil Diaktifkan!';
      if (luckyAnnouncementMsg) {
        luckyAnnouncementMsg.innerText = `Kupon ${VOUCHER_CODE} telah memotong harga Paket 5 Bulan menjadi Rp 382.500 dan Paket 1 Tahun menjadi Rp 595.000.`;
      }
    }

    updateProfessionalCard();
  }

  if (btnSpinLucky) {
    btnSpinLucky.addEventListener('click', () => {
      activateVoucherSubsidy(true);
    });
  }

  // Cek apakah sudah pernah klaim voucher sebelumnya di browser ini
  try {
    if (localStorage.getItem('nusabridge_voucher_claimed') === 'true') {
      activateVoucherSubsidy(false);
    }
  } catch (e) {}

  // Inisialisasi awal kartu
  updateProfessionalCard();

  // --------------------------------------------------------------------------
  // 6. EVENT LISTENER PILIH PAKET (BUKA MODAL AUTH & ISI STATUS DISKON)
  // --------------------------------------------------------------------------
  document.querySelectorAll('.btn-select-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const planName = btn.getAttribute('data-plan') || 'Paket Ekspor';
      const basePrice = parseInt(btn.getAttribute('data-price') || '0', 10);

      let summaryText = planName;
      if (basePrice === 0) {
        summaryText = `${planName} - Gratis Evaluasi (Termasuk PPN 11%)`;
      } else {
        summaryText = `${planName} - Rp ${formatIDR(basePrice)} (Termasuk PPN 11%)`;
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

  // Kurs acuan BI (1 USD = Rp 16.000)
  const USD_TO_IDR = 16000;

  function recalculateMargin() {
    const contract = parseFloat(calcContractVal?.value) || 0;
    const prod = parseFloat(calcProdCost?.value) || 0;
    const freight = parseFloat(calcFreightCost?.value) || 0;

    // Biaya Administrasi Escrow Vault NusaBridge = 1.2% flat
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

  [calcContractVal, calcProdCost, calcFreightCost].forEach(inp => {
    if (inp) inp.addEventListener('input', recalculateMargin);
  });

  // Tombol Konsultasi Hasil Simulasi ke WhatsApp Tim NusaBridge
  const btnKonsul = document.getElementById('btnKonsultasiKalkulator');
  if (btnKonsul) {
    btnKonsul.addEventListener('click', () => {
      const contract = calcContractVal ? calcContractVal.value : '15000';
      const profit = calcNetProfitUSD ? calcNetProfitUSD.innerText : 'USD 5,120';
      const discInfo = voucherClaimed ? ` (Voucher Subsidi Aktif: ${VOUCHER_CODE} 15%)` : '';
      const waMsg = `Halo Tim NusaBridge, saya pelaku UMKM telah menghitung estimasi transaksi ekspor senilai USD ${contract} dengan estimasi net profit ${profit}${discInfo}. Mohon asistensi untuk eksekusi kontrak ini. Terima kasih!`;
      const waUrl = `https://wa.me/6285735800491?text=${encodeURIComponent(waMsg)}`;
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

      document.querySelectorAll('.faq-item').forEach(other => {
        other.classList.remove('active');
      });

      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

});
