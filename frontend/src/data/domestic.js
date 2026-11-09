/**
 * ==========================================================================
 * NUSABRIDGE - DATA PERDAGANGAN DOMESTIK UMKM
 * File: src/data/domestic.js
 *
 * Dipakai halaman /domestik agar UMKM Indonesia bisa:
 * - menjual produk ke pembeli lokal / antarpulau (harga IDR), dan
 * - membeli produk UMKM lain tanpa harus ekspor.
 *
 * Data di sini adalah data demo. Saat Supabase aktif, tabel
 * trade_regions, trade_ports, product_offers, dan trade_orders
 * menjadi sumber data sebenarnya (lihat backend/database/domestic-trade.sql).
 * ==========================================================================
 */

import { PRODUCTS_DATA } from './products.js';
import { localizeProductName, localizeProductDesc } from './productTranslations.js';

export const PROVINCES = [
  { id: 'aceh', name: 'Aceh', island: 'Sumatera' },
  { id: 'sumut', name: 'Sumatera Utara', island: 'Sumatera' },
  { id: 'sumbar', name: 'Sumatera Barat', island: 'Sumatera' },
  { id: 'riau', name: 'Riau', island: 'Sumatera' },
  { id: 'kepri', name: 'Kepulauan Riau', island: 'Sumatera' },
  { id: 'jambi', name: 'Jambi', island: 'Sumatera' },
  { id: 'sumsel', name: 'Sumatera Selatan', island: 'Sumatera' },
  { id: 'babel', name: 'Bangka Belitung', island: 'Sumatera' },
  { id: 'bengkulu', name: 'Bengkulu', island: 'Sumatera' },
  { id: 'lampung', name: 'Lampung', island: 'Sumatera' },
  { id: 'jakarta', name: 'DKI Jakarta', island: 'Jawa' },
  { id: 'jabar', name: 'Jawa Barat', island: 'Jawa' },
  { id: 'banten', name: 'Banten', island: 'Jawa' },
  { id: 'jateng', name: 'Jawa Tengah', island: 'Jawa' },
  { id: 'diy', name: 'DI Yogyakarta', island: 'Jawa' },
  { id: 'jatim', name: 'Jawa Timur', island: 'Jawa' },
  { id: 'bali', name: 'Bali', island: 'Bali' },
  { id: 'ntb', name: 'Nusa Tenggara Barat', island: 'Nusa Tenggara' },
  { id: 'ntt', name: 'Nusa Tenggara Timur', island: 'Nusa Tenggara' },
  { id: 'kalbar', name: 'Kalimantan Barat', island: 'Kalimantan' },
  { id: 'kalteng', name: 'Kalimantan Tengah', island: 'Kalimantan' },
  { id: 'kalsel', name: 'Kalimantan Selatan', island: 'Kalimantan' },
  { id: 'kaltim', name: 'Kalimantan Timur', island: 'Kalimantan' },
  { id: 'kaltara', name: 'Kalimantan Utara', island: 'Kalimantan' },
  { id: 'sulut', name: 'Sulawesi Utara', island: 'Sulawesi' },
  { id: 'gorontalo', name: 'Gorontalo', island: 'Sulawesi' },
  { id: 'sulteng', name: 'Sulawesi Tengah', island: 'Sulawesi' },
  { id: 'sulbar', name: 'Sulawesi Barat', island: 'Sulawesi' },
  { id: 'sulsel', name: 'Sulawesi Selatan', island: 'Sulawesi' },
  { id: 'sultra', name: 'Sulawesi Tenggara', island: 'Sulawesi' },
  { id: 'maluku', name: 'Maluku', island: 'Maluku' },
  { id: 'malut', name: 'Maluku Utara', island: 'Maluku' },
  { id: 'papua', name: 'Papua', island: 'Papua' },
  { id: 'papuabarat', name: 'Papua Barat', island: 'Papua' },
];

export const CITIES = [
  { id: 'banda-aceh', name: 'Banda Aceh', provinceId: 'aceh' },
  { id: 'medan', name: 'Medan', provinceId: 'sumut' },
  { id: 'padang', name: 'Padang', provinceId: 'sumbar' },
  { id: 'pekanbaru', name: 'Pekanbaru', provinceId: 'riau' },
  { id: 'jambi', name: 'Jambi', provinceId: 'jambi' },
  { id: 'palembang', name: 'Palembang', provinceId: 'sumsel' },
  { id: 'pangkal-pinang', name: 'Pangkal Pinang', provinceId: 'babel' },
  { id: 'bengkulu', name: 'Bengkulu', provinceId: 'bengkulu' },
  { id: 'bandar-lampung', name: 'Bandar Lampung', provinceId: 'lampung' },
  { id: 'jakarta', name: 'Jakarta', provinceId: 'jakarta' },
  { id: 'bandung', name: 'Bandung', provinceId: 'jabar' },
  { id: 'serang', name: 'Serang', provinceId: 'banten' },
  { id: 'semarang', name: 'Semarang', provinceId: 'jateng' },
  { id: 'yogyakarta', name: 'Yogyakarta', provinceId: 'diy' },
  { id: 'surabaya', name: 'Surabaya', provinceId: 'jatim' },
  { id: 'malang', name: 'Malang', provinceId: 'jatim' },
  { id: 'denpasar', name: 'Denpasar', provinceId: 'bali' },
  { id: 'mataram', name: 'Mataram', provinceId: 'ntb' },
  { id: 'kupang', name: 'Kupang', provinceId: 'ntt' },
  { id: 'pontianak', name: 'Pontianak', provinceId: 'kalbar' },
  { id: 'banjarmasin', name: 'Banjarmasin', provinceId: 'kalsel' },
  { id: 'palangka-raya', name: 'Palangka Raya', provinceId: 'kalteng' },
  { id: 'samarinda', name: 'Samarinda', provinceId: 'kaltim' },
  { id: 'balikpapan', name: 'Balikpapan', provinceId: 'kaltim' },
  { id: 'tarakan', name: 'Tarakan', provinceId: 'kaltara' },
  { id: 'manado', name: 'Manado', provinceId: 'sulut' },
  { id: 'gorontalo', name: 'Gorontalo', provinceId: 'gorontalo' },
  { id: 'palu', name: 'Palu', provinceId: 'sulteng' },
  { id: 'mamuju', name: 'Mamuju', provinceId: 'sulbar' },
  { id: 'makassar', name: 'Makassar', provinceId: 'sulsel' },
  { id: 'kendari', name: 'Kendari', provinceId: 'sultra' },
  { id: 'ambon', name: 'Ambon', provinceId: 'maluku' },
  { id: 'ternate', name: 'Ternate', provinceId: 'malut' },
  { id: 'jayapura', name: 'Jayapura', provinceId: 'papua' },
  { id: 'sorong', name: 'Sorong', provinceId: 'papuabarat' },
];

export const DOMESTIC_SELLERS = [
  'CV Kopi Nusantara Gayo',
  'UD Rempah Banda Nira',
  'Kriya Rotan Cirebon',
  'Tenun Ikat Sumba Mandiri',
  'Koperasi Kopi Toraja',
  'Batik Lasem Lestari',
  'Anyaman Pandan Lombok',
  'Songket Palembang Sriwijaya',
  'Keramik Kasongan Jaya',
  'UKM Vanili Alor',
  'Gula Aren Banyumas',
  'Madu Hutan Sumbawa',
];

const SELLERS_BY_CATEGORY = {
  kopi: ['CV Kopi Nusantara Gayo', 'Koperasi Kopi Toraja', 'UD Kopi Lampung'],
  rempah: ['UD Rempah Banda Nira', 'UKM Vanili Alor', 'Gula Aren Banyumas', 'Madu Hutan Sumbawa'],
  kriya: ['Kriya Rotan Cirebon', 'Keramik Kasongan Jaya', 'Anyaman Pandan Lombok'],
  tekstil: ['Tenun Ikat Sumba Mandiri', 'Batik Lasem Lestari', 'Songket Palembang Sriwijaya'],
};

const PROVINCE_EN = {
  aceh: 'Aceh',
  sumut: 'North Sumatra',
  sumbar: 'West Sumatra',
  riau: 'Riau',
  kepri: 'Riau Islands',
  jambi: 'Jambi',
  sumsel: 'South Sumatra',
  babel: 'Bangka Belitung',
  bengkulu: 'Bengkulu',
  lampung: 'Lampung',
  jakarta: 'DKI Jakarta',
  jabar: 'West Java',
  banten: 'Banten',
  jateng: 'Central Java',
  diy: 'Special Region of Yogyakarta',
  jatim: 'East Java',
  bali: 'Bali',
  ntb: 'West Nusa Tenggara',
  ntt: 'East Nusa Tenggara',
  kalbar: 'West Kalimantan',
  kalteng: 'Central Kalimantan',
  kalsel: 'South Kalimantan',
  kaltim: 'East Kalimantan',
  kaltara: 'North Kalimantan',
  sulut: 'North Sulawesi',
  gorontalo: 'Gorontalo',
  sulteng: 'Central Sulawesi',
  sulbar: 'West Sulawesi',
  sulsel: 'South Sulawesi',
  sultra: 'Southeast Sulawesi',
  maluku: 'Maluku',
  malut: 'North Maluku',
  papua: 'Papua',
  papuabarat: 'West Papua',
};

const ISLAND_EN = {
  Sumatera: 'Sumatra',
  Jawa: 'Java',
  Bali: 'Bali',
  'Nusa Tenggara': 'Nusa Tenggara',
  Kalimantan: 'Kalimantan',
  Sulawesi: 'Sulawesi',
  Maluku: 'Maluku',
  Papua: 'Papua',
};

export function provinceName(provinceId, lang = 'id') {
  const province = getProvince(provinceId);
  if (lang !== 'en') return province.name;
  return PROVINCE_EN[province.id] || province.name;
}

export function islandName(island, lang = 'id') {
  if (!island) return '';
  return lang === 'en' ? (ISLAND_EN[island] || island) : island;
}

function pickSeller(category, index) {
  const pool = SELLERS_BY_CATEGORY[category] || DOMESTIC_SELLERS;
  return pool[index % pool.length];
}

export const SHIPPING_OPTIONS = [
  {
    id: 'local',
    label: { id: 'Kurir Lokal (1–2 hari)', en: 'Local Courier (1–2 days)' },
    note: { id: 'Dalam pulau yang sama', en: 'Same island' },
    base: 12000,
    perKg: 2500,
    days: 2,
  },
  {
    id: 'interisland',
    label: { id: 'Kargo Antarpulau (3–7 hari)', en: 'Inter-island Cargo (3–7 days)' },
    note: { id: 'Truk + kapal + truk', en: 'Truck + ship + truck' },
    base: 38000,
    perKg: 5200,
    days: 6,
  },
  {
    id: 'cargo',
    label: { id: 'Kargo Darat Cepat (2–4 hari)', en: 'Express Land Cargo (2–4 days)' },
    note: { id: 'Untuk pulau yang terhubung darat', en: 'For land-connected islands' },
    base: 24000,
    perKg: 3600,
    days: 3,
  },
];

export const PAYMENT_OPTIONS = [
  {
    id: 'escrow',
    label: { id: 'Escrow NusaBridge (aman)', en: 'NusaBridge Escrow (safe)' },
    note: { id: 'Dana ditahan sampai barang diterima', en: 'Funds held until delivery' },
  },
  {
    id: 'transfer',
    label: { id: 'Transfer Bank / Virtual Account', en: 'Bank Transfer / Virtual Account' },
    note: { id: 'Bukti transfer diunggah penjual', en: 'Transfer proof uploaded by seller' },
  },
  {
    id: 'qris',
    label: { id: 'QRIS', en: 'QRIS' },
    note: { id: 'Bayar dari e-wallet atau mobile banking', en: 'Pay from e-wallet or mobile banking' },
  },
];

export const DOMESTIC_COMPLIANCE = [
  { id: 'sni', label: 'SNI / Standar Nasional Indonesia', note: 'Untuk produk yang wajib SNI.' },
  { id: 'bpom', label: 'BPOM / Izin Edar', note: 'Untuk pangan, kosmetik, dan obat.' },
  { id: 'halal', label: 'Halal BPJPH', note: 'Untuk produk pangan dan konsumen.' },
  { id: 'nib', label: 'NIB & NPWP aktif', note: 'Legalitas dasar pelaku usaha.' },
  { id: 'karantina', label: 'Karantina Pertanian', note: 'Untuk komoditas pertanian antarpulau.' },
];

const ORIGIN_RULES = [
  { keys: ['Aceh'], provinceId: 'aceh', city: 'Banda Aceh' },
  { keys: ['Sumatera Utara', 'Samosir', 'Mandailing', 'Lintong'], provinceId: 'sumut', city: 'Medan' },
  { keys: ['Sumatera Barat', 'Tanah Datar', 'Pandai Sikek'], provinceId: 'sumbar', city: 'Padang' },
  { keys: ['Jambi', 'Kerinci'], provinceId: 'jambi', city: 'Jambi' },
  { keys: ['Sumatera Selatan', 'Palembang'], provinceId: 'sumsel', city: 'Palembang' },
  { keys: ['Bangka Belitung', 'Muntok'], provinceId: 'babel', city: 'Pangkal Pinang' },
  { keys: ['Lampung'], provinceId: 'lampung', city: 'Bandar Lampung' },
  { keys: ['Jawa Barat', 'Bandung', 'Cirebon', 'Garut', 'Tasikmalaya', 'Pangalengan'], provinceId: 'jabar', city: 'Bandung' },
  { keys: ['Jawa Tengah', 'Temanggung', 'Banyumas', 'Jepara', 'Klaten', 'Solo', 'Pekalongan', 'Lasem', 'Rembang', 'Kebumen'], provinceId: 'jateng', city: 'Semarang' },
  { keys: ['Yogyakarta', 'Bantul', 'Sleman', 'Kulon Progo', 'Kasongan', 'Imogiri'], provinceId: 'diy', city: 'Yogyakarta' },
  { keys: ['Jawa Timur', 'Bondowoso', 'Banyuwangi', 'Madura', 'Bangkalan'], provinceId: 'jatim', city: 'Surabaya' },
  { keys: ['Bali', 'Bangli', 'Kintamani', 'Gianyar'], provinceId: 'bali', city: 'Denpasar' },
  { keys: ['Lombok', 'Nusa Tenggara Barat'], provinceId: 'ntb', city: 'Mataram' },
  { keys: ['Nusa Tenggara Timur', 'Sumba', 'Flores', 'Ende'], provinceId: 'ntt', city: 'Kupang' },
  { keys: ['Sulawesi Selatan', 'Toraja'], provinceId: 'sulsel', city: 'Makassar' },
  { keys: ['Sulawesi Tenggara', 'Konawe'], provinceId: 'sultra', city: 'Kendari' },
  { keys: ['Maluku', 'Ambon', 'Banda'], provinceId: 'maluku', city: 'Ambon' },
  { keys: ['Papua', 'Jayapura', 'Biak'], provinceId: 'papua', city: 'Jayapura' },
];

export function formatIDR(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function getProvince(provinceId) {
  return PROVINCES.find((p) => p.id === provinceId) || PROVINCES[0];
}

export function getCity(cityId) {
  return CITIES.find((c) => c.id === cityId) || CITIES[0];
}

export function getIslandForProvince(provinceId) {
  return getProvince(provinceId).island;
}

export function parseOrigin(origin = '') {
  const text = String(origin);
  const rule = ORIGIN_RULES.find((r) => r.keys.some((k) => text.toLowerCase().includes(k.toLowerCase())));
  if (rule) {
    return {
      provinceId: rule.provinceId,
      province: getProvince(rule.provinceId).name,
      city: rule.city,
      island: getProvince(rule.provinceId).island,
    };
  }
  return { provinceId: 'jabar', province: 'Jawa Barat', city: 'Bandung', island: 'Jawa' };
}

export function estimateWeightKg(unit, quantity) {
  const unitText = String(unit || '').toLowerCase();
  const qty = Number(quantity) || 0;
  if (unitText.includes('kg')) return qty;
  if (unitText.includes('ton')) return qty * 1000;
  if (unitText.includes('liter') || unitText.includes('l')) return qty;
  return qty * 2;
}

function toIDR(usd) {
  return Math.max(1000, Math.round((Number(usd) * 16000) / 500) * 500);
}

export function buildDomesticOffers(products = PRODUCTS_DATA, extraListings = []) {
  const base = products.map((product, index) => {
    const origin = parseOrigin(product.origin);
    return {
      id: `dom_${product.id}`,
      productId: product.id,
      name: product.name,
      nameEn: localizeProductName(product, 'en'),
      category: product.category,
      image: product.image || '/assets/products/kopi-1.webp',
      priceIdr: toIDR(product.price),
      priceUsd: Number(product.price) || 0,
      unit: product.unit || 'Kg',
      moq: Number(product.moq) || 1,
      stock: 300 + ((index * 173) % 2700),
      sold: 12 + ((index * 37) % 480),
      rating: 4.5 + ((index * 7) % 5) / 10,
      origin: product.origin,
      provinceId: origin.provinceId,
      province: origin.province,
      provinceEn: PROVINCE_EN[origin.provinceId] || origin.province,
      city: origin.city,
      island: origin.island,
      islandEn: ISLAND_EN[origin.island] || origin.island,
      seller: pickSeller(product.category, index),
      leadTimeDays: 3 + (index % 5),
      description: product.desc || 'Produk UMKM Indonesia siap kirim ke seluruh Nusantara.',
      descriptionEn: localizeProductDesc(product, 'en') || 'Indonesian SME product ready to ship across the archipelago.',
      specs: product.specs || [],
      certs: product.certs || [],
      isCustom: false,
    };
  });

  const custom = extraListings.map((item, index) => {
    const origin = parseOrigin(item.origin);
    return {
      id: item.id || `seller_${index}`,
      productId: item.id,
      name: item.name,
      nameEn: item.name,
      category: item.category || 'kriya',
      image: item.image || '/assets/products/kopi-1.webp',
      priceIdr: Number(item.priceIdr) || 0,
      priceUsd: 0,
      unit: item.unit || 'Pcs',
      moq: Number(item.moq) || 1,
      stock: Number(item.stock) || 0,
      sold: 0,
      rating: 5,
      origin: item.origin || 'Bandung, Jawa Barat',
      provinceId: origin.provinceId,
      province: origin.province,
      provinceEn: PROVINCE_EN[origin.provinceId] || origin.province,
      city: origin.city,
      island: origin.island,
      islandEn: ISLAND_EN[origin.island] || origin.island,
      seller: item.seller || 'UMKM Baru',
      leadTimeDays: 3,
      description: item.description || 'Produk baru dari UMKM Indonesia.',
      descriptionEn: item.description || 'A new product from an Indonesian SME.',
      specs: [],
      certs: item.certs || [],
      isCustom: true,
    };
  });

  return [...custom, ...base];
}

export function getShippingQuote({ fromIsland, toCityId, weightKg, method }) {
  const destination = getCity(toCityId);
  const toIsland = getIslandForProvince(destination.provinceId);
  const sameIsland = fromIsland === toIsland;
  const option =
    SHIPPING_OPTIONS.find((o) => o.id === method) ||
    (sameIsland ? SHIPPING_OPTIONS[0] : SHIPPING_OPTIONS[1]);

  const base = sameIsland && option.id === 'interisland' ? SHIPPING_OPTIONS[0].base : option.base;
  const perKg = sameIsland && option.id === 'interisland' ? SHIPPING_OPTIONS[0].perKg : option.perKg;
  const cost = Math.round((base + perKg * Math.max(1, Number(weightKg) || 1)) / 500) * 500;
  const days = sameIsland ? Math.min(option.days, 3) : option.days;

  return {
    option,
    cost,
    days,
    sameIsland,
    toCity: destination.name,
    toIsland,
  };
}

export function calcOrderTotals({ offer, quantity, toCityId, shippingMethod }) {
  const qty = Math.max(1, Number(quantity) || 1);
  const weightKg = estimateWeightKg(offer.unit, qty);
  const shipping = getShippingQuote({
    fromIsland: offer.island,
    toCityId,
    weightKg,
    method: shippingMethod,
  });
  const subtotal = Math.round((Number(offer.priceIdr) * qty) / 500) * 500;
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + shipping.cost + tax;

  return {
    quantity: qty,
    weightKg,
    subtotal,
    shippingCost: shipping.cost,
    shippingDays: shipping.days,
    sameIsland: shipping.sameIsland,
    tax,
    total,
  };
}

export function makeOrderNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DOM-${y}${m}${d}-${rand}`;
}

export function makeEscrowStages(total) {
  return [
    { stage: 1, pct: 30, label: 'Pesanan dikonfirmasi', amount: Math.round(total * 0.3), status: 'pending' },
    { stage: 2, pct: 30, label: 'Barang siap / surat jalan terbit', amount: Math.round(total * 0.3), status: 'pending' },
    { stage: 3, pct: 20, label: 'Barang dalam perjalanan', amount: Math.round(total * 0.2), status: 'pending' },
    { stage: 4, pct: 20, label: 'Barang diterima pembeli', amount: Math.round(total * 0.2), status: 'pending' },
  ];
}

export const DOMESTIC_STATUS_FLOW = [
  'Menunggu Pembayaran',
  'Dibayar',
  'Diproses',
  'Dikirim',
  'Selesai',
];

export function nextStatus(status) {
  const index = DOMESTIC_STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= DOMESTIC_STATUS_FLOW.length - 1) return status;
  return DOMESTIC_STATUS_FLOW[index + 1];
}

export function statusTone(status) {
  if (status === 'Selesai') return 'done';
  if (status === 'Dikirim') return 'ship';
  if (status === 'Diproses' || status === 'Dibayar') return 'process';
  return 'wait';
}
