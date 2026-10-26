import { useEffect, useRef, useState } from 'react';
import {
  AIS_VESSELS,
  VESSEL_KEYS,
  radarState,
  subscribeRadar,
  selectVessel,
} from './radarEngine.js';

const ROUTE_D = {
  baruna: 'M477,181 C450,221 416,229 392,210 S343,167 329,124 Q321,98 317,70',
  samudera: 'M477,181 C432,274 331,303 238,258 S141,175 103,106',
  celebes: 'M477,181 Q514,142 532,104',
};

const VESSEL_START = {
  baruna: { x: 410, y: 208, rot: -150 },
  samudera: { x: 306, y: 282, rot: -40 },
  celebes: { x: 510, y: 145, rot: -65 },
};

const VESSEL_TAG_TEXT = {
  baruna: 'KM Baruna',
  samudera: 'MV Samudera',
  celebes: 'KM Celebes',
};

const HOME_HINT_PREFIX = VESSEL_KEYS.reduce(
  (acc, key, i) => ({ ...acc, [key]: `route${i + 1}` }),
  {}
);

/**
 * Peta SVG radar maritim interaktif (Flightradar24 / MarineTraffic style).
 * Dipakai dua kali: widget beranda (variant="home") dan modal fullscreen
 * (variant="modal"). Posisi kapal diperbarui imperatif lewat refs dengan
 * `path.getTotalLength()` + `path.getPointAtLength()` — persis engine
 * vanilla lama, dengan performa yang sama.
 *
 * @param {('home'|'modal')} variant
 * @param {(key: string) => void} [onSelectVessel] dipanggil saat kapal diklik
 */
export default function RadarMap({ variant = 'home', onSelectVessel }) {
  const pathRefs = useRef({});
  const groupRefs = useRef({});
  const hideTimer = useRef(null);
  const activeKeyRef = useRef(radarState.activeKey);
  const [activeKey, setActiveKey] = useState(radarState.activeKey);
  const [tooltip, setTooltip] = useState(null); // { key, x, y, ... }

  const isModal = variant === 'modal';

  const getId = (key, kind) =>
    `${isModal ? 'modal' : ''}${kind.charAt(0).toUpperCase() + kind.slice(1)}${
      VESSEL_KEYS.indexOf(key) + 1
    }`; // route1/modalRoute1 ... vessel1/modalVessel1

  // ---------------------------------------------------------------
  // ENGINE ANIMASI KAPAL BERLAYAR MULUS (FLIGHT RADAR ENGINE)
  // 1. currentDist = getTotalLength() * progress
  // 2. pt = path.getPointAtLength(currentDist)
  // 3. nextPt = getPointAtLength(currentDist + 2) -> vektor haluan
  // 4. group.translate(pt) & vessel-arrow.rotate(atan2(dy,dx))
  // 5. Sorot kapal & jalur pelayaran yang aktif (jalur lain meredup)
  // ---------------------------------------------------------------
  useEffect(() => {
    const applyHighlight = () => {
      const current = radarState.activeKey;
      if (current !== activeKeyRef.current) {
        activeKeyRef.current = current;
        setActiveKey(current);
      }
      VESSEL_KEYS.forEach((key) => {
        const laneActive = key === current;
        const path = pathRefs.current[key];
        if (path) {
          path.classList.toggle('highlighted', laneActive);
          path.classList.toggle('dimmed', !laneActive);
        }
        const group = groupRefs.current[key];
        if (group) {
          group.classList.toggle('active-vessel', laneActive);
        }
      });
    };

    const unsub = subscribeRadar(() => {
      VESSEL_KEYS.forEach((key) => {
        const path = pathRefs.current[key];
        const group = groupRefs.current[key];
        if (!path || !group) return;
        try {
          const totalLen = path.getTotalLength();
          const curDist = totalLen * AIS_VESSELS[key].progress;
          const pt = path.getPointAtLength(curDist);

          // Titik 2px di depan untuk kalkulasi sudut vektor arah
          const nextPt = path.getPointAtLength(Math.min(totalLen, curDist + 2));

          const angle =
            (Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * 180) / Math.PI;

          group.setAttribute(
            'transform',
            `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`
          );
          const arrow = group.querySelector('.vessel-arrow');
          if (arrow) arrow.setAttribute('transform', `rotate(${angle.toFixed(1)})`);
        } catch (_) {
          // Graceful fallback jika SVG path belum ter-render sempurna
        }
      });
      applyHighlight();
    });

    // Sorotan awal
    applyHighlight();
    return unsub;
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  function handleVesselClick(e, key) {
    e.stopPropagation();
    selectVessel(key);
    onSelectVessel?.(key);
    showVesselTooltip(key);
  }

  function showVesselTooltip(key) {
    const group = groupRefs.current[key];
    if (!group) return;
    const transformAttr = group.getAttribute('transform') || '';
    const match = transformAttr.match(/translate\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
    if (!match) return;

    const v = AIS_VESSELS[key];
    setTooltip({
      key,
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      name: v.name,
      speed: v.speed,
      route: `${v.origin.split(',')[0]} ➔ ${v.destination.split('(')[0]}`,
      cargo: v.cargo.split('(')[0],
      eta: v.eta.split('(')[0],
    });

    // Auto-hide tooltip setelah 4.5 detik kecuali di-hover lagi
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTooltip(null), 4500);
  }

  const renderLane = (key) => {
    const common = {
      id: getId(key, 'route'),
      ref: (el) => {
        pathRefs.current[key] = el;
      },
      fill: 'none',
      d: ROUTE_D[key],
      className: 'shipping-lane animated-lane',
    };

    if (!isModal) {
      const styles = {
        baruna: { stroke: 'url(#routeGlow)', strokeWidth: 2.2, strokeDasharray: '6,4' },
        samudera: { stroke: '#38bdf8', strokeWidth: 1.8, strokeDasharray: '5,3', opacity: 0.8 },
        celebes: { stroke: '#a7f3d0', strokeWidth: 1.8, strokeDasharray: '5,3', opacity: 0.8 },
      }[key];
      return <path key={key} {...common} {...styles} />;
    }

    const styles = {
      baruna: { stroke: '#10b981', strokeWidth: 2.5 },
      samudera: { stroke: '#38bdf8', strokeWidth: 2 },
      celebes: { stroke: '#f59e0b', strokeWidth: 2 },
    }[key];
    return (
      <path key={key} {...common} {...styles} strokeDasharray="6,4" />
    );
  };

  const renderVessel = (key) => {
    const v = AIS_VESSELS[key];
    const start = VESSEL_START[key];
    const isActive = key === activeKey;
    const shortName = VESSEL_TAG_TEXT[key];

    if (isModal) {
      return (
        <g
          key={key}
          id={getId(key, 'vessel')}
          data-vessel={key}
          className={`vessel-icon-group ${isActive ? 'active-vessel' : ''}`}
          transform={`translate(${start.x}, ${start.y})`}
          ref={(el) => {
            groupRefs.current[key] = el;
          }}
          onClick={(e) => handleVesselClick(e, key)}
          onMouseEnter={() => showVesselTooltip(key)}
          role="button"
          tabIndex={0}
        >
          <circle r="16" fill={`${v.color}40`} className="vessel-sonar" />
          <circle r="7" fill={v.color} />
          <path
            className="vessel-arrow"
            d="M-6,-4 L8,0 L-6,4 L-4,0 Z"
            fill="#ffffff"
            transform={`rotate(${start.rot})`}
          />
          <text x="12" y="4" fill={v.color} fontSize="9" fontWeight="700">
            {`${shortName} (${v.baseSpeed.toFixed(1)} kn)`}
          </text>
        </g>
      );
    }

    return (
      <g
        key={key}
        id={getId(key, 'vessel')}
        data-vessel={key}
        className={`vessel-icon-group ${isActive ? 'active-vessel' : ''}`}
        transform={`translate(${start.x}, ${start.y})`}
        ref={(el) => {
          groupRefs.current[key] = el;
        }}
        onClick={(e) => handleVesselClick(e, key)}
        onMouseEnter={() => showVesselTooltip(key)}
        role="button"
        tabIndex={0}
      >
        <circle r="14" fill={`${v.color}33`} className="vessel-sonar" />
        <circle r="6" fill={v.color} />
        <path
          className="vessel-arrow"
          d="M-5,-3 L7,0 L-5,3 L-3,0 Z"
          fill="#ffffff"
          transform={`rotate(${start.rot})`}
        />
        <g className="vessel-tag" transform="translate(10, -8)">
          <rect width="98" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke={v.color} strokeWidth="1" />
          <text x="6" y="12" fill="#ffffff" fontSize="7.5" fontWeight="700">
            {`🚢 ${shortName} (${v.baseSpeed.toFixed(1)} kn)`}
          </text>
        </g>
      </g>
    );
  };

  return (
    <>
      {/* Floating Tooltip Popover (Flightradar24 / MarineTraffic Style) */}
      {tooltip && (
        <div
          className="vessel-popover-tooltip"
          style={{
            left: `${(tooltip.x / 600) * 100}%`,
            top: `${(tooltip.y / 340) * 100}%`,
            display: 'block',
            opacity: 1,
          }}
        >
          <div className="vpt-header">
            <span className="vpt-name">{tooltip.name}</span>
            <span className="vpt-speed">{tooltip.speed.toFixed(1)} kn</span>
          </div>
          <div className="vpt-row"><span>Rute:</span> <strong>{tooltip.route}</strong></div>
          <div className="vpt-row"><span>Muatan:</span> <strong>{tooltip.cargo}</strong></div>
          <div className="vpt-row"><span>Status:</span> <strong style={{ color: '#10b981' }}>Simulasi AIS</strong></div>
          <div className="vpt-row"><span>ETA:</span> <strong style={{ color: '#f59e0b' }}>{tooltip.eta}</strong></div>
        </div>
      )}

      <svg className="marine-svg-map" viewBox="0 0 600 340" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Peta dunia dengan rute pengiriman laut dan udara">
        <defs>
          <linearGradient id={isModal ? 'modalOceanGrad' : 'oceanGrad'} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isModal ? '#071224' : '#0a192f'} />
            <stop offset="100%" stopColor="#050e1d" />
          </linearGradient>
          {!isModal && (
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
          )}
        </defs>

        <rect width="600" height="340" fill={`url(#${isModal ? 'modalOceanGrad' : 'oceanGrad'})`} />

        <g className="map-world-land">
          <path className="map-continent" d="M34 61 L52 43 77 34 94 37 109 30 128 42 145 38 158 48 174 51 189 70 183 83 168 88 161 103 148 110 140 126 126 135 120 153 107 165 96 149 87 139 75 134 68 117 55 108 49 91 40 83 Z" />
          <path className="map-continent" d="M183 28 L205 18 229 25 238 41 225 61 207 66 196 56 Z" />
          <path className="map-continent" d="M145 160 L161 166 174 181 181 202 194 220 188 243 181 267 169 291 159 279 154 256 146 237 143 213 136 192 Z" />
          <path className="map-continent" d="M278 67 L288 56 307 53 321 59 329 52 346 57 360 51 378 55 390 50 408 56 426 53 443 59 461 57 478 65 496 64 513 73 532 69 552 81 562 96 552 108 534 110 521 121 505 123 490 133 471 131 458 140 442 135 431 145 415 137 401 142 384 135 369 141 356 131 340 137 328 126 315 132 303 120 291 113 283 98 Z" />
          <path className="map-continent" d="M286 132 L303 126 320 131 333 144 342 159 337 177 329 191 323 210 311 226 302 215 298 197 289 182 285 164 Z" />
          <path className="map-continent" d="M368 143 L377 147 384 153 379 159 371 155 Z" />
          <path className="map-continent" d="M398 143 L406 145 412 151 405 156 399 152 Z" />
          <path className="map-continent" d="M425 150 L435 153 441 160 434 166 427 161 Z" />
          <path className="map-continent" d="M445 164 L453 167 458 172 451 176 445 172 Z" />
          <path className="map-continent" d="M460 179 L469 181 476 184 470 188 461 186 Z" />
          <path className="map-continent" d="M520 188 L532 190 540 196 534 201 522 198 Z" />
          <path className="map-continent" d="M461 234 L478 226 498 228 518 237 531 251 526 269 512 281 493 284 477 276 463 262 455 247 Z" />
          <path className="map-continent" d="M276 40 L282 38 285 44 280 48 Z" />
          <path className="map-continent" d="M543 130 L548 132 546 137 542 135 Z" />
        </g>

        <g className="map-region-labels" aria-hidden="true">
          <text x="87" y="91">AMERIKA UTARA</text>
          <text x="151" y="221">AMERIKA SELATAN</text>
          <text x="311" y="91">EROPA</text>
          <text x="297" y="178">AFRIKA</text>
          <text x="437" y="91">ASIA</text>
          <text x="482" y="258">AUSTRALIA</text>
        </g>

        <path className="air-route" d="M477 181 Q398 76 317 70" />
        <path className="air-route" d="M477 181 Q526 112 532 104" />
        <path className="air-route" d="M477 181 Q560 135 600 141 M0 141 Q56 116 103 106" />

        <g className="aircraft-marker" transform="translate(397 112) rotate(-38)" role="img" aria-label="Pesawat pada rute udara Jakarta-Hamburg">
          <text x="0" y="0">✈</text>
        </g>
        <g className="aircraft-marker" transform="translate(564 145) rotate(-18)" role="img" aria-label="Pesawat pada rute udara Jakarta-Los Angeles">
          <text x="0" y="0">✈</text>
        </g>
        <g className="aircraft-marker" transform="translate(509 139) rotate(-45)" role="img" aria-label="Pesawat pada rute udara Jakarta-Tokyo">
          <text x="0" y="0">✈</text>
        </g>

        <g className="port-marker" transform="translate(477 181)">
          <circle r="7" fill="none" stroke="#10b981" strokeWidth="1.5" className="port-ping" />
          <circle r="3.5" fill="#10b981" />
          <text x="8" y="13" fill="#ffffff" fontSize="8" fontWeight="700">Jakarta (ID)</text>
        </g>
        <g className="port-marker" transform="translate(317 70)">
          <circle r="6" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="port-ping" />
          <circle r="3" fill="#f59e0b" />
          <text x="-4" y="-9" fill="#cbd5e1" fontSize="8">Hamburg (DE)</text>
        </g>
        <g className="port-marker" transform="translate(532 104)">
          <circle r="5" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="port-ping" />
          <circle r="2.5" fill="#38bdf8" />
          <text x="7" y="4" fill="#cbd5e1" fontSize="8">Tokyo (JP)</text>
        </g>
        <g className="port-marker" transform="translate(103 106)">
          <circle r="5" fill="none" stroke="#a855f7" strokeWidth="1.5" className="port-ping" />
          <circle r="2.5" fill="#a855f7" />
          <text x="-5" y="-8" fill="#cbd5e1" fontSize="8">Los Angeles (US)</text>
        </g>

        {/* Global Shipping Lanes (Curved Geodesic Flight-Radar Style Lines) */}
        {VESSEL_KEYS.map((key) => renderLane(key))}

        {/* Active Cargo Ships (Vessels) on Routes */}
        {VESSEL_KEYS.map((key) => renderVessel(key))}
      </svg>
      <div className="map-transport-legend" aria-label="Legenda jenis pengiriman">
        <span><b className="legend-sea">●</b> Rute laut</span>
        <span><b className="legend-air">✈</b> Rute udara</span>
      </div>
    </>
  );
}
