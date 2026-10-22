import { useEffect, useRef, useState } from 'react';
import {
  AIS_VESSELS,
  VESSEL_KEYS,
  radarState,
  subscribeRadar,
  selectVessel,
} from './radarEngine.js';

const ROUTE_D = {
  baruna: 'M395,240 Q330,190 260,170 T150,110 T90,75',
  samudera: 'M420,245 Q500,210 560,160 T595,120',
  celebes: 'M375,215 Q410,160 460,120 T510,95',
};

const VESSEL_START = {
  baruna: { x: 235, y: 155, rot: -150 },
  samudera: { x: 490, y: 205, rot: -40 },
  celebes: { x: 425, y: 150, rot: -65 },
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
          <div className="vpt-row"><span>Status:</span> <strong style={{ color: '#10b981' }}>AIS Real-Time</strong></div>
          <div className="vpt-row"><span>ETA:</span> <strong style={{ color: '#f59e0b' }}>{tooltip.eta}</strong></div>
        </div>
      )}

      <svg className="marine-svg-map" viewBox="0 0 600 340" preserveAspectRatio="xMidYMid meet">
        {isModal ? (
          <>
            <rect width="600" height="340" fill="#071224" />
            {/* Continents */}
            <path d="M120,40 Q160,35 220,50 Q280,60 360,70 Q420,60 480,90 Q470,130 430,140 Q400,120 370,150 Q340,180 320,180 Q300,160 260,180 Q220,200 200,240 Q170,220 160,170 Q140,150 120,110 Z" fill="#142c4c" opacity="0.8" />
            <path d="M30,60 Q60,80 70,130 Q80,180 60,220 Q40,260 50,300 Q20,280 15,200 Q20,120 30,60 Z" fill="#142c4c" opacity="0.8" />
            <g transform="translate(350, 190) scale(0.8)">
              <path d="M10,25 Q30,10 60,40 Q45,55 15,35 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
              <path d="M55,55 Q90,52 130,60 Q110,68 60,65 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
              <path d="M75,15 Q105,10 115,35 Q95,50 75,30 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
              <path d="M130,20 Q145,15 140,40 Q155,50 135,55 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
              <path d="M165,30 Q210,25 240,45 Q210,65 170,55 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
            </g>
            <path d="M440,250 Q490,240 520,270 Q510,310 460,315 Q430,290 440,250 Z" fill="#142c4c" opacity="0.8" />
            {/* Ports */}
            <circle cx="395" cy="240" r="5" fill="#10b981" />
            <text x="404" y="244" fill="#ffffff" fontSize="9" fontWeight="700">Tanjung Priok, ID</text>
            <circle cx="90" cy="75" r="5" fill="#f59e0b" />
            <text x="12" y="78" fill="#cbd5e1" fontSize="9">Hamburg, DE</text>
            <circle cx="510" cy="95" r="5" fill="#38bdf8" />
            <text x="518" y="99" fill="#cbd5e1" fontSize="9">Tokyo, JP</text>
          </>
        ) : (
          <>
            {/* Ocean Background & Grid */}
            <defs>
              <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a192f" />
                <stop offset="100%" stopColor="#050e1d" />
              </linearGradient>
              <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            <rect width="600" height="340" fill="url(#oceanGrad)" />

            {/* Continent Outlines (Abstract Stylized Vector) */}
            <path className="continent-land" d="M120,40 Q160,35 220,50 Q280,60 360,70 Q420,60 480,90 Q470,130 430,140 Q400,120 370,150 Q340,180 320,180 Q300,160 260,180 Q220,200 200,240 Q170,220 160,170 Q140,150 120,110 Z" fill="#132743" opacity="0.6" />
            <path className="continent-land" d="M30,60 Q60,80 70,130 Q80,180 60,220 Q40,260 50,300 Q20,280 15,200 Q20,120 30,60 Z" fill="#132743" opacity="0.6" />
            {/* Indonesian Archipelago & SE Asia (Center-Right Highlighted) */}
            <g className="indo-archipelago" transform="translate(350, 190) scale(0.8)">
              <path d="M10,25 Q30,10 60,40 Q45,55 15,35 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
              <path d="M55,55 Q90,52 130,60 Q110,68 60,65 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
              <path d="M75,15 Q105,10 115,35 Q95,50 75,30 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
              <path d="M130,20 Q145,15 140,40 Q155,50 135,55 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
              <path d="M165,30 Q210,25 240,45 Q210,65 170,55 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
            </g>
            {/* Australia (Bottom Right) */}
            <path className="continent-land" d="M440,250 Q490,240 520,270 Q510,310 460,315 Q430,290 440,250 Z" fill="#132743" opacity="0.6" />

            {/* Major Ports (Pusat Pelabuhan Hub) */}
            <g className="port-marker" transform="translate(395, 240)">
              <circle r="7" fill="none" stroke="#10b981" strokeWidth="1.5" className="port-ping" />
              <circle r="3.5" fill="#10b981" />
              <text x="8" y="4" fill="#ffffff" fontSize="8.5" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">Tanjung Priok (ID)</text>
            </g>
            <g className="port-marker" transform="translate(90, 75)">
              <circle r="6" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="port-ping" />
              <circle r="3" fill="#f59e0b" />
              <text x="-80" y="4" fill="#cbd5e1" fontSize="8" fontFamily="'Plus Jakarta Sans', sans-serif">Hamburg (DE)</text>
            </g>
            <g className="port-marker" transform="translate(510, 95)">
              <circle r="5" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="port-ping" />
              <circle r="2.5" fill="#38bdf8" />
              <text x="8" y="4" fill="#cbd5e1" fontSize="8" fontFamily="'Plus Jakarta Sans', sans-serif">Tokyo (JP)</text>
            </g>
            <g className="port-marker" transform="translate(585, 120)">
              <circle r="5" fill="none" stroke="#a855f7" strokeWidth="1.5" className="port-ping" />
              <circle r="2.5" fill="#a855f7" />
              <text x="-65" y="-6" fill="#cbd5e1" fontSize="8" fontFamily="'Plus Jakarta Sans', sans-serif">Los Angeles (US)</text>
            </g>
          </>
        )}

        {/* Global Shipping Lanes (Curved Geodesic Flight-Radar Style Lines) */}
        {VESSEL_KEYS.map((key) => renderLane(key))}

        {/* Active Cargo Ships (Vessels) on Routes */}
        {VESSEL_KEYS.map((key) => renderVessel(key))}
      </svg>
    </>
  );
}
