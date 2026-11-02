import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import { PRODUCTS_DATA } from '../data/products.js';
import {
  AVAILABILITY_META,
  SERVICE_TYPES,
  TRANSPORT_CATEGORIES,
  buildTransportPlans,
  formatHours,
  formatUSD,
  getOptionsByCategory,
  trl,
} from '../data/logistics.js';
import { quoteTransport } from '../utils/logisticsApi.js';

const serviceTypeIcon = {
  local: '🏙️',
  interisland: '🏝️',
  export: '🌏',
  import: '📥',
};

function AvailabilityBadge({ availability, lang }) {
  const meta = AVAILABILITY_META[availability] || AVAILABILITY_META.limited;
  return (
    <span className="log-badge" style={{ background: meta.bg, color: meta.color }}>
      {trl(meta.label, lang)}
    </span>
  );
}

export default function TransportPage() {
  const { lang, session } = useApp();
  const isEn = lang === 'en';
  const [searchParams] = useSearchParams();
  const productParam = searchParams.get('product');
  const matchedProduct = useMemo(
    () => PRODUCTS_DATA.find((product) => product.id === productParam) || null,
    [productParam]
  );

  // Berat/volume awal mengikuti produk yang dipilih dari katalog.
  const defaultWeight = useMemo(() => {
    if (!matchedProduct) return 2000;
    return (matchedProduct.unit || '').toLowerCase() === 'kg'
      ? Math.min(Number(matchedProduct.moq) || 1000, 5000)
      : 150;
  }, [matchedProduct]);

  const [serviceType, setServiceType] = useState('export');
  const [origin, setOrigin] = useState(
    matchedProduct?.origin || session?.company || (isEn ? 'Bandung, West Java' : 'Bandung, Jawa Barat')
  );
  const [destination, setDestination] = useState(isEn ? 'Hamburg, Germany' : 'Hamburg, Jerman');
  const [weightKg, setWeightKg] = useState(String(defaultWeight));
  const [volumeM3, setVolumeM3] = useState(String(Math.max(2, Math.round(defaultWeight / 180))));
  const [selectedIds, setSelectedIds] = useState(['truck-logistics', 'container-ship']);
  const [plans, setPlans] = useState(() =>
    buildTransportPlans({
      serviceType: 'export',
      origin: matchedProduct?.origin || 'Bandung, Jawa Barat',
      destination: isEn ? 'Hamburg, Germany' : 'Hamburg, Jerman',
      weightKg: defaultWeight,
      volumeM3: Math.max(2, Math.round(defaultWeight / 180)),
      selectedIds: ['truck-logistics', 'container-ship'],
      lang,
    })
  );
  const [loading, setLoading] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);

  const groupedOptions = useMemo(() => {
    const groups = {};
    TRANSPORT_CATEGORIES.forEach((cat) => {
      groups[cat.id] = getOptionsByCategory(cat.id);
    });
    return groups;
  }, []);

  function toggleOption(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleQuote(e) {
    e.preventDefault();
    setLoading(true);
    const input = {
      serviceType,
      origin,
      destination,
      weightKg: Number(weightKg) || 0,
      volumeM3: Number(volumeM3) || 0,
      selectedIds,
      lang,
    };
    const result = await quoteTransport(input);
    setPlans(Array.isArray(result) ? result : buildTransportPlans(input));
    setLoading(false);
  }

  return (
    <>
      <section className="page-hero-banner">
        <div className="site-container">
          <div className="pill-badge pill-blue">{isEn ? 'MULTIMODAL TRANSPORT' : 'TRANSPORTASI MULTIMODA'}</div>
          <h1 className="page-hero-title">
            {isEn ? (
              <>
                Transport Selection <span className="text-accent">Panel</span>
              </>
            ) : (
              <>
                Panel Pemilihan <span className="text-accent">Transportasi</span>
              </>
            )}
          </h1>
          <p className="page-hero-subtitle">
            {isEn
              ? 'Combine land, sea, and air transport in one shipment. Get cost, ETA, route recommendations, and availability in one place.'
              : 'Gabungkan transportasi darat, laut, dan udara dalam satu pengiriman. Lihat estimasi biaya, ETA, rekomendasi rute, dan status ketersediaan secara terintegrasi.'}
          </p>
        </div>
      </section>

      <section className="section-product-controls">
        <div className="site-container">
          <div className="controls-wrapper-card transport-selector-card">
            {matchedProduct && (
              <div className="transport-product-context">
                {matchedProduct.image && <img src={matchedProduct.image} alt={matchedProduct.name} />}
                <div>
                  <span>{isEn ? 'Shipping for product' : 'Pengiriman untuk produk'}</span>
                  <strong>{matchedProduct.name}</strong>
                  <small>
                    {matchedProduct.origin} • {matchedProduct.hsCode} • {matchedProduct.shipping}
                  </small>
                </div>
                <Link to={`/produk?search=${encodeURIComponent(matchedProduct.name)}`} className="btn btn-outline btn-sm">
                  {isEn ? 'Back to catalog' : 'Kembali ke katalog'}
                </Link>
              </div>
            )}
            <div className="transport-service-grid">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`transport-service-btn ${serviceType === type.id ? 'active' : ''}`}
                  onClick={() => setServiceType(type.id)}
                >
                  <span className="tsb-icon">{serviceTypeIcon[type.id] || '🚚'}</span>
                  <div className="tsb-text">
                    <strong>{trl(type.label, lang)}</strong>
                    <small>{trl(type.desc, lang)}</small>
                  </div>
                </button>
              ))}
            </div>

            <form className="transport-form-grid" onSubmit={handleQuote}>
              <div className="form-group">
                <label>{isEn ? 'Pickup Location' : 'Lokasi Penjemputan'}</label>
                <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder={isEn ? 'Seller warehouse address' : 'Alamat gudang penjual'} />
              </div>
              <div className="form-group">
                <label>{isEn ? 'Delivery Location' : 'Lokasi Tujuan'}</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={isEn ? 'Buyer address / port / airport' : 'Alamat pembeli / pelabuhan / bandara'} />
              </div>
              <div className="form-group">
                <label>{isEn ? 'Weight (Kg)' : 'Berat (Kg)'}</label>
                <input type="number" min="1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{isEn ? 'Volume (m³)' : 'Volume (m³)'}</label>
                <input type="number" min="0.1" step="0.1" value={volumeM3} onChange={(e) => setVolumeM3(e.target.value)} />
              </div>
              <button className="btn btn-primary transport-quote-btn" type="submit" disabled={loading}>
                {loading ? (isEn ? 'Calculating...' : 'Menghitung...') : (isEn ? 'Get Route Recommendations' : 'Dapatkan Rekomendasi Rute')}
              </button>
            </form>

            <div className="transport-options-section">
              <div className="transport-options-header">
                <div>
                  <h3>{isEn ? 'Select Transport Modes (Multi-select)' : 'Pilih Moda Transportasi (Bisa Lebih dari Satu)'}</h3>
                  <p>{isEn ? 'Mix and match land, sea, and air to fit cost, time, and availability.' : 'Kombinasikan darat, laut, dan udara sesuai kebutuhan biaya, waktu, dan ketersediaan.'}</p>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAllOptions((v) => !v)}>
                  {showAllOptions ? (isEn ? 'Hide details' : 'Sembunyikan detail') : (isEn ? 'Show details' : 'Tampilkan detail')}
                </button>
              </div>

              {TRANSPORT_CATEGORIES.map((cat) => (
                <div key={cat.id} className="transport-category-block">
                  <div className="transport-category-title">
                    <span style={{ color: cat.color }}>{cat.icon}</span>
                    <strong>{trl(cat.label, lang)}</strong>
                    <small>{trl(cat.desc, lang)}</small>
                  </div>
                  <div className="transport-option-grid">
                    {groupedOptions[cat.id].map((option) => {
                      const active = selectedIds.includes(option.id);
                      const meta = AVAILABILITY_META[option.availability];
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`transport-option-card ${active ? 'active' : ''}`}
                          onClick={() => toggleOption(option.id)}
                        >
                          <div className="toc-header">
                            <span className="toc-icon">{option.icon}</span>
                            <div className="toc-info">
                              <strong>{trl(option.name, lang)}</strong>
                              <small>{trl(option.coverage, lang)}</small>
                            </div>
                            <span className={`toc-check ${active ? 'on' : ''}`}>{active ? '✓' : '+'}</span>
                          </div>
                          {showAllOptions && (
                            <div className="toc-details">
                              <p>{trl(option.desc, lang)}</p>
                              <div className="toc-meta">
                                <span>{isEn ? 'Capacity:' : 'Kapasitas:'} {option.capacityKg.toLocaleString()} kg / {option.capacityM3} m³</span>
                                <span>{isEn ? 'Speed:' : 'Kecepatan:'} ~{option.speedKph} km/h</span>
                                <AvailabilityBadge availability={option.availability} lang={lang} />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-product-list">
        <div className="site-container">
          <div className="catalog-result-header">
            <div>
              <h2 className="section-title" style={{ fontSize: '28px', marginBottom: '6px' }}>{isEn ? 'Route Recommendations' : 'Rekomendasi Rute'}</h2>
              <p className="result-count-text" style={{ marginBottom: 0 }}>
                {isEn
                  ? 'Plans are calculated from your selected modes with simulated pricing, ETA, and availability.'
                  : 'Rute dihitung dari moda yang dipilih dengan estimasi biaya, waktu tiba, dan ketersediaan simulasi.'}
              </p>
            </div>
            <Link to="/pelacakan" className="btn btn-outline btn-sm">{isEn ? 'Track a Shipment' : 'Lacak Pengiriman'}</Link>
          </div>

          {plans.length === 0 ? (
            <div className="empty-catalog-state" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🗺️</div>
              <h4 style={{ marginBottom: '8px' }}>{isEn ? 'No routes available' : 'Belum ada rute'}</h4>
              <p style={{ color: 'var(--text-muted)' }}>{isEn ? 'Select at least one transport mode and calculate again.' : 'Pilih minimal satu moda transportasi lalu hitung ulang.'}</p>
            </div>
          ) : (
            <div className="transport-plans-grid">
              {plans.map((plan) => {
                const worst = AVAILABILITY_META[plan.availability];
                return (
                  <article key={plan.id} className={`transport-plan-card ${plan.recommended ? 'recommended' : ''}`}>
                    {plan.recommended && <div className="tpc-ribbon">{isEn ? 'RECOMMENDED' : 'REKOMENDASI'}</div>}
                    <header className="tpc-header">
                      <div>
                        <h3>{plan.title}</h3>
                        <p>{plan.subtitle}</p>
                      </div>
                      <div className="tpc-kpis">
                        <div>
                          <span>{isEn ? 'Total Cost' : 'Total Biaya'}</span>
                          <strong>{formatUSD(plan.totalCostUSD)}</strong>
                        </div>
                        <div>
                          <span>{isEn ? 'Est. Time' : 'Estimasi Waktu'}</span>
                          <strong>{formatHours(plan.totalHours, lang)}</strong>
                        </div>
                        <div>
                          <span>ETA</span>
                          <strong>{plan.etaLabel}</strong>
                        </div>
                      </div>
                    </header>

                    <div className="tpc-legs">
                      {plan.legs.map((leg, index) => (
                        <div key={`${plan.id}-${index}`} className="tpc-leg">
                          <div className="tpc-leg-step">
                            <span className="tpc-leg-dot" style={{ background: leg.color }}>{leg.icon}</span>
                            {index < plan.legs.length - 1 && <span className="tpc-leg-line" />}
                          </div>
                          <div className="tpc-leg-content">
                            <div className="tpc-leg-top">
                              <strong>{leg.name}</strong>
                              <span className="tpc-leg-price">{formatUSD(leg.costUSD)}</span>
                            </div>
                            <p>{leg.from} → {leg.to} • {leg.distanceKm} km • {formatHours(leg.hours, lang)}</p>
                            <AvailabilityBadge availability={leg.availability} lang={lang} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <footer className="tpc-footer">
                      <div>
                        <span className="log-badge" style={{ background: worst.bg, color: worst.color }}>
                          {isEn ? 'Overall availability:' : 'Ketersediaan keseluruhan:'} {trl(worst.label, lang)}
                        </span>
                        {plan.badge && <span className="tpc-info-badge">{plan.badge}</span>}
                      </div>
                      <Link to="/pelacakan" className="btn btn-primary btn-sm">
                        {isEn ? 'Simulate Tracking' : 'Simulasikan Pelacakan'}
                      </Link>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
