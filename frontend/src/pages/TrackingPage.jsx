import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import {
  SHIPMENTS,
  SHIPMENT_STATUSES,
  getShipmentById,
  trl,
} from '../data/logistics.js';
import { findShipment, listShipments } from '../utils/logisticsApi.js';
import { localizeProductName } from '../data/productTranslations.js';

const TRACKING_EN_REPLACEMENTS = [
  [/\bPelabuhan Belawan \/ Tanjung Priok\b/g, 'Belawan Port / Tanjung Priok'],
  [/\bPelabuhan Tanjung Priok\b/g, 'Tanjung Priok Port'],
  [/\bPelabuhan Belawan\b/g, 'Belawan Port'],
  [/\bPelabuhan Makassar\b/g, 'Makassar Port'],
  [/\bPelabuhan Ternate\b/g, 'Ternate Port'],
  [/\bGudang Ternate\b/g, 'Ternate Warehouse'],
  [/\bTruk Logistik\b/g, 'Logistics Truck'],
  [/\bKapal Kontainer\b/g, 'Container Ship'],
  [/\bKapal Antarpulau\b/g, 'Inter-island Vessel'],
  [/\bPesawat Kargo\b/g, 'Cargo Aircraft'],
  [/\bMobil Box\b/g, 'Box Van'],
  [/\bPelabuhan\b/g, 'Port'],
  [/\bGudang pembeli\b/g, 'Buyer warehouse'],
  [/\bPerkiraan\b/g, 'Estimated'],
  [/\bSamudra Hindia\b/g, 'Indian Ocean'],
  [/\bBandara\b/g, 'Airport'],
  [/\bOkt\b/g, 'Oct'],
  [/\bAgu\b/g, 'Aug'],
  [/\bDes\b/g, 'Dec'],
  [/\bMei\b/g, 'May'],
];

function localizeTrackingText(value, lang = 'id') {
  if (!value) return '';
  if (lang !== 'en') return String(value);
  return TRACKING_EN_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value)
  );
}

function shipmentProductName(shipment, lang) {
  return localizeProductName({ id: shipment.productId, name: shipment.product }, lang) || shipment.product;
}

const CATEGORY_ICON = {
  land: '🚚',
  sea: '🚢',
  air: '✈️',
};

const CATEGORY_COLOR = {
  land: '#d97706',
  sea: '#0ea5e9',
  air: '#7c3aed',
};

function StatusProgress({ shipment, lang }) {
  const isEn = lang === 'en';
  const visitedSteps = new Set((shipment.history || []).map((item) => item.step));
  return (
    <div className="tracking-status-grid">
      {SHIPMENT_STATUSES.map((status) => {
        const current = status.step === shipment.currentStep;
        const done = !current && visitedSteps.has(status.step);
        const state = done ? 'done' : current ? 'current' : 'upcoming';
        return (
          <div key={status.key} className={`tracking-status-step ${state}`}>
            <div className="tss-icon">{done ? '✓' : current ? status.icon : status.step}</div>
            <div>
              <strong>{trl(status.label, lang)}</strong>
              <small>{trl(status.desc, lang)}</small>
            </div>
            {current && <span className="tss-current-tag">{isEn ? 'CURRENT' : 'SAAT INI'}</span>}
          </div>
        );
      })}
    </div>
  );
}

function ShipmentDetail({ shipment, lang }) {
  const isEn = lang === 'en';
  const L = (value) => localizeTrackingText(value, lang);
  const productName = shipmentProductName(shipment, lang);
  const routeText = `${shipment.origin} → ${shipment.destination}`;
  return (
    <div className="tracking-detail-grid">
      <div className="tracking-main-card">
        <div className="tracking-detail-header">
          <div>
            <div className="tracking-resi-row">
              <span className="pill-badge pill-blue">{shipment.resi}</span>
              <span className="simulation-chip">{isEn ? 'SIMULATED DATA' : 'DATA SIMULASI'}</span>
            </div>
            <h1 className="tracking-title">{productName}</h1>
            <p className="tracking-subtitle">{shipment.statusText ? trl(shipment.statusText, lang) : routeText}</p>
          </div>
          <div className="tracking-progress-ring" style={{ '--progress': `${shipment.progress}%` }}>
            <strong>{shipment.progress}%</strong>
            <span>{isEn ? 'progress' : 'progres'}</span>
          </div>
        </div>

        <div className="tracking-progress-bar-wrap">
          <div className="tracking-progress-labels">
            <span>{routeText}</span>
            <span>{isEn ? 'ETA' : 'ETA'}: <strong>{L(shipment.eta)}</strong></span>
          </div>
          <div className="tracking-progress-bar">
            <div style={{ width: `${shipment.progress}%` }} />
            <span className="tracking-progress-marker" style={{ left: `${shipment.progress}%` }}>
              <span />
            </span>
          </div>
        </div>

        <div className="tracking-info-grid">
          <div>
            <span>{isEn ? 'Shipment ID' : 'ID Pengiriman'}</span>
            <strong>{shipment.id}</strong>
          </div>
          <div>
            <span>{isEn ? 'Seller' : 'Penjual'}</span>
            <strong>{shipment.seller}</strong>
          </div>
          <div>
            <span>{isEn ? 'Buyer' : 'Pembeli'}</span>
            <strong>{shipment.buyer}</strong>
          </div>
          <div>
            <span>{isEn ? 'Origin' : 'Lokasi Asal'}</span>
            <strong>{shipment.origin}</strong>
          </div>
          <div>
            <span>{isEn ? 'Destination' : 'Lokasi Tujuan'}</span>
            <strong>{shipment.destination}</strong>
          </div>
          <div>
            <span>{isEn ? 'Weight / Volume' : 'Berat / Volume'}</span>
            <strong>{shipment.weightKg.toLocaleString()} kg / {shipment.volumeM3} m³</strong>
          </div>
        </div>

        <div className="tracking-section">
          <div className="tracking-section-head">
            <h3>{isEn ? 'Multimodal Route' : 'Rute Multimoda'}</h3>
            <span>{isEn ? 'Mode changes are simulated' : 'Pergantian moda adalah simulasi'}</span>
          </div>
          <div className="tracking-route">
            {shipment.segments.map((segment, index) => (
              <div key={`${segment.from}-${index}`} className="tracking-route-segment">
                <div className="tracking-route-icon" style={{ color: CATEGORY_COLOR[segment.mode], borderColor: `${CATEGORY_COLOR[segment.mode]}55` }}>
                  {segment.icon || CATEGORY_ICON[segment.mode]}
                </div>
                <div className="tracking-route-info">
                  <strong>{trl(segment.label, lang)}</strong>
                  <span>{L(segment.from)} → {L(segment.to)}</span>
                </div>
                {index < shipment.segments.length - 1 && <div className="tracking-route-connector" />}
              </div>
            ))}
          </div>
        </div>

        <div className="tracking-section">
          <div className="tracking-section-head">
            <h3>{isEn ? 'Shipment Status (8 Steps)' : 'Status Pengiriman (8 Tahap)'}</h3>
            <span>{isEn ? 'Last update' : 'Pembaruan terakhir'}: {L(shipment.lastUpdate)}</span>
          </div>
          <StatusProgress shipment={shipment} lang={lang} />
        </div>
      </div>

      <aside className="tracking-side-card">
        <div className="tracking-side-block">
          <h3>{isEn ? 'Mode Changes' : 'Pergantian Moda'}</h3>
          <div className="tracking-mode-changes">
            {(shipment.modeChanges || []).map((change, index) => (
              <div key={`${change.at}-${index}`} className="tracking-mode-change">
                <span className="tmc-dot" />
                <div>
                  <strong>{L(change.from)} → {L(change.to)}</strong>
                  <span>{L(change.at)}</span>
                  <small>{L(change.time)}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tracking-side-block">
          <h3>{isEn ? 'Travel History' : 'Riwayat Perjalanan'}</h3>
          <div className="tracking-history">
            {(shipment.history || []).slice().reverse().map((item, index) => (
              <div key={`${item.time}-${index}`} className="tracking-history-item">
                <div className="thi-dot" />
                <div>
                  <strong>{trl(item.title, lang)}</strong>
                  <span>{L(item.time)} • {L(item.location)}</span>
                  <p>{trl(item.desc, lang)}</p>
                  {item.modeChange && <span className="thi-mode-badge">{isEn ? 'MODE CHANGE' : 'PERGANTIAN MODA'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tracking-simulation-note">
          <strong>{isEn ? 'Simulation note' : 'Catatan simulasi'}</strong>
          <p>
            {isEn
              ? 'This tracking page uses demo data only. No real GPS, carrier status, or customs data is displayed. The structure is ready for expedition, GPS, and logistics provider APIs.'
              : 'Halaman pelacakan ini hanya menggunakan data demo. Tidak ada GPS, status ekspedisi, atau data kepabeanan nyata yang ditampilkan. Strukturnya sudah siap dihubungkan dengan API ekspedisi, GPS, dan penyedia logistik.'}
          </p>
        </div>
      </aside>
    </div>
  );
}

function TrackingList({ lang }) {
  const isEn = lang === 'en';
  const L = (value) => localizeTrackingText(value, lang);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SHIPMENTS;
    return SHIPMENTS.filter((shipment) =>
      [
        shipment.id,
        shipment.resi,
        shipment.product,
        shipmentProductName(shipment, 'en'),
        shipment.seller,
        shipment.buyer,
        shipment.origin,
        shipment.destination,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  function handleSearch(e) {
    e.preventDefault();
    if (filtered.length === 1) navigate(`/pelacakan/${filtered[0].id}`);
  }

  return (
    <>
      <section className="page-hero-banner">
        <div className="site-container">
          <div className="pill-badge pill-blue">{isEn ? 'SHIPMENT TRACKING' : 'PELACAKAN PENGIRIMAN'}</div>
          <h1 className="page-hero-title">
            {isEn ? <>Track Your <span className="text-accent">Shipment</span></> : <>Lacak <span className="text-accent">Pengiriman</span></>}
          </h1>
          <p className="page-hero-subtitle">
            {isEn
              ? 'Search by resi or shipment ID. Every shipment has a dedicated page with route, mode changes, 8-step status, and ETA.'
              : 'Cari berdasarkan resi atau ID pengiriman. Setiap transaksi memiliki halaman tersendiri berisi rute, pergantian moda, status 8 tahap, dan ETA.'}
          </p>
        </div>
      </section>

      <section className="section-product-controls">
        <div className="site-container">
          <form className="controls-wrapper-card tracking-search-card" onSubmit={handleSearch}>
            <div>
              <h2>{isEn ? 'Find a shipment' : 'Cari pengiriman'}</h2>
              <p>{isEn ? 'Try NB-SHP-2026-08421 or NB-EXP-08421-IDDE.' : 'Coba NB-SHP-2026-08421 atau NB-EXP-08421-IDDE.'}</p>
            </div>
            <div className="tracking-search-row">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isEn ? 'Enter resi / shipment ID / product...' : 'Masukkan resi / ID pengiriman / produk...'}
              />
              <button className="btn btn-primary" type="submit">{isEn ? 'Search' : 'Cari'}</button>
            </div>
            <div className="simulation-inline-note">
              {isEn ? 'Demo data only — no real GPS or carrier status.' : 'Hanya data demo — bukan GPS atau status ekspedisi nyata.'}
            </div>
          </form>
        </div>
      </section>

      <section className="section-product-list">
        <div className="site-container">
          <div className="tracking-list-grid">
            {filtered.map((shipment) => (
              <Link key={shipment.id} to={`/pelacakan/${shipment.id}`} className="tracking-list-card">
                <div className="tlc-top">
                  <span className="tlc-icon">{CATEGORY_ICON[(shipment.segments[0] || {}).mode] || '📦'}</span>
                  <span className="simulation-chip">{isEn ? 'SIMULATION' : 'SIMULASI'}</span>
                </div>
                <span className="tlc-resi">{shipment.resi}</span>
                <h3>{shipmentProductName(shipment, lang)}</h3>
                <p>{L(shipment.origin)} → {L(shipment.destination)}</p>
                <div className="tlc-meta">
                  <span>{shipment.weightKg.toLocaleString()} kg</span>
                  <span>{trl((SHIPMENT_STATUSES.find((s) => s.step === shipment.currentStep) || {}).label, lang)}</span>
                  <span>{shipment.progress}%</span>
                </div>
                <div className="tlc-progress"><div style={{ width: `${shipment.progress}%` }} /></div>
                <div className="tlc-footer">
                  <span>{isEn ? 'ETA' : 'ETA'}: <strong>{L(shipment.eta)}</strong></span>
                  <span className="tlc-link">{isEn ? 'Track →' : 'Lacak →'}</span>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-catalog-state" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔎</div>
              <h4>{isEn ? 'Shipment not found' : 'Pengiriman tidak ditemukan'}</h4>
              <p style={{ color: 'var(--text-muted)' }}>{isEn ? 'Check the resi or shipment ID and try again.' : 'Periksa kembali resi atau ID pengiriman Anda.'}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function TrackingPage() {
  const { lang } = useApp();
  const { id } = useParams();
  const [shipment, setShipment] = useState(() => (id ? getShipmentById(id) : null));
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    let active = true;
    if (!id) {
      setShipment(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    findShipment(id)
      .then((result) => {
        if (active) setShipment(result || getShipmentById(id));
      })
      .catch(() => {
        if (active) setShipment(getShipmentById(id));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Sinkronkan daftar dari service (untuk kesiapan API) tanpa memblokir render.
  useEffect(() => {
    let active = true;
    listShipments().then((result) => {
      if (active && Array.isArray(result) && result.length === 0) {
        // fallback sudah ditangani service; tidak ada aksi tambahan.
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (id) {
    if (loading) {
      return (
        <section className="section-product-list">
          <div className="site-container">
            <div className="tracking-loading">{lang === 'en' ? 'Loading shipment...' : 'Memuat pengiriman...'}</div>
          </div>
        </section>
      );
    }
    if (!shipment) {
      return (
        <section className="section-product-list">
          <div className="site-container">
            <div className="empty-catalog-state" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
              <h2>{lang === 'en' ? 'Shipment not found' : 'Pengiriman tidak ditemukan'}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{lang === 'en' ? 'The resi or shipment ID is not in the simulation list.' : 'Resi atau ID pengiriman tidak ada dalam daftar simulasi.'}</p>
              <Link to="/pelacakan" className="btn btn-primary">{lang === 'en' ? 'Back to tracking list' : 'Kembali ke daftar pelacakan'}</Link>
            </div>
          </div>
        </section>
      );
    }
    return (
      <section className="section-product-list tracking-detail-section">
        <div className="site-container">
          <div className="tracking-breadcrumb">
            <Link to="/pelacakan">← {lang === 'en' ? 'All shipments' : 'Semua pengiriman'}</Link>
            <span>{shipment.id}</span>
          </div>
          <ShipmentDetail shipment={shipment} lang={lang} />
        </div>
      </section>
    );
  }

  return <TrackingList lang={lang} />;
}
