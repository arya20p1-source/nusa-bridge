/**
 * ==========================================================================
 * NUSABRIDGE - CARGO SHIP RADAR & MARITIME TELEMETRY ENGINE (FLIGHT RADAR STYLE)
 * Versi React dari src/scripts/radar.js (state dipindah ke module singleton).
 *
 * Konsep yang dipertahankan:
 * 1. SVG Path Geodesic Navigation  -> getTotalLength() + getPointAtLength()
 * 2. Heading Trigonometry          -> Math.atan2(dy, dx)
 * 3. Lat/Long Geolocation Telemetry-> interpolasi latRange/longRange
 * 4. State: play/pause, speed 1x/2x/5x, pemilihan kapal aktif
 * ==========================================================================
 */

export const VESSEL_KEYS = ['baruna', 'samudera', 'celebes'];

/** Database kapal kargo aktif (AIS Maritime Live Telemetry) — mutable runtime */
export const AIS_VESSELS = {
  baruna: {
    id: 'baruna',
    name: 'KM Baruna Nusantara',
    callSign: 'YBDA-9482104',
    status: '🟢 Berlayar (On Schedule)',
    origin: 'Tanjung Priok, Jakarta (ID)',
    destination: 'Port of Hamburg (DE)',
    route: 'Tanjung Priok, ID ➔ Hamburg, DE',
    speed: 19.4,
    baseSpeed: 19.4,
    progress: 0.68, // 68% perjalanan
    eta: '4 Hari Lagi (24 Okt 2026)',
    cargo: '20 Kontainer (500 MT) Kopi Arabika Gayo',
    fullRoute: 'Tanjung Priok ➔ Selat Sunda ➔ Samudera Hindia ➔ Terusan Suez ➔ Hamburg',
    heading: '285° WNW (Barat Laut)',
    temp: '21.5°C (Reefer Optimal)',
    humidity: '62%',
    color: '#10b981',
    latRange: [-6.1, 53.5],
    longRange: [106.8, 9.9],
  },
  samudera: {
    id: 'samudera',
    name: 'MV Samudera Raya',
    callSign: 'PKST-9628101',
    status: '🟢 Berlayar Menyeberang Pasifik',
    origin: 'Tanjung Perak, Surabaya (ID)',
    destination: 'Port of Los Angeles (US)',
    route: 'Tanjung Perak, ID ➔ Los Angeles, US',
    speed: 21.2,
    baseSpeed: 21.2,
    progress: 0.45, // 45% perjalanan
    eta: '9 Hari Lagi (29 Okt 2026)',
    cargo: '15 Kontainer Kerajinan Rotan & Furnitur Ramah Lingkungan',
    fullRoute: 'Tanjung Perak Surabaya ➔ Laut Banda ➔ Samudera Pasifik ➔ Port of Los Angeles',
    heading: '065° ENE (Timur Laut)',
    temp: '24.0°C (Dry Box Ventilated)',
    humidity: '58%',
    color: '#38bdf8',
    latRange: [-7.2, 33.7],
    longRange: [112.7, -118.2],
  },
  celebes: {
    id: 'celebes',
    name: 'KM Celebes Express',
    callSign: 'YBCE-9319800',
    status: '🟢 Mendekati Selat Taiwan',
    origin: 'Pelabuhan Belawan, Medan (ID)',
    destination: 'Port of Tokyo (JP)',
    route: 'Pelabuhan Belawan, ID ➔ Tokyo, JP',
    speed: 17.8,
    baseSpeed: 17.8,
    progress: 0.82, // 82% perjalanan
    eta: '2 Hari Lagi (20 Okt 2026)',
    cargo: '12 Kontainer Rempah Cengkeh & Minyak Atsiri Nilam',
    fullRoute: 'Belawan Medan ➔ Selat Malaka ➔ Laut Natuna ➔ Selat Taiwan ➔ Port of Tokyo',
    heading: '035° NNE (Utara Timur Laut)',
    temp: '22.8°C (Reefer Controlled)',
    humidity: '60%',
    color: '#f59e0b',
    latRange: [3.8, 35.6],
    longRange: [98.7, 139.8],
  },
};

/** State engine radar (dibagi antara widget beranda & modal fullscreen) */
export const radarState = {
  running: true,
  speedMulti: 1, // 1x, 2x, 5x
  activeKey: 'baruna',
};

const listeners = new Set();
let intervalId = null;
let subCount = 0;

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (_) {
      /* subscriber error jangan matikan engine */
    }
  });
}

function tick() {
  if (!radarState.running) return;

  Object.keys(AIS_VESSELS).forEach((key) => {
    const v = AIS_VESSELS[key];
    // Kapal berlayar maju perlahan: 0.00025 per tick dikali multiplier kecepatan
    v.progress += 0.00025 * radarState.speedMulti;
    if (v.progress > 0.98) {
      v.progress = 0.02; // Loop kembali ke pelabuhan awal setelah tiba di tujuan
    }
    // Sedikit fluktuasi kecepatan knots agar realistis
    const speedDelta = (Math.random() - 0.5) * 0.08 * radarState.speedMulti;
    v.speed = Math.max(16, Math.min(24, v.speed + speedDelta));
  });

  notify();
}

/**
 * Berlangganan tick radar (interval halus 35ms ≈ 29 FPS).
 * Hanya SATU interval aktif walau banyak komponen (HUD, peta widget, modal)
 * yang berlangganan — meniru perilaku engine vanilla lama.
 */
export function subscribeRadar(fn) {
  listeners.add(fn);
  subCount += 1;
  if (subCount === 1) {
    intervalId = setInterval(tick, 35);
  }
  return () => {
    listeners.delete(fn);
    subCount -= 1;
    if (subCount === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export function selectVessel(key) {
  if (!AIS_VESSELS[key]) return;
  radarState.activeKey = key;
  notify();
}

export function setRadarRunning(running) {
  radarState.running = running;
  notify();
}

export function setRadarSpeed(multi) {
  radarState.speedMulti = multi;
  notify();
}

export function getActiveVessel() {
  return AIS_VESSELS[radarState.activeKey] || AIS_VESSELS.baruna;
}

/**
 * Perhitungan koordinat Lat/Long simulasi dari progress pelayaran,
 * hasil format: "Lat: 05°42'S • Long: 105°18'E"
 */
export function calculateVesselCoords(vessel) {
  const p = vessel.progress;
  const lat = vessel.latRange[0] + (vessel.latRange[1] - vessel.latRange[0]) * p;
  const long = vessel.longRange[0] + (vessel.longRange[1] - vessel.longRange[0]) * p;

  const latDir = lat >= 0 ? 'N' : 'S';
  const longDir = long >= 0 ? 'E' : 'W';

  const latDeg = Math.floor(Math.abs(lat));
  const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);

  const longDeg = Math.floor(Math.abs(long));
  const longMin = Math.floor((Math.abs(long) - longDeg) * 60);

  return `Lat: ${String(latDeg).padStart(2, '0')}°${String(latMin).padStart(2, '0')}'${latDir} • Long: ${String(longDeg).padStart(3, '0')}°${String(longMin).padStart(2, '0')}'${longDir}`;
}
