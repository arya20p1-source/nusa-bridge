/**
 * ==========================================================================
 * NUSABRIDGE - DATA & SIMULASI LOGISTIK MULTIMODA
 * File: data/logistics.js
 *
 * CATATAN PENTING:
 * Semua angka biaya, ETA, ketersediaan, dan posisi di file ini adalah
 * SIMULASI untuk demo produk. Tidak ada data GPS / status pengiriman nyata.
 * Struktur dibuat agar nanti mudah diganti dengan respons API ekspedisi
 * (mis. Kargo, JNE, SiCepat, Maersk, Garuda Cargo, dsb.).
 * ==========================================================================
 */

/** Kategori transportasi utama (darat, laut, udara). */
export const TRANSPORT_CATEGORIES = [
  {
    id: 'land',
    icon: '🚚',
    color: '#d97706',
    label: { id: 'Transportasi Darat', en: 'Land Transport' },
    short: { id: 'Darat', en: 'Land' },
    desc: {
      id: 'Truk, mobil box, kontainer darat, kereta api barang, dan kurir ekspedisi.',
      en: 'Trucks, box vans, domestic containers, freight trains, and courier services.',
    },
  },
  {
    id: 'sea',
    icon: '🚢',
    color: '#0ea5e9',
    label: { id: 'Transportasi Laut', en: 'Sea Transport' },
    short: { id: 'Laut', en: 'Sea' },
    desc: {
      id: 'Kapal kargo, kapal kontainer, kapal antarpulau, dan kapal internasional.',
      en: 'Cargo ships, container ships, inter-island vessels, and international liners.',
    },
  },
  {
    id: 'air',
    icon: '✈️',
    color: '#7c3aed',
    label: { id: 'Transportasi Udara', en: 'Air Transport' },
    short: { id: 'Udara', en: 'Air' },
    desc: {
      id: 'Pesawat kargo, layanan kargo maskapai, dan pengiriman udara urgensi tinggi.',
      en: 'Freight aircraft, airline cargo services, and urgent air shipping.',
    },
  },
];

/**
 * Pilihan moda transportasi. Harga & durasi adalah estimasi simulasi.
 * availability: available | limited | scheduled | unavailable
 */
export const TRANSPORT_OPTIONS = [
  // ----------------------------- DARAT -----------------------------
  {
    id: 'truck-logistics',
    category: 'land',
    icon: '🚚',
    name: { id: 'Truk Logistik', en: 'Logistics Truck' },
    desc: {
      id: 'Truk bak/box untuk pengiriman antarkota dan penjemputan barang dari gudang UMKM.',
      en: 'Open/box truck for intercity delivery and pickup from MSME warehouses.',
    },
    capacityKg: 8000,
    capacityM3: 30,
    speedKph: 50,
    baseCostUSD: 35,
    costPerKg: 0.05,
    costPerM3: 1.2,
    fixedHours: 2,
    availability: 'available',
    color: '#d97706',
    coverage: { id: 'Lokal & antarkota', en: 'Local & intercity' },
  },
  {
    id: 'box-van',
    category: 'land',
    icon: '🚐',
    name: { id: 'Mobil Box', en: 'Box Van' },
    desc: {
      id: 'Mobil box tertutup untuk barang bernilai tinggi, mudah rusak, atau volume kecil.',
      en: 'Enclosed box van for high-value, fragile, or small-volume goods.',
    },
    capacityKg: 2000,
    capacityM3: 12,
    speedKph: 55,
    baseCostUSD: 24,
    costPerKg: 0.09,
    costPerM3: 1.8,
    fixedHours: 1,
    availability: 'available',
    color: '#ea580c',
    coverage: { id: 'Lokal & antarkota', en: 'Local & intercity' },
  },
  {
    id: 'land-container',
    category: 'land',
    icon: '🛻',
    name: { id: 'Kontainer Darat', en: 'Domestic Container' },
    desc: {
      id: 'Trailer 20ft/40ft untuk pengiriman jumlah besar dari gudang ke pelabuhan/stasiun.',
      en: '20ft/40ft trailer for large shipments from warehouse to port or station.',
    },
    capacityKg: 24000,
    capacityM3: 60,
    speedKph: 45,
    baseCostUSD: 120,
    costPerKg: 0.03,
    costPerM3: 0.9,
    fixedHours: 4,
    availability: 'limited',
    color: '#b45309',
    coverage: { id: 'Jawa, Sumatra, Sulawesi', en: 'Java, Sumatra, Sulawesi' },
  },
  {
    id: 'freight-train',
    category: 'land',
    icon: '🚆',
    name: { id: 'Kereta Api Barang', en: 'Freight Train' },
    desc: {
      id: 'Angkutan barang massal lintas Jawa dengan biaya lebih hemat untuk volume besar.',
      en: 'Bulk freight across Java with lower cost for large volumes.',
    },
    capacityKg: 20000,
    capacityM3: 50,
    speedKph: 45,
    baseCostUSD: 90,
    costPerKg: 0.018,
    costPerM3: 0.7,
    fixedHours: 5,
    availability: 'scheduled',
    color: '#047857',
    coverage: { id: 'Jalur kereta Jawa–Sumatra', en: 'Java–Sumatra rail corridor' },
  },
  {
    id: 'courier',
    category: 'land',
    icon: '📦',
    name: { id: 'Kurir Ekspedisi', en: 'Courier Service' },
    desc: {
      id: 'Pengiriman cepat door-to-door untuk paket kecil dan sampel produk.',
      en: 'Fast door-to-door delivery for small parcels and product samples.',
    },
    capacityKg: 50,
    capacityM3: 0.5,
    speedKph: 65,
    baseCostUSD: 6,
    costPerKg: 0.9,
    costPerM3: 4,
    fixedHours: 1,
    availability: 'available',
    color: '#0891b2',
    coverage: { id: 'Seluruh Indonesia', en: 'Nationwide Indonesia' },
  },
  {
    id: 'other-land',
    category: 'land',
    icon: '🚛',
    name: { id: 'Kendaraan Logistik Lainnya', en: 'Other Logistics Vehicle' },
    desc: {
      id: 'Kendaraan khusus seperti reefer, tangki, atau armada mitra sesuai kebutuhan.',
      en: 'Special vehicles such as reefers, tankers, or partner fleets as needed.',
    },
    capacityKg: 12000,
    capacityM3: 40,
    speedKph: 45,
    baseCostUSD: 80,
    costPerKg: 0.06,
    costPerM3: 1.5,
    fixedHours: 4,
    availability: 'limited',
    color: '#9333ea',
    coverage: { id: 'Sesuai mitra logistik', en: 'Based on logistics partner' },
  },

  // ----------------------------- LAUT -----------------------------
  {
    id: 'cargo-ship',
    category: 'sea',
    icon: '🚢',
    name: { id: 'Kapal Kargo', en: 'Cargo Ship' },
    desc: {
      id: 'Kapal kargo umum untuk barang curah, palet, dan muatan tidak berukuran kontainer.',
      en: 'General cargo vessel for bulk goods, pallets, and non-containerized freight.',
    },
    capacityKg: 120000,
    capacityM3: 300,
    speedKph: 30,
    baseCostUSD: 420,
    costPerKg: 0.012,
    costPerM3: 3.2,
    fixedHours: 36,
    availability: 'available',
    color: '#0ea5e9',
    coverage: { id: 'Antarpulau & internasional', en: 'Inter-island & international' },
  },
  {
    id: 'container-ship',
    category: 'sea',
    icon: '🛳️',
    name: { id: 'Kapal Kontainer', en: 'Container Ship' },
    desc: {
      id: 'Pengiriman FCL/LCL dengan jadwal rutin dan pelacakan kontainer per nomor.',
      en: 'FCL/LCL shipping with regular schedules and container-level tracking.',
    },
    capacityKg: 200000,
    capacityM3: 500,
    speedKph: 33,
    baseCostUSD: 480,
    costPerKg: 0.011,
    costPerM3: 2.8,
    fixedHours: 30,
    availability: 'available',
    color: '#0284c7',
    coverage: { id: 'Pelabuhan utama dunia', en: 'Major world ports' },
  },
  {
    id: 'interisland-ship',
    category: 'sea',
    icon: '⛴️',
    name: { id: 'Kapal Antarpulau', en: 'Inter-island Vessel' },
    desc: {
      id: 'Layanan reguler antarpulau untuk distribusi produk UMKM ke pembeli domestik.',
      en: 'Regular inter-island service for distributing MSME products to domestic buyers.',
    },
    capacityKg: 50000,
    capacityM3: 120,
    speedKph: 26,
    baseCostUSD: 180,
    costPerKg: 0.02,
    costPerM3: 4.5,
    fixedHours: 18,
    availability: 'available',
    color: '#38bdf8',
    coverage: { id: 'Nusantara', en: 'Indonesian archipelago' },
  },
  {
    id: 'international-ship',
    category: 'sea',
    icon: '🌊',
    name: { id: 'Kapal Internasional', en: 'International Liner' },
    desc: {
      id: 'Layanan ekspor-impor lintas negara dengan dokumen B/L dan kepabeanan.',
      en: 'Cross-border export-import service with B/L and customs documentation.',
    },
    capacityKg: 180000,
    capacityM3: 450,
    speedKph: 32,
    baseCostUSD: 650,
    costPerKg: 0.013,
    costPerM3: 3.6,
    fixedHours: 48,
    availability: 'scheduled',
    color: '#0369a1',
    coverage: { id: 'Asia, Eropa, Amerika, Australia', en: 'Asia, Europe, Americas, Australia' },
  },

  // ----------------------------- UDARA -----------------------------
  {
    id: 'cargo-plane',
    category: 'air',
    icon: '✈️',
    name: { id: 'Pesawat Kargo', en: 'Freight Aircraft' },
    desc: {
      id: 'Pesawat kargo khusus untuk barang bernilai tinggi dan pengiriman lintas negara.',
      en: 'Dedicated freighter aircraft for high-value cargo and cross-border shipping.',
    },
    capacityKg: 30000,
    capacityM3: 90,
    speedKph: 780,
    baseCostUSD: 320,
    costPerKg: 2.8,
    costPerM3: 14,
    fixedHours: 8,
    availability: 'limited',
    color: '#7c3aed',
    coverage: { id: 'Bandara internasional', en: 'International airports' },
  },
  {
    id: 'airline-cargo',
    category: 'air',
    icon: '🛫',
    name: { id: 'Kargo Maskapai', en: 'Airline Cargo' },
    desc: {
      id: 'Kapasitas kargo pada penerbangan penumpang dengan jadwal harian.',
      en: 'Cargo capacity on passenger flights with daily schedules.',
    },
    capacityKg: 8000,
    capacityM3: 25,
    speedKph: 820,
    baseCostUSD: 220,
    costPerKg: 3.4,
    costPerM3: 18,
    fixedHours: 6,
    availability: 'available',
    color: '#6d28d9',
    coverage: { id: 'Rute maskapai mitra', en: 'Partner airline routes' },
  },
  {
    id: 'air-urgent',
    category: 'air',
    icon: '🚀',
    name: { id: 'Pengiriman Udara Urgent', en: 'Urgent Air Delivery' },
    desc: {
      id: 'Prioritas tertinggi untuk sampel, dokumen, dan barang yang harus tiba secepatnya.',
      en: 'Highest priority for samples, documents, and time-critical goods.',
    },
    capacityKg: 1500,
    capacityM3: 5,
    speedKph: 850,
    baseCostUSD: 380,
    costPerKg: 5.2,
    costPerM3: 22,
    fixedHours: 3,
    availability: 'limited',
    color: '#a21caf',
    coverage: { id: 'Same-day / next-day', en: 'Same-day / next-day' },
  },
];

export const SERVICE_TYPES = [
  {
    id: 'local',
    icon: '🏙️',
    label: { id: 'Pengiriman Lokal', en: 'Local Delivery' },
    desc: {
      id: 'Dalam kota/provinsi yang sama. Contoh: UMKM → truk → gudang pembeli.',
      en: 'Within the same city/province. Example: MSME → truck → buyer warehouse.',
    },
  },
  {
    id: 'interisland',
    icon: '🏝️',
    label: { id: 'Antarpulau', en: 'Inter-island' },
    desc: {
      id: 'Lintas pulau domestik. Contoh: truk → pelabuhan → kapal → truk → pembeli.',
      en: 'Domestic cross-island. Example: truck → port → ship → truck → buyer.',
    },
  },
  {
    id: 'export',
    icon: '🌏',
    label: { id: 'Ekspor', en: 'Export' },
    desc: {
      id: 'Pengiriman ke luar negeri. Contoh: gudang → pelabuhan → kapal internasional → importir.',
      en: 'International outbound. Example: warehouse → port → international ship → importer.',
    },
  },
  {
    id: 'import',
    icon: '📥',
    label: { id: 'Impor', en: 'Import' },
    desc: {
      id: 'Barang masuk ke Indonesia. Contoh: kapal/pesawat → bea cukai → truk → gudang pembeli.',
      en: 'Inbound goods. Example: ship/aircraft → customs → truck → buyer warehouse.',
    },
  },
];

export const AVAILABILITY_META = {
  available: { color: '#059669', bg: '#ecfdf5', label: { id: 'Tersedia', en: 'Available' } },
  limited: { color: '#d97706', bg: '#fffbeb', label: { id: 'Terbatas', en: 'Limited' } },
  scheduled: { color: '#0284c7', bg: '#eff6ff', label: { id: 'Sesuai Jadwal', en: 'Scheduled' } },
  unavailable: { color: '#dc2626', bg: '#fef2f2', label: { id: 'Tidak Tersedia', en: 'Unavailable' } },
};

/** Helper singkat untuk memilih teks ID/EN dari objek label. */
export function trl(label, lang = 'id') {
  if (!label) return '';
  if (typeof label === 'string') return label;
  return label[lang] || label.id || label.en || '';
}

export function getOptionsByCategory(categoryId) {
  return TRANSPORT_OPTIONS.filter((option) => option.category === categoryId);
}

export function getOptionById(id) {
  return TRANSPORT_OPTIONS.find((option) => option.id === id) || null;
}

export function formatUSD(value) {
  return `USD ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatHours(hours, lang = 'id') {
  const total = Math.max(1, Math.round(hours));
  const isEn = lang === 'en';
  if (total < 24) return isEn ? `${total} hr` : `${total} jam`;
  const days = Math.floor(total / 24);
  const rest = total % 24;
  if (!rest) return isEn ? `${days} days` : `${days} hari`;
  return isEn ? `${days} d ${rest} hr` : `${days} hari ${rest} jam`;
}

export function formatEtaDate(hours, lang = 'id') {
  const date = new Date(Date.now() + Math.max(1, hours) * 3600 * 1000);
  return date.toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SERVICE_DISTANCE = {
  local: 45,
  interisland: 1450,
  export: 9800,
  import: 11200,
};

function estimateLeg(option, distanceKm, weightKg, volumeM3) {
  const distanceFactor = Math.max(0.6, distanceKm / 700);
  const loadFactor = Math.max(weightKg / 1000, volumeM3 / 10, 0.25);
  const cost =
    option.baseCostUSD +
    weightKg * option.costPerKg * distanceFactor +
    volumeM3 * option.costPerM3 * Math.max(1, loadFactor);
  const hours = option.fixedHours + distanceKm / option.speedKph;
  return {
    costUSD: Math.max(8, Math.round(cost)),
    hours,
  };
}

function makeLeg(option, from, to, distanceKm, weightKg, volumeM3, lang) {
  const estimate = estimateLeg(option, distanceKm, weightKg, volumeM3);
  return {
    optionId: option.id,
    category: option.category,
    icon: option.icon,
    name: trl(option.name, lang),
    from,
    to,
    distanceKm,
    costUSD: estimate.costUSD,
    hours: estimate.hours,
    color: option.color,
    availability: option.availability,
  };
}

const DEFAULT_PRIMARY = {
  land: 'truck-logistics',
  train: 'freight-train',
  sea: 'container-ship',
  air: 'cargo-plane',
};

/**
 * Membuat rekomendasi kombinasi transportasi multimoda.
 * Pengguna dapat memilih lebih dari satu moda; fungsi ini menyusun
 * beberapa alternatif rute beserta biaya, waktu, ETA, dan ketersediaan.
 */
export function buildTransportPlans({
  serviceType = 'local',
  origin = '',
  destination = '',
  weightKg = 1000,
  volumeM3 = 10,
  selectedIds = [],
  lang = 'id',
} = {}) {
  const safeWeight = Math.max(1, Number(weightKg) || 1);
  const safeVolume = Math.max(0.1, Number(volumeM3) || 0.1);
  const originLabel = origin.trim() || (lang === 'en' ? 'Seller warehouse' : 'Gudang penjual');
  const destLabel = destination.trim() || (lang === 'en' ? 'Buyer destination' : 'Lokasi pembeli');
  const selected = TRANSPORT_OPTIONS.filter((option) => selectedIds.includes(option.id));
  const picked = (category, fallbackId) =>
    selected.find((option) => option.category === category && option.id === fallbackId) ||
    selected.find((option) => option.category === category) ||
    getOptionById(fallbackId);

  const land = picked('land', DEFAULT_PRIMARY.land);
  const train = selected.find((option) => option.id === 'freight-train') || getOptionById(DEFAULT_PRIMARY.train);
  const sea = picked('sea', DEFAULT_PRIMARY.sea);
  const air = picked('air', DEFAULT_PRIMARY.air);
  const hasSea = selected.some((option) => option.category === 'sea');
  const hasAir = selected.some((option) => option.category === 'air');
  const hasTrain = selected.some((option) => option.id === 'freight-train');
  const hasLand = selected.some((option) => option.category === 'land');
  const distance = SERVICE_DISTANCE[serviceType] || SERVICE_DISTANCE.local;
  const plans = [];

  function pushPlan(config) {
    const legs = config.legs.filter(Boolean);
    if (!legs.length) return;
    const totalCostUSD = legs.reduce((sum, leg) => sum + leg.costUSD, 0);
    const totalHours = legs.reduce((sum, leg) => sum + leg.hours, 0);
    const availabilityRank = { available: 3, limited: 2, scheduled: 1, unavailable: 0 };
    const worstAvailability = legs.reduce(
      (worst, leg) =>
        availabilityRank[leg.availability] < availabilityRank[worst] ? leg.availability : worst,
      'available'
    );
    const plan = {
      id: config.id,
      title: config.title,
      subtitle: config.subtitle,
      serviceType,
      legs,
      totalCostUSD,
      totalHours,
      etaLabel: formatEtaDate(totalHours, lang),
      availability: worstAvailability,
      badge: config.badge,
      recommended: false,
      score: config.score + availabilityRank[worstAvailability] * 8,
    };
    plans.push(plan);
  }

  if (serviceType === 'local') {
    const landChoices = selected.filter((option) => option.category === 'land');
    const choices = landChoices.length ? landChoices : [land];
    choices.forEach((option, index) => {
      pushPlan({
        id: `local-${option.id}`,
        title: `Pengiriman Lokal via ${trl(option.name, lang)}`,
        subtitle:
          lang === 'en'
            ? 'Seller warehouse → vehicle → buyer warehouse, without port handling.'
            : 'Gudang penjual → kendaraan → gudang pembeli, tanpa proses pelabuhan.',
        badge: index === 0 ? (lang === 'en' ? 'Fastest local' : 'Lokal tercepat') : null,
        score: 80 - index * 4,
        legs: [makeLeg(option, originLabel, destLabel, distance, safeWeight, safeVolume, lang)],
      });
    });
  }

  if (serviceType === 'interisland') {
    pushPlan({
      id: 'interisland-sea',
      title: lang === 'en' ? 'Truck + Inter-island Ship + Truck' : 'Truk + Kapal Antarpulau + Truk',
      subtitle:
        lang === 'en'
          ? 'Domestic multimodal route through the nearest origin and destination ports.'
          : 'Rute multimoda domestik melalui pelabuhan asal dan pelabuhan tujuan terdekat.',
      badge: hasSea ? (lang === 'en' ? 'Selected sea mode' : 'Moda laut dipilih') : null,
      score: 90,
      legs: [
        makeLeg(land, originLabel, lang === 'en' ? 'Origin port' : 'Pelabuhan asal', 55, safeWeight, safeVolume, lang),
        makeLeg(sea, lang === 'en' ? 'Origin port' : 'Pelabuhan asal', lang === 'en' ? 'Destination port' : 'Pelabuhan tujuan', distance, safeWeight, safeVolume, lang),
        makeLeg(land, lang === 'en' ? 'Destination port' : 'Pelabuhan tujuan', destLabel, 45, safeWeight, safeVolume, lang),
      ],
    });

    pushPlan({
      id: 'interisland-rail',        title: lang === 'en' ? 'Truck + Freight Train + Truck' : 'Truk + Kereta Api Barang + Truk',
        subtitle:
          lang === 'en'
            ? 'Lower-cost rail corridor for bulky goods, with first/last-mile trucks.'
            : 'Rute kereta berbiaya lebih hemat untuk barang bervolume besar, plus truk first/last-mile.',
        badge: hasTrain ? (lang === 'en' ? 'Rail selected' : 'Kereta dipilih') : null,
        score: 84,
        legs: [
          makeLeg(land, originLabel, lang === 'en' ? 'Freight station' : 'Stasiun barang', 50, safeWeight, safeVolume, lang),
          makeLeg(train, lang === 'en' ? 'Freight station' : 'Stasiun barang', lang === 'en' ? 'Destination station' : 'Stasiun tujuan', Math.min(distance, 800), safeWeight, safeVolume, lang),
          makeLeg(land, lang === 'en' ? 'Destination station' : 'Stasiun tujuan', destLabel, 40, safeWeight, safeVolume, lang),
        ],
      });
    if (hasAir) {
      pushPlan({
        id: 'interisland-air',
        title: lang === 'en' ? 'Truck + Cargo Aircraft + Truck' : 'Truk + Pesawat Kargo + Truk',
        subtitle:
          lang === 'en'
            ? 'Air option for urgent domestic delivery between islands.'
            : 'Opsi udara untuk pengiriman antarpulau yang mendesak.',
        badge: lang === 'en' ? 'Urgent' : 'Urgensi tinggi',
        score: 72,
        legs: [
          makeLeg(land, originLabel, lang === 'en' ? 'Origin airport' : 'Bandara asal', 40, safeWeight, safeVolume, lang),
          makeLeg(air, lang === 'en' ? 'Origin airport' : 'Bandara asal', lang === 'en' ? 'Destination airport' : 'Bandara tujuan', Math.min(distance, 1800), safeWeight, safeVolume, lang),
          makeLeg(land, lang === 'en' ? 'Destination airport' : 'Bandara tujuan', destLabel, 35, safeWeight, safeVolume, lang),
        ],
      });
    }
  }

  if (serviceType === 'export') {
    pushPlan({
      id: 'export-sea',
      title: lang === 'en' ? 'Truck + International Container Ship + Truck' : 'Truk + Kapal Kontainer Internasional + Truk',
      subtitle:
        lang === 'en'
          ? 'Door-to-port export with B/L and destination inland delivery.'
          : 'Ekspor door-to-port dengan B/L dan pengantaran darat di negara tujuan.',
      badge: lang === 'en' ? 'Recommended export' : 'Rekomendasi ekspor',
      score: 92,
      legs: [
        makeLeg(land, originLabel, lang === 'en' ? 'Port of loading' : 'Pelabuhan muat', 120, safeWeight, safeVolume, lang),
        makeLeg(sea, lang === 'en' ? 'Port of loading' : 'Pelabuhan muat', lang === 'en' ? 'Destination port' : 'Pelabuhan tujuan', distance, safeWeight, safeVolume, lang),
        makeLeg(land, lang === 'en' ? 'Destination port' : 'Pelabuhan tujuan', destLabel, 150, safeWeight, safeVolume, lang),
      ],
    });

    pushPlan({
      id: 'export-air',
      title: lang === 'en' ? 'Truck + Freight Aircraft + Truck' : 'Truk + Pesawat Kargo + Truk',
      subtitle:
        lang === 'en'
          ? 'Fast export route for high-value or perishable goods.'
          : 'Rute ekspor cepat untuk barang bernilai tinggi atau mudah rusak.',
      badge: hasAir ? (lang === 'en' ? 'Selected air mode' : 'Moda udara dipilih') : null,
      score: 76,
      legs: [
        makeLeg(land, originLabel, lang === 'en' ? 'Origin airport' : 'Bandara asal', 80, safeWeight, safeVolume, lang),
        makeLeg(air, lang === 'en' ? 'Origin airport' : 'Bandara asal', lang === 'en' ? 'Destination airport' : 'Bandara tujuan', Math.min(distance, 9000), safeWeight, safeVolume, lang),
        makeLeg(land, lang === 'en' ? 'Destination airport' : 'Bandara tujuan', destLabel, 100, safeWeight, safeVolume, lang),
      ],
    });

    if (hasSea && hasAir) {
      pushPlan({
        id: 'export-sea-air',
        title: lang === 'en' ? 'Truck + Sea + Air Express + Truck' : 'Truk + Kapal + Udara Ekspres + Truk',
        subtitle:
          lang === 'en'
            ? 'Hybrid route: economical sea leg to a hub, then air express for the final leg.'
            : 'Rute hibrida: laut ekonomis ke hub, lalu udara ekspres untuk leg akhir.',
        badge: lang === 'en' ? 'Multimodal combination' : 'Kombinasi multimoda',
        score: 82,
        legs: [
          makeLeg(land, originLabel, lang === 'en' ? 'Port of loading' : 'Pelabuhan muat', 100, safeWeight, safeVolume, lang),
          makeLeg(sea, lang === 'en' ? 'Port of loading' : 'Pelabuhan muat', lang === 'en' ? 'Transit hub' : 'Hub transit', Math.min(distance, 6200), safeWeight, safeVolume, lang),
          makeLeg(air, lang === 'en' ? 'Transit hub' : 'Hub transit', lang === 'en' ? 'Destination airport' : 'Bandara tujuan', 2800, safeWeight, safeVolume, lang),
          makeLeg(land, lang === 'en' ? 'Destination airport' : 'Bandara tujuan', destLabel, 90, safeWeight, safeVolume, lang),
        ],
      });
    }
  }

  if (serviceType === 'import') {
    pushPlan({
      id: 'import-sea',
      title: lang === 'en' ? 'Ship + Customs Clearance + Truck' : 'Kapal + Kepabeanan + Truk',
      subtitle:
        lang === 'en'
          ? 'Inbound sea freight, customs inspection, then delivery to the buyer warehouse.'
          : 'Kargo laut masuk, pemeriksaan kepabeanan, lalu pengantaran ke gudang pembeli.',
      badge: lang === 'en' ? 'Recommended import' : 'Rekomendasi impor',
      score: 91,
      legs: [
        makeLeg(sea, lang === 'en' ? 'Origin port' : 'Pelabuhan asal', lang === 'en' ? 'Indonesian port' : 'Pelabuhan Indonesia', distance, safeWeight, safeVolume, lang),
        makeLeg(land, lang === 'en' ? 'Customs area' : 'Area kepabeanan', lang === 'en' ? 'Bonded warehouse' : 'Gudang berikat', 35, safeWeight, safeVolume, lang),
        makeLeg(land, lang === 'en' ? 'Bonded warehouse' : 'Gudang berikat', destLabel, 90, safeWeight, safeVolume, lang),
      ],
    });

    pushPlan({
      id: 'import-air',
      title: lang === 'en' ? 'Cargo Aircraft + Customs Clearance + Truck' : 'Pesawat Kargo + Kepabeanan + Truk',
      subtitle:
        lang === 'en'
          ? 'Faster import route for urgent or high-value goods.'
          : 'Rute impor lebih cepat untuk barang mendesak atau bernilai tinggi.',
      badge: hasAir ? (lang === 'en' ? 'Selected air mode' : 'Moda udara dipilih') : null,
      score: 78,
      legs: [
        makeLeg(air, lang === 'en' ? 'Origin airport' : 'Bandara asal', lang === 'en' ? 'Indonesian airport' : 'Bandara Indonesia', Math.min(distance, 9000), safeWeight, safeVolume, lang),
        makeLeg(land, lang === 'en' ? 'Customs area' : 'Area kepabeanan', lang === 'en' ? 'Bonded warehouse' : 'Gudang berikat', 30, safeWeight, safeVolume, lang),
        makeLeg(land, lang === 'en' ? 'Bonded warehouse' : 'Gudang berikat', destLabel, 80, safeWeight, safeVolume, lang),
      ],
    });

    if (hasSea && hasAir) {
      pushPlan({
        id: 'import-sea-air',
        title: lang === 'en' ? 'Ship + Hub Transfer + Air + Truck' : 'Kapal + Transit Hub + Udara + Truk',
        subtitle:
          lang === 'en'
            ? 'Combined sea and air import for a balance of cost and speed.'
            : 'Kombinasi laut dan udara untuk keseimbangan biaya dan kecepatan.',
        badge: lang === 'en' ? 'Multimodal combination' : 'Kombinasi multimoda',
        score: 81,
        legs: [
          makeLeg(sea, lang === 'en' ? 'Origin port' : 'Pelabuhan asal', lang === 'en' ? 'Transit hub' : 'Hub transit', 6800, safeWeight, safeVolume, lang),
          makeLeg(air, lang === 'en' ? 'Transit hub' : 'Hub transit', lang === 'en' ? 'Indonesian airport' : 'Bandara Indonesia', 2600, safeWeight, safeVolume, lang),
          makeLeg(land, lang === 'en' ? 'Customs area' : 'Area kepabeanan', lang === 'en' ? 'Bonded warehouse' : 'Gudang berikat', 30, safeWeight, safeVolume, lang),
          makeLeg(land, lang === 'en' ? 'Bonded warehouse' : 'Gudang berikat', destLabel, 80, safeWeight, safeVolume, lang),
        ],
      });
    }
  }

  // Jika pengguna hanya memilih moda tertentu, tandai rekomendasi terbaik.
  plans.sort((a, b) => b.score - a.score || a.totalCostUSD - b.totalCostUSD);
  if (plans[0]) plans[0].recommended = true;
  return plans.slice(0, 6);
}

/** Daftar 8 status pengiriman sesuai kebutuhan pelacakan. */
export const SHIPMENT_STATUSES = [
  {
    step: 1,
    key: 'received',
    icon: '📥',
    label: { id: 'Pesanan diterima', en: 'Order received' },
    desc: { id: 'Pesanan dikonfirmasi dan masuk sistem.', en: 'Order confirmed and recorded.' },
  },
  {
    step: 2,
    key: 'preparing',
    icon: '📦',
    label: { id: 'Persiapan barang', en: 'Preparing goods' },
    desc: { id: 'Barang dikemas, ditimbang, dan disiapkan.', en: 'Goods packed, weighed, and prepared.' },
  },
  {
    step: 3,
    key: 'pickup',
    icon: '🚚',
    label: { id: 'Penjemputan barang', en: 'Pickup' },
    desc: { id: 'Kurir/armada menjemput barang di lokasi penjual.', en: 'Courier/fleet picks up goods at the seller.' },
  },
  {
    step: 4,
    key: 'in-transit',
    icon: '🛣️',
    label: { id: 'Dalam perjalanan', en: 'In transit' },
    desc: { id: 'Barang bergerak menuju pelabuhan/bandara/tujuan.', en: 'Goods are moving to port, airport, or destination.' },
  },
  {
    step: 5,
    key: 'transit',
    icon: '🔁',
    label: { id: 'Transit / pergantian transportasi', en: 'Transit / mode change' },
    desc: { id: 'Barang berpindah moda atau menunggu jadwal lanjutan.', en: 'Goods change mode or wait for the next schedule.' },
  },
  {
    step: 6,
    key: 'arrived',
    icon: '📍',
    label: { id: 'Tiba di kota / negara tujuan', en: 'Arrived at destination' },
    desc: { id: 'Barang tiba di pelabuhan/bandara/kota tujuan.', en: 'Goods arrived at the destination port, airport, or city.' },
  },
  {
    step: 7,
    key: 'delivering',
    icon: '🚛',
    label: { id: 'Dalam proses pengantaran', en: 'Out for delivery' },
    desc: { id: 'Barang dalam perjalanan ke alamat pembeli.', en: 'Goods are on the way to the buyer address.' },
  },
  {
    step: 8,
    key: 'completed',
    icon: '✅',
    label: { id: 'Pesanan selesai', en: 'Order completed' },
    desc: { id: 'Barang diterima dan pesanan selesai.', en: 'Goods received and the order is complete.' },
  },
];

/**
 * Data pengiriman SIMULASI untuk halaman pelacakan.
 * Tidak ada koordinat GPS nyata. Nomor resi mengikuti format demo NusaBridge.
 */
export const SHIPMENTS = [
  {
    id: 'NB-SHP-2026-08421',
    resi: 'NB-EXP-08421-IDDE',
    product: 'Kopi Arabika Gayo Specialty Grade 1',
    productId: 'prod_kopi_001',
    seller: 'CV Kopi Nusantara Bersama',
    buyer: 'Hanseatic Coffee Importers GmbH',
    origin: 'Takengon, Aceh Tengah (ID)',
    destination: 'Hamburg (DE)',
    serviceType: 'export',
    weightKg: 20000,
    volumeM3: 42,
    currentStep: 4,
    progress: 68,
    statusText: { id: 'Dalam perjalanan menuju Hamburg', en: 'In transit to Hamburg' },
    eta: '24 Okt 2026, 09:00',
    lastUpdate: '02 Nov 2026, 08:40',
    modes: ['truck-logistics', 'container-ship', 'truck-logistics'],
    modeChanges: [
      { at: 'Tanjung Priok, Jakarta', from: 'Truk Logistik', to: 'Kapal Kontainer', time: '20 Okt 2026, 14:10' },
      { at: 'Port of Hamburg, DE', from: 'Kapal Kontainer', to: 'Truk Logistik', time: 'Perkiraan 24 Okt 2026' },
    ],
    segments: [
      { mode: 'land', icon: '🚚', label: { id: 'Truk Logistik', en: 'Logistics Truck' }, from: 'Takengon, Aceh', to: 'Pelabuhan Belawan / Tanjung Priok' },
      { mode: 'sea', icon: '🚢', label: { id: 'Kapal Kontainer', en: 'Container Ship' }, from: 'Tanjung Priok, Jakarta', to: 'Port of Hamburg, DE' },
      { mode: 'land', icon: '🚚', label: { id: 'Truk Logistik', en: 'Logistics Truck' }, from: 'Port of Hamburg, DE', to: 'Gudang pembeli, Hamburg' },
    ],
    history: [
      { time: '19 Okt 2026, 09:12', location: 'Takengon, Aceh', title: { id: 'Pesanan diterima', en: 'Order received' }, desc: { id: 'RFQ dan kontrak simulasi disetujui.', en: 'RFQ and simulated contract approved.' }, step: 1 },
      { time: '19 Okt 2026, 16:40', location: 'Gudang Kopi Nusantara', title: { id: 'Persiapan barang', en: 'Preparing goods' }, desc: { id: '20.000 kg kopi dikemas dalam 400 karung.', en: '20,000 kg of coffee packed into 400 bags.' }, step: 2 },
      { time: '20 Okt 2026, 07:25', location: 'Takengon, Aceh', title: { id: 'Penjemputan barang', en: 'Pickup' }, desc: { id: 'Barang dijemput truk logistik menuju pelabuhan.', en: 'Goods picked up by truck to the port.' }, step: 3 },
      { time: '20 Okt 2026, 14:10', location: 'Tanjung Priok, Jakarta', title: { id: 'Transit / pergantian transportasi', en: 'Transit / mode change' }, desc: { id: 'Barang dimuat ke kapal kontainer. Moda berubah dari truk ke kapal.', en: 'Goods loaded onto a container ship. Mode changes from truck to sea.' }, step: 5, modeChange: true },
      { time: '01 Nov 2026, 18:30', location: 'Samudra Hindia', title: { id: 'Dalam perjalanan', en: 'In transit' }, desc: { id: 'Kapal simulasi melanjutkan pelayaran menuju Hamburg.', en: 'Simulated vessel continues its voyage to Hamburg.' }, step: 4 },
    ],
  },
  {
    id: 'NB-SHP-2026-08117',
    resi: 'NB-DOM-08117-IDMS',
    product: 'Cengkeh Lalpari Maluku Ekspor',
    productId: 'prod_rempah_001',
    seller: 'Koperasi Rempah Nusantara',
    buyer: 'PT Nusantara Food Supply',
    origin: 'Ternate, Maluku Utara (ID)',
    destination: 'Makassar, Sulawesi Selatan (ID)',
    serviceType: 'interisland',
    weightKg: 5000,
    volumeM3: 14,
    currentStep: 6,
    progress: 56,
    statusText: { id: 'Tiba di Pelabuhan Makassar', en: 'Arrived at Makassar Port' },
    eta: '05 Nov 2026, 16:00',
    lastUpdate: '02 Nov 2026, 07:15',
    modes: ['truck-logistics', 'interisland-ship', 'truck-logistics'],
    modeChanges: [
      { at: 'Pelabuhan Ternate', from: 'Truk Logistik', to: 'Kapal Antarpulau', time: '29 Okt 2026, 10:20' },
      { at: 'Pelabuhan Makassar', from: 'Kapal Antarpulau', to: 'Truk Logistik', time: 'Perkiraan 04 Nov 2026' },
    ],
    segments: [
      { mode: 'land', icon: '🚚', label: { id: 'Truk Logistik', en: 'Logistics Truck' }, from: 'Gudang Ternate', to: 'Pelabuhan Ternate' },
      { mode: 'sea', icon: '⛴️', label: { id: 'Kapal Antarpulau', en: 'Inter-island Vessel' }, from: 'Pelabuhan Ternate', to: 'Pelabuhan Makassar' },
      { mode: 'land', icon: '🚚', label: { id: 'Truk Logistik', en: 'Logistics Truck' }, from: 'Pelabuhan Makassar', to: 'Gudang pembeli, Makassar' },
    ],
    history: [
      { time: '28 Okt 2026, 10:05', location: 'Ternate, Maluku Utara', title: { id: 'Pesanan diterima', en: 'Order received' }, desc: { id: 'Pesanan antarpulau dikonfirmasi.', en: 'Inter-island order confirmed.' }, step: 1 },
      { time: '28 Okt 2026, 15:35', location: 'Gudang Rempah Nusantara', title: { id: 'Persiapan barang', en: 'Preparing goods' }, desc: { id: 'Cengkeh disortir dan dikemas.', en: 'Cloves sorted and packed.' }, step: 2 },
      { time: '29 Okt 2026, 08:10', location: 'Ternate', title: { id: 'Penjemputan barang', en: 'Pickup' }, desc: { id: 'Barang dijemput menuju pelabuhan.', en: 'Goods picked up to the port.' }, step: 3 },
      { time: '29 Okt 2026, 10:20', location: 'Pelabuhan Ternate', title: { id: 'Transit / pergantian transportasi', en: 'Transit / mode change' }, desc: { id: 'Barang dimuat ke kapal antarpulau.', en: 'Goods loaded onto the inter-island vessel.' }, step: 5, modeChange: true },
      { time: '02 Nov 2026, 07:15', location: 'Pelabuhan Makassar', title: { id: 'Tiba di kota tujuan', en: 'Arrived at destination' }, desc: { id: 'Kapal sandar, barang menunggu proses bongkar.', en: 'Vessel docked, goods awaiting unloading.' }, step: 6 },
    ],
  },
  {
    id: 'NB-SHP-2026-07903',
    resi: 'NB-AIR-07903-IDJP',
    product: 'Tenun Ikat Sumba Premium',
    productId: 'prod_tekstil_001',
    seller: 'UMKM Tenun Sumba Lestari',
    buyer: 'Kyoto Craft Gallery Co., Ltd.',
    origin: 'Waingapu, Sumba Timur (ID)',
    destination: 'Kyoto (JP)',
    serviceType: 'export',
    weightKg: 120,
    volumeM3: 1.8,
    currentStep: 7,
    progress: 88,
    statusText: { id: 'Dalam pengantaran ke galeri pembeli', en: 'Out for delivery to the buyer gallery' },
    eta: '03 Nov 2026, 11:30',
    lastUpdate: '02 Nov 2026, 06:50',
    modes: ['box-van', 'cargo-plane', 'box-van'],
    modeChanges: [
      { at: 'Bandara Soekarno-Hatta', from: 'Mobil Box', to: 'Pesawat Kargo', time: '30 Okt 2026, 21:10' },
      { at: 'Bandara Kansai, Jepang', from: 'Pesawat Kargo', to: 'Mobil Box', time: '02 Nov 2026, 04:40' },
    ],
    segments: [
      { mode: 'land', icon: '🚐', label: { id: 'Mobil Box', en: 'Box Van' }, from: 'Waingapu, Sumba', to: 'Bandara Soekarno-Hatta' },
      { mode: 'air', icon: '✈️', label: { id: 'Pesawat Kargo', en: 'Freight Aircraft' }, from: 'Jakarta, ID', to: 'Osaka / Kyoto, JP' },
      { mode: 'land', icon: '🚐', label: { id: 'Mobil Box', en: 'Box Van' }, from: 'Bandara Kansai, JP', to: 'Kyoto Craft Gallery' },
    ],
    history: [
      { time: '29 Okt 2026, 09:00', location: 'Waingapu, Sumba', title: { id: 'Pesanan diterima', en: 'Order received' }, desc: { id: 'Pesanan ekspor kain tenun dikonfirmasi.', en: 'Woven fabric export order confirmed.' }, step: 1 },
      { time: '29 Okt 2026, 14:20', location: 'Gudang Tenun Sumba', title: { id: 'Persiapan barang', en: 'Preparing goods' }, desc: { id: 'Kain dilipat, diberi pelindung, dan dikemas.', en: 'Fabrics folded, protected, and packed.' }, step: 2 },
      { time: '30 Okt 2026, 08:15', location: 'Waingapu', title: { id: 'Penjemputan barang', en: 'Pickup' }, desc: { id: 'Barang dijemput mobil box menuju Jakarta.', en: 'Goods picked up by box van to Jakarta.' }, step: 3 },
      { time: '30 Okt 2026, 21:10', location: 'Bandara Soekarno-Hatta', title: { id: 'Transit / pergantian transportasi', en: 'Transit / mode change' }, desc: { id: 'Barang dimuat ke pesawat kargo. Moda berubah dari darat ke udara.', en: 'Goods loaded onto freighter aircraft. Mode changes from land to air.' }, step: 5, modeChange: true },
      { time: '02 Nov 2026, 04:40', location: 'Bandara Kansai, Jepang', title: { id: 'Tiba di negara tujuan', en: 'Arrived at destination country' }, desc: { id: 'Barang tiba dan lolos pemeriksaan dokumen simulasi.', en: 'Goods arrived and passed simulated document checks.' }, step: 6 },
      { time: '02 Nov 2026, 06:50', location: 'Kyoto, Jepang', title: { id: 'Dalam proses pengantaran', en: 'Out for delivery' }, desc: { id: 'Barang dalam perjalanan ke galeri pembeli.', en: 'Goods are on the way to the buyer gallery.' }, step: 7 },
    ],
  },
  {
    id: 'NB-SHP-2026-08600',
    resi: 'NB-LOC-08600-IDJK',
    product: 'Set Kursi & Meja Rotan Cirebon',
    productId: 'prod_kriya_001',
    seller: 'CV Rotan Cirebon Kriya',
    buyer: 'Hotel Nusa Indah Jakarta',
    origin: 'Cirebon, Jawa Barat (ID)',
    destination: 'Jakarta Selatan (ID)',
    serviceType: 'local',
    weightKg: 850,
    volumeM3: 9,
    currentStep: 8,
    progress: 100,
    statusText: { id: 'Pesanan selesai diterima pembeli', en: 'Order completed and received by buyer' },
    eta: '01 Nov 2026, 15:20',
    lastUpdate: '01 Nov 2026, 15:20',
    modes: ['land-container', 'box-van'],
    modeChanges: [
      { at: 'Gudang Cirebon', from: 'Kontainer Darat', to: 'Mobil Box', time: '01 Nov 2026, 10:15' },
    ],
    segments: [
      { mode: 'land', icon: '🛻', label: { id: 'Kontainer Darat', en: 'Domestic Container' }, from: 'Gudang Cirebon', to: 'Hub Jakarta' },
      { mode: 'land', icon: '🚐', label: { id: 'Mobil Box', en: 'Box Van' }, from: 'Hub Jakarta', to: 'Hotel Nusa Indah, Jakarta' },
    ],
    history: [
      { time: '31 Okt 2026, 09:30', location: 'Cirebon, Jawa Barat', title: { id: 'Pesanan diterima', en: 'Order received' }, desc: { id: 'Pesanan lokal dikonfirmasi.', en: 'Local order confirmed.' }, step: 1 },
      { time: '31 Okt 2026, 13:10', location: 'Gudang Cirebon', title: { id: 'Persiapan barang', en: 'Preparing goods' }, desc: { id: 'Furnitur dilindungi dan dimuat.', en: 'Furniture protected and loaded.' }, step: 2 },
      { time: '01 Nov 2026, 07:45', location: 'Cirebon', title: { id: 'Penjemputan barang', en: 'Pickup' }, desc: { id: 'Barang dijemput kontainer darat.', en: 'Goods picked up by domestic container.' }, step: 3 },
      { time: '01 Nov 2026, 10:15', location: 'Hub Jakarta', title: { id: 'Transit / pergantian transportasi', en: 'Transit / mode change' }, desc: { id: 'Barang dipindahkan ke mobil box untuk pengantaran akhir.', en: 'Goods transferred to a box van for final delivery.' }, step: 5, modeChange: true },
      { time: '01 Nov 2026, 15:20', location: 'Jakarta Selatan', title: { id: 'Pesanan selesai', en: 'Order completed' }, desc: { id: 'Barang diterima pembeli. Pesanan selesai.', en: 'Goods received by buyer. Order completed.' }, step: 8 },
    ],
  },
];

export function getShipmentById(id) {
  return SHIPMENTS.find((shipment) => shipment.id === id || shipment.resi === id) || null;
}

/** Statistik ringkas dashboard logistik (simulasi). */
export const LOGISTICS_SUMMARY = {
  activeShipments: 3,
  completedShipments: 1,
  modeBreakdown: [
    { category: 'land', count: 4, label: { id: 'Darat', en: 'Land' } },
    { category: 'sea', count: 2, label: { id: 'Laut', en: 'Sea' } },
    { category: 'air', count: 1, label: { id: 'Udara', en: 'Air' } },
  ],
};
