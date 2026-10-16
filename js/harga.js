/**
 * ==========================================================================
 * NUSABRIDGE - LOGIKA HALAMAN HARGA & KALKULATOR MARGIN
 * File: js/harga.js
 * Deskripsi: Toggle siklus tagihan, kalkulator margin ekspor, dan accordion FAQ
 * 
 * Konsep Belajar JavaScript:
 * 1. State Management: Menyimpan status `isYearly` (boolean) untuk diskon
 * 2. Real-Time Math Calculator: Menghitung persentase margin, fee escrow, dan kurs IDR
 * 3. Class Toggling: Menambah/menghapus kelas CSS `.active` untuk animasi saklar
 * 4. Accordion Toggle: Mengontrol buka-tutup elemen FAQ tanpa bentrok
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. TOGGLE HARGA SIKLUS BULANAN / TAHUNAN (DISKON 20%)
  // --------------------------------------------------------------------------
  const btnBillingToggle = document.getElementById('btnBillingToggle');
  const labelMonthly = document.getElementById('labelMonthly');
  const labelYearly = document.getElementById('labelYearly');
  const pricePro = document.getElementById('pricePro');
  const periodPro = document.getElementById('periodPro');

  let isYearly = false;

  function updatePricing() {
    if (isYearly) {
      if (btnBillingToggle) btnBillingToggle.classList.add('active');
      if (labelMonthly) labelMonthly.classList.remove('active');
      if (labelYearly) labelYearly.classList.add('active');
      if (pricePro) pricePro.innerText = '239.000';
      if (periodPro) periodPro.innerText = '/ bulan (ditagih tahunan)';
    } else {
      if (btnBillingToggle) btnBillingToggle.classList.remove('active');
      if (labelMonthly) labelMonthly.classList.add('active');
      if (labelYearly) labelYearly.classList.remove('active');
      if (pricePro) pricePro.innerText = '299.000';
      if (periodPro) periodPro.innerText = '/ bulan';
    }
  }

  if (btnBillingToggle) {
    btnBillingToggle.addEventListener('click', () => {
      isYearly = !isYearly;
      updatePricing();
    });
  }

  // --------------------------------------------------------------------------
  // 2. TOMBOL PILIH PAKET -> BUKA MODAL AUTH / DAFTAR
  // --------------------------------------------------------------------------
  const authModal = document.getElementById('authModal');
  const selectedPlanInput = document.getElementById('selectedPlanInput');

  document.querySelectorAll('.btn-select-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const planName = btn.getAttribute('data-plan') || 'Pro Go-Global';
      if (selectedPlanInput) {
        selectedPlanInput.value = `${planName} (${isYearly ? 'Tahunan - Hemat 20%' : 'Bulanan'})`;
      }
      if (authModal) authModal.classList.add('show');
    });
  });

  // --------------------------------------------------------------------------
  // 3. KALKULATOR ESTIMASI MARGIN & KEUNTUNGAN EKSPOR UMKM
  // --------------------------------------------------------------------------
  const calcContractVal = document.getElementById('calcContractVal');
  const calcProdCost = document.getElementById('calcProdCost');
  const calcFreightCost = document.getElementById('calcFreightCost');
  const calcEscrowFee = document.getElementById('calcEscrowFee');
  const calcNetProfitUSD = document.getElementById('calcNetProfitUSD');
  const calcNetProfitIDR = document.getElementById('calcNetProfitIDR');
  const calcMarginPct = document.getElementById('calcMarginPct');
  const calcDpAmount = document.getElementById('calcDpAmount');

  // Asumsi Kurs Acuan USD ke IDR
  const USD_TO_IDR = 16000;

  function recalculateMargin() {
    const contract = parseFloat(calcContractVal?.value) || 0;
    const prod = parseFloat(calcProdCost?.value) || 0;
    const freight = parseFloat(calcFreightCost?.value) || 0;

    // Biaya Administrasi Escrow Vault NusaBridge = 1.2%
    const escrow = contract * 0.012;
    const totalCost = prod + freight + escrow;
    const netProfit = Math.max(0, contract - totalCost);
    const marginPct = contract > 0 ? ((netProfit / contract) * 100).toFixed(1) : 0;
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

  // Hitung ulang setiap kali ada input angka yang diubah
  [calcContractVal, calcProdCost, calcFreightCost].forEach(inp => {
    if (inp) inp.addEventListener('input', recalculateMargin);
  });

  // Tombol Konsultasi Hasil Simulasi ke WhatsApp
  const btnKonsul = document.getElementById('btnKonsultasiKalkulator');
  if (btnKonsul) {
    btnKonsul.addEventListener('click', () => {
      const contract = calcContractVal ? calcContractVal.value : '15000';
      const profit = calcNetProfitUSD ? calcNetProfitUSD.innerText : 'USD 5,120';
      const waMsg = `Halo Tim NusaBridge, saya telah menghitung estimasi transaksi ekspor senilai USD ${contract} dengan estimasi net profit ${profit}. Mohon asistensi untuk eksekusi kontrak ini. Terima kasih!`;
      const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(waMsg)}`;
      window.open(waUrl, '_blank');
    });
  }

  // --------------------------------------------------------------------------
  // 4. ACCORDION FAQ (PERTANYAAN UMUM)
  // --------------------------------------------------------------------------
  document.querySelectorAll('.faq-question').forEach(qBtn => {
    qBtn.addEventListener('click', () => {
      const item = qBtn.parentElement;
      const isActive = item.classList.contains('active');

      // Tutup accordion lain agar rapi
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
