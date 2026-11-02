/**
 * ==========================================================================
 * NUSABRIDGE - LAPISAN INTEGRASI API LOGISTIK (DENGAN FALLBACK SIMULASI)
 * File: utils/logisticsApi.js
 *
 * Kontrak API yang disiapkan (dapat dihubungkan ke penyedia ekspedisi/GPS):
 *   GET  /api/logistics/shipments          -> { success, data: Shipment[] }
 *   GET  /api/logistics/shipments/:id      -> { success, data: Shipment }
 *   POST /api/logistics/quote              -> { success, data: TransportPlan[] }
 *
 * Selama API belum tersedia, seluruh fungsi mengembalikan data simulasi
 * dari data/logistics.js. Tidak ada klaim GPS atau status pengiriman nyata.
 * ==========================================================================
 */

import {
  SHIPMENTS,
  buildTransportPlans,
  getShipmentById,
} from '../data/logistics.js';

const API_BASE = (import.meta.env.VITE_LOGISTICS_API_URL || '/api/logistics').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 1800;

async function request(path, fallback, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (payload && payload.success && payload.data !== undefined) return payload.data;
    return fallback;
  } catch (_) {
    // API eksternal belum tersedia -> gunakan data simulasi lokal.
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

export const LOGISTICS_DATA_SOURCE = {
  mode: 'simulation',
  note: 'Data biaya, ETA, ketersediaan, dan riwayat pengiriman adalah simulasi demo.',
  apiBase: API_BASE,
};

export function listShipments() {
  return request('/shipments', SHIPMENTS);
}

export function findShipment(id) {
  return request(`/shipments/${encodeURIComponent(id)}`, getShipmentById(id));
}

export function quoteTransport(input) {
  const fallback = buildTransportPlans(input);
  return request('/quote', fallback, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
