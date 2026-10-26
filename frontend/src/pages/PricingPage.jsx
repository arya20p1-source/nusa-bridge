import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import T from '../components/T.jsx';

/**
 * ==========================================================================
 * NUSABRIDGE - Halaman Paket & Harga (port harga.html + harga.js)
 * Skema subsidi UMKM, switcher durasi 1/5/12 bulan, voucher SUBSIDI-UMKM-15,
 * kalkulator margin ekspor, garansi, dan FAQ accordion.
 * ==========================================================================
 */

const USD_TO_IDR = 16000;
const VOUCHER_DISCOUNT_PCT = 15;
const VOUCHER_CODE = 'SUBSIDI-UMKM-15';

const PLANS_DATA = {
  '1': {
    months: 1,
    label: 'Paket UMKM Eksportir (1 Bulan)',
    baseTotal: 50000,
    monthlyRate: 50000,
    savingsHtml: 'Ditagih bulanan Rp 50.000 &bull; Fleksibel tanpa komitmen jangka panjang',
    monthlyDisplay: '50.000',
    periodDisplay: '/ bulan',
  },
  '5': {
    months: 5,
    label: 'Paket UMKM Eksportir (5 Bulan)',
    baseTotal: 200000,
    monthlyRate: 40000,
    savingsHtml: 'Ditagih Rp 200.000 / 5 bulan &bull; Hemat Rp 50.000 dibanding bulanan',
    monthlyDisplay: '40.000',
    periodDisplay: '/ bulan',
  },
  '12': {
    months: 12,
    label: 'Paket UMKM Eksportir (1 Tahun)',
    baseTotal: 820000,
    monthlyRate: 68333,
    savingsHtml: 'Ditagih Rp 820.000 / tahun &bull; Solusi ekspor lengkap 12 bulan penuh',
    monthlyDisplay: '68.300',
    periodDisplay: '/ bulan',
  },
};

const DURATIONS = [
  { dur: '1', nameKey: 'dur_1m', badge: null, badgeKey: null, rate: 'Rp 50.000 / bln' },
  { dur: '5', nameKey: 'dur_5m', badge: 'save', badgeKey: 'save_20', rate: 'Rp 40.000 / bln' },
  { dur: '12', nameKey: 'dur_1y', badge: 'best', badgeKey: 'save_best', rate: 'Rp 68.300 / bln' },
];

function formatIDR(num) {
  return Number(num).toLocaleString('id-ID');
}

// Modal pendaftaran paket (pengganti authModal lokal halaman harga)
function PlanSignupModal({ plan, discount, onClose }) {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onClose();
    showToast('✓ Pendaftaran diterima! Tim NusaBridge akan menghubungi Anda untuk aktivasi paket.');
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Esc') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay active show"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card">
        <button className="modal-close-btn" type="button" aria-label="Tutup" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <img src="/assets/logo-transparent.webp" alt="NusaBridge" className="modal-logo" />
          <h3 className="modal-title">Pilih Paket Layanan</h3>
          <p className="modal-subtitle">Daftar akun untuk memulai aktivasi paket ekspor pilihan Anda.</p>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Paket Dipilih</label>
            <input type="text" readOnly value={plan} className="input-readonly" />
          </div>
          <div className="form-group">
            <label>Status Diskon Perusahaan</label>
            <input
              type="text"
              readOnly
              value={discount}
              className="input-readonly"
              style={{ color: '#059669', fontWeight: 700, background: '#ecfdf5' }}
            />
          </div>
          <div className="form-group">
            <label>Nama Usaha / Koperasi</label>
            <input type="text" placeholder="contoh: UMKM Kopi Mandiri" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email Kontak</label>
            <input type="email" placeholder="owner@bisnis.id" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Konfirmasi &amp; Lanjutkan</button>
        </form>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { showToast, openAuth, voucherClaimed, setVoucherClaimed } = useApp();
  const [activeDuration, setActiveDuration] = useState('12');
  const [openFaq, setOpenFaq] = useState(null);
  const [signupModal, setSignupModal] = useState({ open: false, plan: '', discount: '' });

  // Kalkulator margin
  const [calcContract, setCalcContract] = useState(15000);
  const [calcProd, setCalcProd] = useState(8500);
  const [calcFreight, setCalcFreight] = useState(1200);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hasDiscount = voucherClaimed && (activeDuration === '5' || activeDuration === '12');
  const plan = PLANS_DATA[activeDuration] || PLANS_DATA['12'];

  const pricing = useMemo(() => {
    let finalTotal = plan.baseTotal;
    let finalMonthly = plan.monthlyRate;

    if (hasDiscount) {
      const discAmt = Math.round(plan.baseTotal * (VOUCHER_DISCOUNT_PCT / 100));
      finalTotal = plan.baseTotal - discAmt;
      finalMonthly = Math.round(finalTotal / plan.months);
      return {
        discAmt,
        finalTotal,
        finalMonthly,
        discountText: `Voucher Subsidi 15% (${VOUCHER_CODE}) - Hemat Rp ${formatIDR(discAmt)}`,
        billingHtml: `Ditagih <strong>Rp ${formatIDR(finalTotal)}</strong> (Potongan Subsidi Kupon Rp ${formatIDR(discAmt)}) &bull; Hemat Maksimal!`,
      };
    }
    return {
      discAmt: 0,
      finalTotal,
      finalMonthly,
      discountText: 'Tanpa Diskon Tambahan',
      billingHtml: plan.savingsHtml,
    };
  }, [plan, hasDiscount]);

  const calcs = useMemo(() => {
    const contract = parseFloat(calcContract) || 0;
    const prod = parseFloat(calcProd) || 0;
    const freight = parseFloat(calcFreight) || 0;
    const escrow = contract * 0.012;
    const totalCost = prod + freight + escrow;
    const netProfit = Math.max(0, contract - totalCost);
    const marginPct = contract > 0 ? ((netProfit / contract) * 100).toFixed(1) : '0';
    const dp = contract * 0.3;
    return {
      escrowText: `USD ${escrow.toLocaleString('en-US', { maximumFractionDigits: 1 })}`,
      netProfitText: `USD ${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      idrText: `≈ Rp ${(netProfit * USD_TO_IDR).toLocaleString('id-ID')} ,-`,
      marginPctText: `${marginPct}%`,
      dpText: `USD ${dp.toLocaleString('en-US')} (Rp ${(dp * USD_TO_IDR / 1000000).toFixed(1)} Jt)`,
    };
  }, [calcContract, calcProd, calcFreight]);

  function toggleVoucher() {
    const next = !voucherClaimed;
    setVoucherClaimed(next);
    showToast(
      next
        ? '✅ Voucher Subsidi 15% Berhasil Diterapkan ke Paket!'
        : '❌ Voucher dibatalkan. Paket kembali ke harga normal.'
    );
    document.querySelector('.section-pricing-cards')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function selectPlan(planName, basePrice) {
    const summary = basePrice === 0
      ? `${planName} - Gratis Evaluasi (Termasuk PPN 11%)`
      : `${planName} - Rp ${formatIDR(basePrice)} (Termasuk PPN 11%)`;

    // Tombol paket Professional (1 Tahun): jika belum login, arahkan ke auth global;
    // tampilkan modal pendaftaran paket untuk semua paket.
    setSignupModal({ open: true, plan: summary, discount: pricing.discountText });
  }

  function selectProfessionalPlan() {
    selectPlan(plan.label, pricing.finalTotal);
  }

  function konsultasiWA() {
    const discInfo = voucherClaimed ? ` (Voucher Subsidi Aktif: ${VOUCHER_CODE} 15%)` : '';
    const waMsg = `Halo Tim NusaBridge, saya pelaku UMKM telah menghitung estimasi transaksi ekspor senilai USD ${calcContract} dengan estimasi net profit ${calcs.netProfitText}${discInfo}. Mohon asistensi untuk eksekusi kontrak ini. Terima kasih!`;
    window.open(`https://wa.me/6285735800491?text=${encodeURIComponent(waMsg)}`, '_blank');
  }

  const faqItems = [
    { q: 'faq_q1', a: 'faq_a1' },
    { q: 'faq_q2', a: 'faq_a2' },
    { q: 'faq_q3', a: 'faq_a3' },
    { q: 'faq_q4', a: 'faq_a4' },
  ];

  return (
    <>
      {/* ==================== BANNER HARGA ==================== */}
      <section className="page-hero-banner harga-hero">
        <div className="site-container">
          <div className="pill-badge pill-blue"><T k="harga_hero_pill" /></div>
          <h1 className="page-hero-title"><T k="harga_hero_title" tag="span" /></h1>
          <p className="page-hero-subtitle"><T k="harga_hero_sub" /></p>

          {/* Widget Voucher Subsidi */}
          <div className="b2b-voucher-section">
            <div className="b2b-voucher-card">
              <div className="b2b-voucher-info">
                <div className="b2b-voucher-badge-wrap">
                  <span className="b2b-voucher-badge"><T k="voucher_badge" /></span>
                  <span className="b2b-voucher-status"><T k="voucher_status" /></span>
                </div>
                <h3 className="b2b-voucher-title"><T k="voucher_title" /></h3>
                <p className="b2b-voucher-desc"><T k="voucher_desc" /></p>
              </div>

              <div className="b2b-coupon-box">
                <div className="b2b-coupon-inner">
                  <span className="b2b-coupon-label"><T k="voucher_val_label" /></span>
                  <div className="b2b-coupon-value">15%</div>
                  <div className="b2b-coupon-code">KODE: <strong>{VOUCHER_CODE}</strong></div>
                </div>
                <div className="b2b-buttons-wrap">
                  <button
                    className="btn btn-primary b2b-btn-apply"
                    type="button"
                    onClick={toggleVoucher}
                    style={voucherClaimed ? { background: '#059669' } : undefined}
                  >
                    {voucherClaimed
                      ? <span>✅ Kupon 15% Terpasang (Klik Batal)</span>
                      : <span>🎁 Terapkan Voucher 15%</span>}
                  </button>
                </div>
              </div>
            </div>

            {voucherClaimed && (
              <div className="b2b-voucher-alert" style={{ display: 'flex' }}>
                <span className="bva-icon">🎉</span>
                <div className="bva-content">
                  <strong>🎉 Voucher Subsidi 15% Berhasil Diaktifkan!</strong>
                  <span>Kupon {VOUCHER_CODE} telah memotong harga Paket 5 Bulan menjadi Rp 170.000 dan Paket 1 Tahun menjadi Rp 697.000.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 3 PRICING CARDS ==================== */}
      <section className="section-pricing-cards">
        <div className="site-container">
          <div className="pricing-grid">

            {/* Card 1: Starter */}
            <div className="price-plan-card">
              <div className="plan-header">
                <span className="plan-badge"><T k="plan_1_badge" /></span>
                <h3 className="plan-name"><T k="plan_1_name" /></h3>
                <p className="plan-desc"><T k="plan_1_desc" /></p>

                <div className="plan-price-box">
                  <span className="currency">Rp</span>
                  <span className="price-amount">0</span>
                  <span className="period"><T k="plan_1_period" /></span>
                </div>

                <div className="vat-included-tag"><T k="plan_1_vat" /></div>

                <div className="plan-trial-notice">
                  <span className="ptn-icon">⏳</span>
                  <span className="ptn-text"><T k="plan_1_notice" /></span>
                </div>
              </div>

              <div className="plan-divider" />

              <ul className="plan-features">
                <li><span className="pf-check">✓</span> <strong><T k="plan_1_f1" /></strong></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_1_f2" /></strong></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_1_f3" /></strong></li>
                <li><span className="pf-check">✓</span> <span><T k="plan_1_f4" /></span></li>
                <li><span className="pf-check">✓</span> <span><T k="plan_1_f5" /></span></li>
                <li className="pf-dimmed"><span className="pf-cross">✕</span> <span><T k="plan_1_f6" /></span></li>
                <li className="pf-dimmed"><span className="pf-cross">✕</span> <span><T k="plan_1_f7" /></span></li>
              </ul>

              <div className="plan-action">
                <button
                  className="btn btn-outline btn-block btn-select-plan"
                  type="button"
                  onClick={() => selectPlan('Paket Starter / Sandbox', 0)}
                >
                  <T k="plan_1_btn" />
                </button>
              </div>
            </div>

            {/* Card 2: Professional */}
            <div className="price-plan-card featured">
              <div className="popular-ribbon"><T k="popular_ribbon" /></div>
              <div className="plan-header">
                <span className="plan-badge primary"><T k="plan_2_badge" /></span>
                <h3 className="plan-name"><T k="plan_2_name" /></h3>
                <p className="plan-desc"><T k="plan_2_desc" /></p>

                <div className="billing-duration-selector">
                  <span className="bds-label"><T k="duration_label" /></span>
                  <div className="bds-options">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.dur}
                        type="button"
                        className={`bds-btn${activeDuration === d.dur ? ' active' : ''}`}
                        onClick={() => setActiveDuration(d.dur)}
                      >
                        <div className="bds-btn-left">
                          <span className="bds-radio" />
                          <span className="bds-name"><T k={d.nameKey} /></span>
                          {d.badge && <span className={`bds-badge ${d.badge}`}><T k={d.badgeKey} /></span>}
                        </div>
                        <span className="bds-rate">{d.rate}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {hasDiscount && (
                  <div className="price-origin-box" style={{ display: 'flex' }}>
                    <span className="pob-label"><T k="original_price_label" /></span>
                    <s className="pob-strike">Rp {formatIDR(plan.baseTotal)}</s>
                    <span className="pob-badge">Subsidi 15% (-Rp {formatIDR(pricing.discAmt)})</span>
                  </div>
                )}

                <div className="plan-price-box" key={`${activeDuration}-${hasDiscount ? 'd' : 'n'}`}>
                  <span className="currency">Rp</span>
                  <span className="price-amount">{formatIDR(pricing.finalMonthly)}</span>
                  <span className="period">{plan.periodDisplay}</span>
                </div>

                <div
                  className="plan-billing-summary"
                  style={{ marginTop: '6px', fontSize: '12px', fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}
                  dangerouslySetInnerHTML={{ __html: pricing.billingHtml }}
                />

                <div className="vat-included-tag"><T k="plan_2_vat" /></div>
              </div>

              <div className="plan-divider" />

              <ul className="plan-features">
                <li><span className="pf-check">✓</span> <strong><T k="plan_2_f1" /></strong></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_2_f2" /> (FOB, CFR, CIF, DDP)</strong></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_2_f3" /> (Invoice &amp; Sales Contract)</strong></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_2_f4" /></strong></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_2_f5" /></strong></li>
                <li><span className="pf-check">✓</span> <span><T k="plan_2_f6" /></span></li>
                <li><span className="pf-check">✓</span> <span><T k="plan_2_f7" /></span></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_2_f8" /></strong></li>
              </ul>

              <div className="plan-action">
                <button className="btn btn-primary btn-block btn-select-plan" type="button" onClick={selectProfessionalPlan}>
                  Pilih {plan.label} - Rp {formatIDR(pricing.finalTotal)}
                </button>
              </div>
            </div>

            {/* Card 3: Enterprise */}
            <div className="price-plan-card enterprise-card">
              <div className="plan-header">
                <span className="plan-badge badge-wa"><T k="plan_3_badge" /></span>
                <h3 className="plan-name"><T k="plan_3_name" /></h3>
                <p className="plan-desc"><T k="plan_3_desc" /></p>

                <div className="plan-price-box">
                  <span className="currency"><T k="scheme_custom" /></span>
                  <span className="price-amount" style={{ fontSize: '1.85rem', color: '#059669' }}><T k="custom_val" /></span>
                  <span className="period"><T k="custom_period" /></span>
                </div>

                <div className="vat-included-tag"><T k="plan_3_vat" /></div>
              </div>

              <div className="plan-divider" />

              <ul className="plan-features">
                <li><span className="pf-check">✓</span> <strong><T k="plan_3_f1" /></strong></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_3_f2" /></strong></li>
                <li><span className="pf-check">✓</span> <strong><T k="plan_3_f3" /></strong></li>
                <li><span className="pf-check">✓</span> <span><T k="plan_3_f4" /></span></li>
                <li><span className="pf-check">✓</span> <span><T k="plan_3_f5" /></span></li>
                <li><span className="pf-check">✓</span> <span><T k="plan_3_f6" /></span></li>
              </ul>

              <div className="plan-action">
                <a
                  href="https://wa.me/6285735800491?text=Halo%20Admin%20NusaBridge,%20kami%20tertarik%20dengan%20Paket%20Enterprise%20(Kustom)%20untuk%20Koperasi/Asosiasi%20Ekspor.%20Mohon%20informasi%20penawaran%20dan%20kustomisasi%20berkas%20perdagangan."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-block"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.101-.477-.15-.678.15-.201.3-.778.978-.954 1.179-.176.2-.351.226-.652.075s-1.272-.469-2.424-1.496c-.896-.799-1.501-1.787-1.677-2.088-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.101-.2.05-.376-.025-.527-.075-.15-.678-1.631-.929-2.233-.244-.587-.492-.507-.678-.517-.176-.008-.376-.01-.577-.01s-.527.075-.803.376c-.276.301-1.054 1.03-1.054 2.511s1.079 2.912 1.23 3.113c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.377.197 1.895.12.578-.087 1.78-.727 2.031-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.04 2C6.516 2 2.023 6.49 2.023 12.012c0 1.942.556 3.753 1.517 5.29L2 22l4.838-1.506a10.01 10.01 0 0 0 5.202 1.458h.005c5.522 0 10.015-4.49 10.015-10.012A9.957 9.957 0 0 0 12.04 2z" />
                  </svg>
                  <span><T k="plan_3_btn" /></span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== GARANSI & TRANSPARANSI ==================== */}
      <section className="section-guarantee-transparency">
        <div className="site-container">
          <div className="guarantee-grid">
            <div className="guarantee-box">
              <div className="gb-icon">💰</div>
              <div className="gb-content">
                <h4><T k="guarantee_title" /></h4>
                <p><T k="guarantee_desc" /></p>
              </div>
            </div>

            <div className="guarantee-box">
              <div className="gb-icon">🛰️</div>
              <div className="gb-content">
                <h4><T k="tax_transparency_title" /></h4>
                <p><T k="tax_transparency_desc" /></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== KALKULATOR MARGIN ==================== */}
      <section className="section-profit-calc">
        <div className="site-container">
          <div className="profit-calc-card">
            <div className="calc-header text-center">
              <div className="pill-badge pill-blue"><T k="calc_pill" /></div>
              <h2 className="section-title"><T k="calc_title" tag="span" /></h2>
              <p className="section-subtitle"><T k="calc_sub" /></p>
            </div>

            <div className="calc-body-grid">
              <div className="calc-inputs-col">
                <div className="calc-group">
                  <label><T k="calc_label_contract" /></label>
                  <div className="input-prefix-box">
                    <span className="ip-curr">USD</span>
                    <input type="number" value={calcContract} min={500} step={500} onChange={(e) => setCalcContract(e.target.value)} />
                  </div>
                </div>
                <div className="calc-group">
                  <label><T k="calc_label_prod" /></label>
                  <div className="input-prefix-box">
                    <span className="ip-curr">USD</span>
                    <input type="number" value={calcProd} min={100} step={100} onChange={(e) => setCalcProd(e.target.value)} />
                  </div>
                </div>
                <div className="calc-group">
                  <label><T k="calc_label_freight" /></label>
                  <div className="input-prefix-box">
                    <span className="ip-curr">USD</span>
                    <input type="number" value={calcFreight} min={50} step={50} onChange={(e) => setCalcFreight(e.target.value)} />
                  </div>
                </div>
                <div className="calc-group">
                  <label><T k="calc_label_escrow" /></label>
                  <input type="text" readOnly value={calcs.escrowText} className="input-readonly" />
                </div>
              </div>

              <div className="calc-results-col">
                <div className="calc-summary-box">
                  <span className="cs-label"><T k="calc_label_net" /></span>
                  <div className="cs-val-big">{calcs.netProfitText}</div>
                  <div className="cs-val-idr">{calcs.idrText}</div>

                  <div className="cs-breakdown">
                    <div className="cs-row">
                      <span><T k="calc_row_margin" /></span>
                      <strong>{calcs.marginPctText}</strong>
                    </div>
                    <div className="cs-row">
                      <span><T k="calc_row_dp" /></span>
                      <strong>{calcs.dpText}</strong>
                    </div>
                    <div className="cs-row">
                      <span><T k="calc_row_status" /></span>
                      <span className="cs-safe-tag"><T k="calc_safe_tag" /></span>
                    </div>
                  </div>

                  <button className="btn btn-primary btn-block" type="button" onClick={konsultasiWA}>
                    <T k="calc_btn_consult" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="section-faq">
        <div className="site-container">
          <div className="section-header text-center">
            <div className="pill-badge pill-blue"><T k="faq_pill" /></div>
            <h2 className="section-title"><T k="faq_main_title" tag="span" /></h2>
          </div>

          <div className="faq-accordion-list">
            {faqItems.map((item, i) => (
              <div className={`faq-item${openFaq === i ? ' active' : ''}`} key={item.q}>
                <button className="faq-question" type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span><T k={item.q} /></span>
                  <span className="faq-toggle">+</span>
                </button>
                <div className="faq-answer">
                  <p><T k={item.a} /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal pendaftaran paket */}
      {signupModal.open && (
        <PlanSignupModal
          plan={signupModal.plan}
          discount={signupModal.discount}
          onClose={() => setSignupModal({ ...signupModal, open: false })}
        />
      )}
    </>
  );
}
