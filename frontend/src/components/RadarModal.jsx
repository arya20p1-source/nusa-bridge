import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import RadarMap from './radar/RadarMap.jsx';
import downloadHtmlFile from '../utils/downloadHtmlFile.js';
import {
  AIS_VESSELS,
  radarState,
  subscribeRadar,
  setRadarRunning,
  setRadarSpeed,
  calculateVesselCoords,
} from './radar/radarEngine.js';

/**
 * Modal Radar Maritim layar penuh (Flight-Radar style).
 * Versi React dari #radarModal di index.html + handler radar.js:
 * - Toolbar play/pause live streaming AIS + kecepatan simulasi (1x/2x/5x)
 * - Koordinat lat/long live di pojok kanan atas
 * - Panel telemetri kapal aktif + unduh Manifest Pelayaran (PDF)
 */
export default function RadarModal() {
  const { modal, closeModal, showToast } = useApp();
  const open = modal?.type === 'radar';

  const [running, setRunning] = useState(radarState.running);
  const [speedMulti, setSpeedMulti] = useState(radarState.speedMulti);
  const [activeKey, setActiveKey] = useState(radarState.activeKey);

  const coordsRef = useRef(null);
  const shipTitleRef = useRef(null);
  const cargoRef = useRef(null);
  const routeRef = useRef(null);
  const speedRef = useRef(null);
  const etaRef = useRef(null);

  const activeKeyRef = useRef(radarState.activeKey);

  useEffect(() => {
    const unsub = subscribeRadar(() => {
      const v = AIS_VESSELS[radarState.activeKey];
      if (!v) return;

      if (radarState.activeKey !== activeKeyRef.current) {
        activeKeyRef.current = radarState.activeKey;
        setActiveKey(radarState.activeKey);
      }

      const pct = Math.round(v.progress * 100);
      if (coordsRef.current) {
        coordsRef.current.textContent = `📍 ${calculateVesselCoords(v)}`;
      }
      if (shipTitleRef.current) {
        shipTitleRef.current.textContent = `${v.name} (${v.callSign})`;
      }
      if (cargoRef.current) cargoRef.current.textContent = v.cargo;
      if (routeRef.current) routeRef.current.textContent = v.fullRoute;
      if (speedRef.current) {
        speedRef.current.textContent = `${v.speed.toFixed(1)} Knots • Haluan: ${v.heading}`;
      }
      if (etaRef.current) etaRef.current.textContent = `${v.eta} (${pct}% Selesai)`;
    });
    return unsub;
  }, []);

  if (!open) return null;

  const v = AIS_VESSELS[activeKey] || AIS_VESSELS.baruna;

  function handleTogglePlay() {
    const next = !radarState.running;
    setRadarRunning(next);
    setRunning(next);
    showToast(
      next
        ? '▶️ Pelacakan Satelit AIS Dilanjutkan'
        : '⏸️ Simulasi Pelayaran Maritim Dijeda'
    );
  }

  function handleSpeed(multi) {
    setRadarSpeed(multi);
    setSpeedMulti(multi);
    showToast(`⚡ Kecepatan Radar Maritim: ${multi}x`);
  }

  function handleSelectVessel(key) {
    showToast(`🚢 Radar AIS Terhubung: ${AIS_VESSELS[key].name}`);
  }

  function handleDownloadManifest() {
    const vessel = AIS_VESSELS[radarState.activeKey] || AIS_VESSELS.baruna;

    const manifestHtml = `
      <div class="header">
        <div>
          <div class="title">OFFICIAL MARITIME CARGO MANIFEST</div>
          <div style="font-size:12px; color:#64748b;">No: MAN-${Date.now()} &bull; Tanggal: ${new Date().toLocaleDateString('id-ID')}</div>
        </div>
        <div class="seal">🛡️ VERIFIED BY NUSABRIDGE AIS</div>
      </div>
      <p>
        <strong>Kapal Pengangkut:</strong> ${vessel.name} (${vessel.callSign})<br>
        <strong>Rute Pelayaran:</strong> ${vessel.route}<br>
        <strong>Posisi AIS:</strong> Koordinat ${calculateVesselCoords(vessel)} &bull; Kecepatan: ${vessel.speed.toFixed(1)} Knots
      </p>
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
        <div>Status Pelayaran: <strong>ON SCHEDULE (${Math.round(vessel.progress * 100)}% Selesai)</strong></div>
        <div>Otoritas Pelayaran: <strong>NusaBridge Maritime Tracking Suite</strong></div>
      </div>
    `;

    downloadHtmlFile(
      `Manifest-Pelayaran-${vessel.name.replace(/\s+/g, '-')}.html`,
      `Manifest Pelayaran - ${vessel.name}`,
      manifestHtml
    );
    showToast('🚢 Manifest pelayaran maritim resmi berhasil diunduh ke perangkat Anda!');
  }

  return (
    <div
      className="modal-overlay modal-radar-overlay active show"
      id="radarModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal-card radar-modal-card">
        <button className="modal-close-btn" id="closeRadarModal" onClick={closeModal}>&times;</button>

        <div className="modal-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <div className="pill-badge pill-blue">MARITIME AIS FLIGHT-RADAR SYSTEM</div>
              <h3 className="modal-title" style={{ color: '#ffffff', marginTop: 4 }}>
                Peta Pelayaran Kapal Kargo Real-Time
              </h3>
            </div>
            <span className="live-ais-badge" style={{ fontSize: 12, padding: '4px 12px' }}>
              <span className="live-dot-pulse" /> SATELLITE LIVE TRACKING
            </span>
          </div>
        </div>

        <div className="radar-modal-body">
          <div className="radar-modal-canvas-box">
            {/* Live Interactive Control Toolbar (Flight Radar Style) */}
            <div className="radar-toolbar-strip">
              <div className="rt-left">
                <button
                  className={`btn-radar-tool ${running ? 'active' : 'paused'}`}
                  type="button"
                  title="Jeda/Lanjut Simulasi Pelayaran"
                  onClick={handleTogglePlay}
                >
                  <span>{running ? '⏸️' : '▶️'}</span>
                  <span>{running ? 'Live Streaming AIS' : 'Dijeda'}</span>
                </button>
                <div className="rt-speed-group">
                  {[1, 2, 5].map((multi) => (
                    <button
                      key={multi}
                      className={`btn-speed-pill ${speedMulti === multi ? 'active' : ''}`}
                      data-speed={multi}
                      type="button"
                      title={`Kecepatan ${multi}x`}
                      onClick={() => handleSpeed(multi)}
                    >
                      {multi}x
                    </button>
                  ))}
                </div>
              </div>
              <div className="rt-right">
                <span className="rt-coords-display" ref={coordsRef}>
                  {`📍 ${calculateVesselCoords(v)}`}
                </span>
              </div>
            </div>

            <div className="marine-radar-display" style={{ height: 'calc(100% - 44px)' }}>
              <div className="radar-sweep-beam" />
              <RadarMap variant="modal" onSelectVessel={handleSelectVessel} />
              <div className="radar-grid-lines" />
            </div>
          </div>

          {/* Panel Telemetri Kapal Aktif */}
          <div className="radar-telemetry-panel">
            <h4 style={{ color: '#ffffff', fontSize: 14, marginBottom: 4 }} ref={shipTitleRef}>
              {`${v.name} (${v.callSign})`}
            </h4>
            <span style={{ color: '#10b981', fontSize: '11.5px', fontWeight: 700 }}>
              🟢 Sea Voyage (Dalam Pelayaran Samudera)
            </span>

            <div className="rtp-row">
              <span>Muatan Kontainer:</span>
              <span ref={cargoRef}>{v.cargo}</span>
            </div>
            <div className="rtp-row">
              <span>Rute &amp; Koridor:</span>
              <span ref={routeRef}>{v.fullRoute}</span>
            </div>
            <div className="rtp-row">
              <span>Kecepatan Saat Ini:</span>
              <span ref={speedRef}>{`${v.speed.toFixed(1)} Knots • Haluan: ${v.heading}`}</span>
            </div>
            <div className="rtp-row">
              <span>Haluan Kapal:</span>
              <span>{v.heading}</span>
            </div>
            <div className="rtp-row">
              <span>Kondisi Cuaca Maritim:</span>
              <span>Ombak 1.2m • Angin 14 Knots (Tenang)</span>
            </div>
            <div className="rtp-row">
              <span>Suhu Kontainer (Reefer):</span>
              <span style={{ color: '#38bdf8' }}>{`${v.temp} • Kelembapan ${v.humidity} (Optimal)`}</span>
            </div>
            <div className="rtp-row">
              <span>Estimasi Tiba (ETA):</span>
              <span style={{ color: '#f59e0b' }} ref={etaRef}>
                {`${v.eta} (${Math.round(v.progress * 100)}% Selesai)`}
              </span>
            </div>

            <div style={{ marginTop: 8 }}>
              <button className="btn btn-primary btn-block" type="button" onClick={handleDownloadManifest}>
                Download Laporan Manifest Pelayaran (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
