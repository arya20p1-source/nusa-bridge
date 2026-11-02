import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import {
  AVAILABILITY_META,
  SERVICE_TYPES,
  buildTransportPlans,
  formatEtaDate,
  formatHours,
  formatUSD,
  trl,
} from '../data/logistics.js';

/**
 * Panel estimasi pengiriman yang ditampilkan pada detail produk.
 * Pilihan dihitung dari lokasi penjual (origin produk), tujuan pembeli,
 * berat/volume, jenis layanan, dan moda yang dipilih pengguna.
 * Seluruh harga/ETA adalah simulasi.
 */
export default function TransportPanel({ product }) {
  const { lang, showToast } = useApp();
  const isEn = lang === 'en';
  const productUnit = (product?.unit || '').toLowerCase();
  const defaultWeight = productUnit === 'kg' ? Math.min(Number(product?.moq) || 1000, 5000) : 150;
  const defaultVolume = productUnit === 'kg' ? Math.max(2, Math.round(defaultWeight / 180)) : 3;

  const [serviceType, setServiceType] = useState('export');
  const [destination, setDestination] = useState(isEn ? 'Buyer destination' : 'Lokasi pembeli');
  const [weightKg, setWeightKg] = useState(String(defaultWeight));
  const [volumeM3, setVolumeM3] = useState(String(defaultVolume));
  const [selectedIds, setSelectedIds] = useState(['truck-logistics', 'container-ship']);

  const modeChoices = [
    { id: 'truck-logistics', icon: '🚚', label: isEn ? 'Truck' : 'Truk' },
    { id: 'box-van', icon: '🚐', label: isEn ? 'Box van' : 'Mobil Box' },
    { id: 'freight-train', icon: '🚆', label: isEn ? 'Train' : 'Kereta' },
    { id: 'container-ship', icon: '🚢', label: isEn ? 'Container ship' : 'Kapal Kontainer' },
    { id: 'interisland-ship', icon: '⛴️', label: isEn ? 'Inter-island' : 'Antarpulau' },
    { id: 'international-ship', icon: '🌊', label: isEn ? 'Intl. ship' : 'Kapal Internasional' },
    { id: 'cargo-plane', icon: '✈️', label: isEn ? 'Cargo plane' : 'Pesawat Kargo' },
    { id: 'air-urgent', icon: '🚀', label: isEn ? 'Urgent air' : 'Udara Urgent' },
  ];

  const plans = useMemo(
    () =>
      buildTransportPlans({
        serviceType,
        origin: product?.origin || '',
        destination,
        weightKg: Number(weightKg) || 1,
        volumeM3: Number(volumeM3) || 0.1,
        selectedIds,
        lang,
      }).slice(0, 3),
    [serviceType, product?.origin, destination, weightKg, volumeM3, selectedIds, lang]
  );

  function toggleMode(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function simulate() {
    showToast(
      isEn
        ? '📦 Shipping quote simulated. Open the transport panel for the full route.'
        : '📦 Estimasi pengiriman disimulasikan. Buka panel transportasi untuk rute lengkap.'
    );
  }

  return (
    <div className="product-transport-panel">
      <div className="ptp-header">
        <div>
          <span className="pill-badge pill-blue">{isEn ? 'SHIPPING OPTIONS' : 'PILIHAN PENGIRIMAN'}</span>
          <h4>{isEn ? 'Choose a delivery route for this product' : 'Pilih pengiriman untuk produk ini'}</h4>
          <p>
            {isEn
              ? 'Based on seller location, buyer destination, weight, volume, product type, and mode availability.'
              : 'Berdasarkan lokasi penjual, tujuan pembeli, berat, volume, jenis produk, dan ketersediaan moda.'}
          </p>
        </div>
        <Link to={`/transportasi?product=${encodeURIComponent(product?.id || '')}`} className="btn btn-outline btn-sm">
          {isEn ? 'Full transport panel →' : 'Panel transportasi lengkap →'}
        </Link>
      </div>

      <div className="ptp-form">
        <label>
          <span>{isEn ? 'Service type' : 'Jenis layanan'}</span>
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
            {SERVICE_TYPES.map((type) => (
              <option key={type.id} value={type.id}>{trl(type.label, lang)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{isEn ? 'Destination' : 'Tujuan'}</span>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} />
        </label>
        <label>
          <span>{isEn ? 'Weight (Kg)' : 'Berat (Kg)'}</span>
          <input type="number" min="1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </label>
        <label>
          <span>{isEn ? 'Volume (m³)' : 'Volume (m³)'}</span>
          <input type="number" min="0.1" step="0.1" value={volumeM3} onChange={(e) => setVolumeM3(e.target.value)} />
        </label>
      </div>

      <div className="ptp-modes">
        {modeChoices.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`ptp-mode-chip ${selectedIds.includes(mode.id) ? 'active' : ''}`}
            onClick={() => toggleMode(mode.id)}
          >
            <span>{mode.icon}</span> {mode.label} {selectedIds.includes(mode.id) ? '✓' : '+'}
          </button>
        ))}
      </div>

      <div className="ptp-plans">
        {plans.map((plan) => {
          const meta = AVAILABILITY_META[plan.availability] || AVAILABILITY_META.limited;
          return (
            <div key={plan.id} className={`ptp-plan ${plan.recommended ? 'recommended' : ''}`}>
              <div className="ptp-plan-top">
                <strong>{plan.title}</strong>
                {plan.recommended && <span className="ptp-recommended">{isEn ? 'RECOMMENDED' : 'REKOMENDASI'}</span>}
              </div>
              <div className="ptp-plan-legs">
                {plan.legs.map((leg, index) => (
                  <span key={`${plan.id}-${index}`}>
                    {leg.icon} {leg.name}
                    {index < plan.legs.length - 1 ? ' →' : ''}
                  </span>
                ))}
              </div>
              <div className="ptp-plan-meta">
                <span><strong>{formatUSD(plan.totalCostUSD)}</strong> • {formatHours(plan.totalHours, lang)}</span>
                <span className="log-badge" style={{ background: meta.bg, color: meta.color }}>{trl(meta.label, lang)}</span>
              </div>
              <div className="ptp-plan-eta">{isEn ? 'ETA' : 'ETA'}: {formatEtaDate(plan.totalHours, lang)}</div>
            </div>
          );
        })}
      </div>

      <div className="ptp-footer">
        <span>{isEn ? 'Simulated estimate. No real carrier status is shown.' : 'Estimasi simulasi. Tidak menampilkan status ekspedisi nyata.'}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={simulate}>
          {isEn ? 'Use this estimate' : 'Gunakan estimasi ini'}
        </button>
      </div>
    </div>
  );
}
