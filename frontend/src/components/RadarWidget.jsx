import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import RadarMap from './radar/RadarMap.jsx';
import {
  AIS_VESSELS,
  VESSEL_KEYS,
  radarState,
  subscribeRadar,
  selectVessel,
} from './radar/radarEngine.js';

/**
 * Widget "Radar Pelayaran Kapal Kargo" pada dashboard mockup beranda.
 * Termasuk HUD telemetri + quick switcher kapal + tombol layar penuh
 * (membuka RadarModal). Perilaku & markup mengikuti index.html + radar.js lama.
 */
export default function RadarWidget() {
  const { openModal, showToast } = useApp();
  const [activeKey, setActiveKey] = useState(radarState.activeKey);
  const activeKeyRef = useRef(radarState.activeKey);

  const nameRef = useRef(null);
  const statusRef = useRef(null);
  const routeTextRef = useRef(null);
  const speedTextRef = useRef(null);
  const progressPctRef = useRef(null);
  const etaRef = useRef(null);
  const progressFillRef = useRef(null);

  // HUD telemetri diperbarui imperatif per tick (hemat re-render React)
  const unsubscribe = useRef(null);
  useEffect(() => {
    unsubscribe.current = subscribeRadar(() => {
      // Sinkronkan pilihan kapal (misal dipilih dari modal fullscreen)
      if (radarState.activeKey !== activeKeyRef.current) {
        activeKeyRef.current = radarState.activeKey;
        setActiveKey(radarState.activeKey);
      }
      const v = AIS_VESSELS[radarState.activeKey];
      if (!v) return;
      const pct = `${Math.round(v.progress * 100)}%`;
      if (progressPctRef.current) progressPctRef.current.textContent = pct;
      if (speedTextRef.current) {
        speedTextRef.current.textContent = `Kecepatan: ${v.speed.toFixed(1)} knots`;
      }
      if (progressFillRef.current) progressFillRef.current.style.width = pct;
    });
    return () => unsubscribe.current?.();
  }, []);

  const v = AIS_VESSELS[activeKey] || AIS_VESSELS.baruna;

  function handleSelect(key) {
    selectVessel(key);
    setActiveKey(key);
    showToast(`🚢 Radar AIS Terhubung: ${AIS_VESSELS[key].name}`);
  }

  return (
    <div className="mwidget-card marine-radar-card">
      <div className="radar-card-header">
        <div className="radar-title-wrap">
          <h4 className="widget-title">Radar Pelayaran Kapal Kargo</h4>
          <span className="live-ais-badge">
            <span className="live-dot-pulse" /> LIVE AIS
          </span>
        </div>
        <div className="radar-quick-actions">
          <button
            className="btn-radar-fullscreen"
            type="button"
            title="Perbesar Radar Maritim"
            onClick={() => {
              openModal({ type: 'radar' });
              showToast('🔭 Membuka Radar Maritim Resolusi Tinggi (Full View)');
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span>Layar Penuh</span>
          </button>
        </div>
      </div>

      {/* Interactive Maritime AIS Radar Canvas Container */}
      <div className="marine-radar-display" id="marineRadarDisplay">
        <div className="radar-sweep-beam" />
        <RadarMap variant="home" />
        <div className="radar-grid-lines" />
      </div>

      {/* Vessel Telemetry Quick Status Strip (Clickable to switch vessels) */}
      <div className="vessel-telemetry-hud" id="vesselTelemetryHud">
        <div className="vth-vessel-info">
          <div className="vth-badge-row">
            <span className="vth-name" ref={nameRef}>{v.name}</span>
            <span className="vth-status-pill green" ref={statusRef}>{v.status}</span>
          </div>
          <div className="vth-route-row">
            <span ref={routeTextRef}>{v.route}</span>
            <span className="vth-speed" ref={speedTextRef}>
              {`Kecepatan: ${v.speed.toFixed(1)} knots`}
            </span>
          </div>
        </div>

        <div className="vth-progress-wrap">
          <div className="vth-progress-label">
            <span>
              Progres Pelayaran: <strong ref={progressPctRef}>{Math.round(v.progress * 100)}%</strong>
            </span>
            <span ref={etaRef}>{`ETA: ${v.eta}`}</span>
          </div>
          <div className="vth-progress-bar">
            <div
              className="vth-progress-fill"
              ref={progressFillRef}
              style={{ width: `${Math.round(v.progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Switcher Tabs */}
        <div className="vessel-quick-selector">
          <button
            className={`vqs-btn ${activeKey === 'baruna' ? 'active' : ''}`}
            type="button"
            onClick={() => handleSelect('baruna')}
          >
            KM Baruna (Eropa)
          </button>
          <button
            className={`vqs-btn ${activeKey === 'samudera' ? 'active' : ''}`}
            type="button"
            onClick={() => handleSelect('samudera')}
          >
            MV Samudera (USA)
          </button>
          <button
            className={`vqs-btn ${activeKey === 'celebes' ? 'active' : ''}`}
            type="button"
            onClick={() => handleSelect('celebes')}
          >
            KM Celebes (Asia)
          </button>
        </div>
      </div>
    </div>
  );
}
